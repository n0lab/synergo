// src/App.jsx (Server-side database version)
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Sidebar from './components/Sidebar.jsx';
import OracleOverview from './components/OracleOverview.jsx';
import ReviewerOverview from './components/ReviewerOverview.jsx';
import MediaDetail from './components/MediaDetail.jsx';
import Nomenclatures from './components/Nomenclatures.jsx';
import AddResource from './components/AddResource.jsx';
import Statistics from './components/Statistics.jsx';
import QuizMode, { QuizResults } from './components/QuizMode.jsx';
import Settings from './components/Settings.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import { ToastProvider, useToast } from './contexts/ToastContext.jsx';
import { useDebounce } from './hooks/useDebounce.js';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts.js';
import {
  getResourcePath,
  getFilenameFromPath
} from './db.js';
import * as api from './api.js';
import { translate } from './i18n.js';
import { fuzzySearch } from './utils/search.js';

const palette = {
  light: 'light',
  dark: 'dark',
};

const detectMediaType = (link) => {
  const normalized = (link ?? '').toLowerCase();
  const videoExtensions = ['.mp4', '.webm', '.mov', '.avi', '.mkv'];
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];

  if (normalized.startsWith('data:video')) return 'video';
  if (normalized.startsWith('data:image')) return 'photo';

  if (videoExtensions.some((ext) => normalized.includes(ext))) return 'video';
  if (imageExtensions.some((ext) => normalized.includes(ext))) return 'photo';
  return 'video';
};

function AppContent() {
  const toast = useToast();
  const [theme, setTheme] = useState(palette.dark);
  const [sidebarPinned, setSidebarPinned] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [section, setSection] = useState('oracle');
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [language, setLanguage] = useState('en');
  const [quizMode, setQuizMode] = useState(false);
  const [quizResults, setQuizResults] = useState(null);

  // Database state
  const [db, setDb] = useState({
    media: [],
    nomenclatures: [],
    reviewList: [],
    quizzList: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const t = useCallback((key, params) => translate(language, key, params), [language]);

  // Load database from server on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await api.loadDatabase();
        setDb(data);
        setError(null);
      } catch (err) {
        console.error('Failed to load database:', err);
        setError(err.message);
        toast.error(translate(language, 'toastServerConnectionError'));
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Debounce for search
  const debouncedQuery = useDebounce(query, 300);

  // Apply theme
  useEffect(() => {
    const { classList } = document.body;
    classList.remove(...Object.values(palette));
    classList.add(theme);
    return () => {
      classList.remove(theme);
    };
  }, [theme]);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    'Escape': () => {
      if (quizMode) {
        setQuizMode(false);
      } else if (quizResults) {
        setQuizResults(null);
      } else if (selectedMedia) {
        setSelectedMedia(null);
      }
    },
  });

  const stats = useMemo(() => {
    return db.media.reduce(
      (acc, item) => {
        if (item.type === 'video') acc.videos += 1;
        if (item.type === 'photo') acc.photos += 1;
        return acc;
      },
      { videos: 0, photos: 0 }
    );
  }, [db.media]);

  const orderedMedia = useMemo(() => {
    return [...db.media].sort((a, b) => {
      const lastChangeA = Math.max(a.updatedAt ?? 0, a.addedAt ?? 0);
      const lastChangeB = Math.max(b.updatedAt ?? 0, b.addedAt ?? 0);
      return lastChangeB - lastChangeA;
    });
  }, [db.media]);

  // Enrich media with full paths
  const enrichedMedia = useMemo(() => {
    return orderedMedia.map(item => ({
      ...item,
      displaySrc: getResourcePath(item.src)
    }));
  }, [orderedMedia]);

  const filteredMedia = useMemo(() => {
    let result = enrichedMedia;

    // Filter by type
    if (typeFilter !== 'all') {
      result = result.filter(item => item.type === typeFilter);
    }

    // Fuzzy search
    if (debouncedQuery.trim()) {
      result = fuzzySearch(result, debouncedQuery, {
        keys: ['title', 'description', 'tags'],
      });
    }

    return result;
  }, [enrichedMedia, debouncedQuery, typeFilter]);

  const navigateToOracleWithQuery = (value) => {
    setSection('oracle');
    setSelectedMedia(null);
    setQuery(value);
    setTypeFilter('all');
  };

  // Refresh database from server
  const refreshDb = async () => {
    try {
      const data = await api.loadDatabase();
      setDb(data);
    } catch (err) {
      console.error('Failed to refresh database:', err);
      toast.error(t('toastSyncError'));
    }
  };

  // Sync nomenclatures when tags/annotations are added
  const syncNomenclaturesFromMedia = async (media) => {
    const tags = new Set();
    media.tags?.forEach(tag => tags.add(tag));
    media.annotations?.forEach(ann => tags.add(ann.label));

    for (const label of tags) {
      try {
        await api.syncNomenclature({
          id: `seed-${label}`,
          label,
          description: '',
          interpretation: ''
        });
      } catch (err) {
        // Ignore errors for sync
      }
    }
  };

  const addTo = (listKey) => async (item) => {
    try {
      const exists = db[listKey].some((entry) => entry.id === item.id);
      const listName = listKey === 'reviewList' ? t('sidebarReviewer') : t('sidebarQuizz');
      if (exists) {
        toast.warning(t('toastAlreadyInList', { first: listName }));
        return;
      }

      if (listKey === 'reviewList') {
        await api.addToReviewList(item.id);
      } else {
        await api.addToQuizList(item.id);
      }

      await refreshDb();
      toast.success(t('toastAddedToList', { first: listName }));
    } catch (err) {
      console.error('Error adding to list:', err);
      toast.error(t('toastAddError'));
    }
  };

  const addManyToList = async (listKey, items) => {
    if (!items?.length) return;

    try {
      const existingIds = new Set(db[listKey].map((entry) => entry.id));
      const additions = items.filter((item) => !existingIds.has(item.id));

      if (additions.length === 0) {
        toast.info(t('toastAllItemsAlreadyInList'));
        return;
      }

      const mediaIds = additions.map(item => item.id);

      if (listKey === 'reviewList') {
        await api.addManyToReviewList(mediaIds);
      } else {
        await api.addManyToQuizList(mediaIds);
      }

      await refreshDb();
      toast.success(t('toastItemsAdded', { first: additions.length }));
    } catch (err) {
      console.error('Error adding to list:', err);
      toast.error(t('toastAddError'));
    }
  };

  const removeFromList = (listKey) => async (id) => {
    try {
      if (listKey === 'reviewList') {
        await api.removeFromReviewList(id);
      } else {
        await api.removeFromQuizList(id);
      }
      await refreshDb();
      toast.info(t('toastItemRemoved'));
    } catch (err) {
      console.error('Error removing from list:', err);
      toast.error(t('toastDeleteError'));
    }
  };

  const addNomenclature = async (entry) => {
    try {
      await api.createNomenclature(entry);
      await refreshDb();
      toast.success(t('toastNomenclatureAdded'));
    } catch (err) {
      console.error('Error adding nomenclature:', err);
      toast.error(t('toastAddError'));
    }
  };

  const findExistingResource = ({ title, src }) => {
    const normalizedTitle = title?.trim().toLowerCase();
    const normalizedSrc = getFilenameFromPath(src?.trim());

    return db.media.find((item) => {
      const sameTitle = normalizedTitle && item.title.trim().toLowerCase() === normalizedTitle;
      const sameSrc = normalizedSrc && getFilenameFromPath(item.src?.trim()) === normalizedSrc;
      return sameTitle || sameSrc;
    });
  };

  const addResource = async ({ title, description, src, filename, type, source, publicationDate }) => {
    try {
      const resolvedType = type || detectMediaType(src);
      const storedSrc = filename || getFilenameFromPath(src);

      const newMedia = await api.createMedia({
        title,
        description: description || '',
        src: storedSrc,
        type: resolvedType,
        tags: [],
        annotations: [],
        fps: resolvedType === 'video' ? 30 : undefined,
        source: source || '',
        publicationDate: publicationDate || ''
      });

      await refreshDb();
      toast.success(t('toastResourceAdded'));
      return newMedia;
    } catch (err) {
      console.error('Error adding resource:', err);
      toast.error(t('toastAddError'));
    }
  };

  const deleteResource = async (id) => {
    try {
      await api.deleteMedia(id);
      await refreshDb();
      setSelectedMedia((prev) => (prev?.id === id ? null : prev));
      toast.success(t('toastResourceDeleted'));
    } catch (err) {
      console.error('Error deleting resource:', err);
      toast.error(t('toastDeleteError'));
    }
  };

  const updateMediaItem = async (id, updater) => {
    try {
      const currentItem = db.media.find(m => m.id === id);
      if (!currentItem) return;

      const patch = typeof updater === 'function' ? updater(currentItem) : updater;

      // If src is modified, ensure we only store the filename
      const finalPatch = { ...patch };
      if (finalPatch.src) {
        finalPatch.src = getFilenameFromPath(finalPatch.src);
      }

      const updatedItem = await api.updateMedia(id, finalPatch);

      // Sync nomenclatures if tags/annotations changed
      if (patch.tags || patch.annotations) {
        await syncNomenclaturesFromMedia({ ...currentItem, ...finalPatch });
      }

      await refreshDb();

      setSelectedMedia((prev) => {
        if (prev?.id === id && updatedItem) {
          return { ...updatedItem, displaySrc: getResourcePath(updatedItem.src) };
        }
        return prev;
      });

      toast.success(t('toastChangesSaved'));
    } catch (err) {
      console.error('Error updating media:', err);
      toast.error(t('toastUpdateError'));
    }
  };

  const isNomenclatureUsed = (label) => {
    const normalized = label.trim().toLowerCase();
    return db.media.some((item) => {
      const inTags = item.tags?.some((tag) => tag.toLowerCase() === normalized);
      const inAnnotations = item.annotations?.some(
        (annotation) => annotation.label.toLowerCase() === normalized
      );
      return inTags || inAnnotations;
    });
  };

  const updateNomenclatureItem = async (id, patch) => {
    try {
      await api.updateNomenclature(id, patch);
      await refreshDb();
      toast.success(t('toastNomenclatureUpdated'));
    } catch (err) {
      console.error('Error updating nomenclature:', err);
      toast.error(t('toastUpdateError'));
    }
  };

  const deleteNomenclatureItem = async (id) => {
    try {
      await api.deleteNomenclature(id);
      await refreshDb();
      toast.success(t('toastNomenclatureDeleted'));
    } catch (err) {
      console.error('Error deleting nomenclature:', err);
      toast.error(t('toastDeleteError'));
    }
  };

  const handleImportDatabase = async (imported) => {
    try {
      await api.importDatabase(imported);
      await refreshDb();
      toast.success(t('toastDatabaseImported'));
    } catch (err) {
      console.error('Error importing database:', err);
      toast.error(t('toastImportError'));
    }
  };

  const handleResetDatabase = async () => {
    try {
      await api.resetDatabase();
      await refreshDb();
      setSection('oracle');
      setSelectedMedia(null);
      toast.warning(t('toastDatabaseReset'));
    } catch (err) {
      console.error('Error resetting database:', err);
      toast.error(t('toastResetError'));
    }
  };

  const startQuiz = () => {
    if (db.quizzList.length === 0) {
      toast.warning(t('toastNoQuizResources'));
      return;
    }
    setQuizMode(true);
    setQuizResults(null);
  };

  const handleQuizComplete = (results) => {
    setQuizMode(false);
    setQuizResults(results);
  };

  const navigation = useMemo(
    () => [
      { key: 'oracle', label: t('sidebarOracle') },
      { key: 'nomenclatures', label: t('sidebarNomenclatures') },
      { key: 'reviewer', label: t('sidebarReviewer') },
      { key: 'quizz', label: t('sidebarQuizz') },
      { key: 'statistics', label: t('statisticsTitle') },
      { key: 'settings', label: t('settingsTitle') },
    ],
    [t]
  );

  // Counts for sidebar badges
  const sidebarCounts = useMemo(() => ({
    reviewer: db.reviewList.length,
    quizz: db.quizzList.length,
  }), [db.reviewList.length, db.quizzList.length]);

  // Available tags for filtering
  const availableTags = useMemo(() => {
    const tagCounts = {};
    db.media.forEach(item => {
      item.tags?.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });
    return Object.entries(tagCounts)
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count);
  }, [db.media]);

  // Review and Quiz list IDs for quick lookup
  const reviewListIds = useMemo(() => db.reviewList.map(item => item.id), [db.reviewList]);
  const quizListIds = useMemo(() => db.quizzList.map(item => item.id), [db.quizzList]);

  // Show loading state
  if (loading) {
    return (
      <div className={`app ${theme}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <h2>{t('loadingTitle')}</h2>
          <p>{t('loadingSubtitle')}</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className={`app ${theme}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <h2>{t('connectionErrorTitle')}</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>{t('retryButton')}</button>
        </div>
      </div>
    );
  }

  const renderSection = () => {
    // Active Quiz mode
    if (quizMode) {
      const enrichedQuizItems = db.quizzList.map(item => ({
        ...item,
        displaySrc: getResourcePath(item.src)
      }));

      return (
        <QuizMode
          items={enrichedQuizItems}
          onComplete={handleQuizComplete}
          onBack={() => setQuizMode(false)}
          t={t}
        />
      );
    }

    // Quiz results
    if (quizResults) {
      return (
        <QuizResults
          results={quizResults}
          onRestart={startQuiz}
          onBack={() => {
            setQuizResults(null);
            setSection('quizz');
          }}
          t={t}
        />
      );
    }

    // Resource detail
    if (selectedMedia) {
      return (
        <MediaDetail
          media={selectedMedia}
          nomenclatures={db.nomenclatures}
          onBack={() => setSelectedMedia(null)}
          onToReview={addTo('reviewList')}
          onToQuizz={addTo('quizzList')}
          onUpdateMedia={updateMediaItem}
          onDeleteMedia={deleteResource}
          t={t}
        />
      );
    }

    // Main sections
    switch (section) {
      case 'nomenclatures':
        return (
          <Nomenclatures
            items={db.nomenclatures}
            onAdd={addNomenclature}
            onUpdate={updateNomenclatureItem}
            onDelete={deleteNomenclatureItem}
            onNavigate={navigateToOracleWithQuery}
            isNomenclatureUsed={isNomenclatureUsed}
            t={t}
            language={language}
          />
        );

      case 'reviewer':
        const enrichedReviewList = db.reviewList.map(item => ({
          ...item,
          displaySrc: getResourcePath(item.src)
        }));

        return (
          <ReviewerOverview
            items={enrichedReviewList}
            onSelect={(item) => {
              const enriched = { ...item, displaySrc: getResourcePath(item.src) };
              setSelectedMedia(enriched);
            }}
            onRemove={removeFromList('reviewList')}
            t={t}
          />
        );

      case 'quizz':
        const enrichedQuizzList = db.quizzList.map(item => ({
          ...item,
          displaySrc: getResourcePath(item.src)
        }));

        return (
          <div className="placeholder oracle">
            <div className="header-row">
              <div>
                <h2>{t('quizzTitle')}</h2>
                <p>{t('quizzPlaceholder')}</p>
              </div>
              <button
                className="primary"
                onClick={startQuiz}
                disabled={db.quizzList.length === 0}
              >
                {t('startQuizButton', { first: db.quizzList.length })}
              </button>
            </div>
            <div className="grid">
              {enrichedQuizzList.map((item) => (
                <div className="card media-card" key={item.id} onClick={() => setSelectedMedia(item)}>
                  <div className="media-type">
                    {item.type === 'video' ? t('oracleVideoTag') : t('oraclePhotoTag')}
                  </div>
                  <h3>{item.title}</h3>
                  <p className="description">{item.description}</p>
                </div>
              ))}
              {db.quizzList.length === 0 && <div className="muted">{t('reviewerEmpty')}</div>}
            </div>
          </div>
        );

      case 'statistics':
        return <Statistics media={db.media} nomenclatures={db.nomenclatures} t={t} />;

      case 'settings':
        return (
          <Settings
            db={db}
            onImport={handleImportDatabase}
            onReset={handleResetDatabase}
            t={t}
          />
        );

      case 'add-resource':
        return (
          <AddResource
            detectType={detectMediaType}
            findExistingResource={findExistingResource}
            uploadFile={api.uploadFile}
            t={t}
            onNavigateToResource={(resource) => {
              const enriched = { ...resource, displaySrc: getResourcePath(resource.src) };
              setSection('oracle');
              setSelectedMedia(enriched);
              setQuery('');
              setTypeFilter('all');
            }}
            onBack={() => {
              setSection('oracle');
              setSelectedMedia(null);
            }}
            onCreate={(payload) => {
              addResource(payload);
              setSection('oracle');
              setSelectedMedia(null);
              setQuery('');
              setTypeFilter('all');
            }}
          />
        );

      default: // oracle
        return (
          <OracleOverview
            stats={stats}
            query={query}
            onQueryChange={setQuery}
            items={filteredMedia}
            onSelect={(item) => setSelectedMedia(item)}
            activeType={typeFilter}
            onTypeChange={setTypeFilter}
            onAddResource={() => setSection('add-resource')}
            onAddResultsToReview={() => addManyToList('reviewList', filteredMedia)}
            onAddResultsToQuizz={() => addManyToList('quizzList', filteredMedia)}
            onAddToReview={(item) => addTo('reviewList')(item)}
            onAddToQuiz={(item) => addTo('quizzList')(item)}
            onQuickDelete={deleteResource}
            reviewListIds={reviewListIds}
            quizListIds={quizListIds}
            availableTags={availableTags}
            t={t}
          />
        );
    }
  };

  return (
    <div className={`app ${theme} ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <Sidebar
        sections={navigation}
        activeSection={section}
        onSelect={(key) => {
          setSection(key);
          setSelectedMedia(null);
          setQuizMode(false);
          setQuizResults(null);
        }}
        collapsed={sidebarCollapsed}
        pinned={sidebarPinned}
        onPinToggle={() =>
          setSidebarPinned((prev) => {
            const next = !prev;
            setSidebarCollapsed(!next);
            return next;
          })
        }
        onHoverStart={() => {
          if (!sidebarPinned) {
            setSidebarCollapsed(false);
          }
        }}
        onHoverEnd={() => {
          if (!sidebarPinned) {
            setSidebarCollapsed(true);
          }
        }}
        t={t}
        counts={sidebarCounts}
      />
      <main>
        <header className="topbar">
          <div />
          <div className="topbar-actions">
            <button className="ghost" onClick={() => setTheme((t) => (t === palette.dark ? palette.light : palette.dark))}>
              {theme === palette.dark ? t('themeLight') : t('themeDark')}
            </button>
            <button
              className="ghost"
              onClick={() => setLanguage((prev) => (prev === 'en' ? 'fr' : 'en'))}
            >
              {language === 'en' ? t('switchToFrench') : t('switchToEnglish')}
            </button>
          </div>
        </header>
        <section className="content">{renderSection()}</section>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </ErrorBoundary>
  );
}
