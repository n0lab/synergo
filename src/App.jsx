// src/App.jsx (Enhanced Version with Resources Folder)
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
import CategoryFilter from './components/CategoryFilter.jsx';
import { ToastProvider, useToast } from './contexts/ToastContext.jsx';
import { useDebounce } from './hooks/useDebounce.js';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts.js';
import { 
  deriveNomenclaturesFromMedia, 
  loadDatabase, 
  persistDatabase, 
  resetDatabase,
  getResourcePath,
  getFilenameFromPath,
  generateUniqueFilename
} from './db.js';
import { translate } from './i18n.js';
import { fuzzySearch, filterByCategory } from './utils/search.js';

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

const syncNomenclaturesWithMedia = (media, nomenclatures) => {
  const seeds = deriveNomenclaturesFromMedia(media);
  const byLabel = new Map(
    (nomenclatures ?? []).map((entry) => [entry.label.toLowerCase(), entry])
  );
  let changed = false;

  seeds.forEach((seed) => {
    if (!byLabel.has(seed.label.toLowerCase())) {
      byLabel.set(seed.label.toLowerCase(), seed);
      changed = true;
    }
  });

  if (!changed) return nomenclatures;
  return Array.from(byLabel.values());
};

function AppContent() {
  const toast = useToast();
  const [theme, setTheme] = useState(palette.dark);
  const [sidebarPinned, setSidebarPinned] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [section, setSection] = useState('oracle');
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState(null);
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [language, setLanguage] = useState('en');
  const [quizMode, setQuizMode] = useState(false);
  const [quizResults, setQuizResults] = useState(null);
  
  const [db, setDb] = useState(() => {
    const initial = loadDatabase();
    return {
      ...initial,
      nomenclatures: syncNomenclaturesWithMedia(initial.media, initial.nomenclatures),
    };
  });

  const t = useCallback((key, params) => translate(language, key, params), [language]);

  // Debounce pour la recherche
  const debouncedQuery = useDebounce(query, 300);

  // Sauvegarder la DB automatiquement
  useEffect(() => {
    persistDatabase(db);
  }, [db]);

  // Appliquer le thème
  useEffect(() => {
    const { classList } = document.body;
    classList.remove(...Object.values(palette));
    classList.add(theme);
    return () => {
      classList.remove(theme);
    };
  }, [theme]);

  // Raccourcis clavier
  useKeyboardShortcuts({
    'Ctrl+k': () => {
      setSection('oracle');
      setSelectedMedia(null);
      setQuizMode(false);
      setQuizResults(null);
    },
    'Ctrl+n': () => {
      setSection('add-resource');
      setSelectedMedia(null);
    },
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

  // Enrichir les médias avec les chemins complets
  const enrichedMedia = useMemo(() => {
    return orderedMedia.map(item => ({
      ...item,
      displaySrc: getResourcePath(item.src)
    }));
  }, [orderedMedia]);

  const filteredMedia = useMemo(() => {
    let result = enrichedMedia;

    // Filtre par type
    if (typeFilter !== 'all') {
      result = result.filter(item => item.type === typeFilter);
    }

    // Filtre par catégorie
    if (categoryFilter) {
      result = filterByCategory(result, categoryFilter);
    }

    // Recherche fuzzy
    if (debouncedQuery.trim()) {
      result = fuzzySearch(result, debouncedQuery, {
        keys: ['title', 'description', 'tags'],
      });
    }

    return result;
  }, [enrichedMedia, debouncedQuery, typeFilter, categoryFilter]);

  const navigateToOracleWithQuery = (value) => {
    setSection('oracle');
    setSelectedMedia(null);
    setQuery(value);
    setTypeFilter('all');
    setCategoryFilter(null);
  };

  const updateDb = (updater) => {
    setDb((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      const syncedNomenclatures = syncNomenclaturesWithMedia(
        next.media,
        next.nomenclatures
      );

      if (syncedNomenclatures !== next.nomenclatures) {
        return { ...next, nomenclatures: syncedNomenclatures };
      }

      return next;
    });
  };

  const addTo = (listKey) => (item) => {
    updateDb((prev) => {
      const exists = prev[listKey].some((entry) => entry.id === item.id);
      if (exists) {
        toast.warning(`Déjà dans ${listKey === 'reviewList' ? 'Reviewer' : 'Quiz'}`);
        return prev;
      }
      toast.success(`Ajouté à ${listKey === 'reviewList' ? 'Reviewer' : 'Quiz'}`);
      return { ...prev, [listKey]: [...prev[listKey], item] };
    });
  };

  const addManyToList = (listKey, items) => {
    if (!items?.length) return;

    updateDb((prev) => {
      const existingIds = new Set(prev[listKey].map((entry) => entry.id));
      const additions = items.filter((item) => !existingIds.has(item.id));

      if (additions.length === 0) {
        toast.info('Tous les éléments sont déjà dans la liste');
        return prev;
      }
      
      toast.success(`${additions.length} élément(s) ajouté(s)`);
      return { ...prev, [listKey]: [...prev[listKey], ...additions] };
    });
  };

  const removeFromList = (listKey) => (id) => {
    updateDb((prev) => ({
      ...prev,
      [listKey]: prev[listKey].filter((entry) => entry.id !== id),
    }));
    toast.info('Élément retiré');
  };

  const addNomenclature = (entry) => {
    updateDb((prev) => ({
      ...prev,
      nomenclatures: [...prev.nomenclatures, { id: `user-${Date.now()}-${entry.label}`, ...entry }],
    }));
    toast.success('Nomenclature ajoutée');
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

  const addResource = ({ title, description, src, filename, type }) => {
    const resolvedType = type || detectMediaType(src);
    const timestamp = Date.now();
    
    // Stocker uniquement le nom de fichier, pas le chemin complet
    const storedSrc = filename || getFilenameFromPath(src);
    
    const newEntry = {
      id: `user-media-${timestamp}`,
      title,
      description,
      src: storedSrc,
      type: resolvedType,
      tags: [],
      annotations: [],
      addedAt: timestamp,
      updatedAt: timestamp,
      ...(resolvedType === 'video' ? { fps: 30 } : {}),
    };

    updateDb((prev) => ({ ...prev, media: [newEntry, ...prev.media] }));
    toast.success('Ressource ajoutée');
  };

  const deleteResource = (id) => {
    updateDb((prev) => ({
      ...prev,
      media: prev.media.filter((item) => item.id !== id),
      reviewList: prev.reviewList.filter((item) => item.id !== id),
      quizzList: prev.quizzList.filter((item) => item.id !== id),
    }));

    setSelectedMedia((prev) => (prev?.id === id ? null : prev));
    toast.success('Ressource supprimée');
  };

  const updateMedia = (id, updater) => {
    let updatedItem = null;
    updateDb((prev) => {
      const timestamp = Date.now();
      const nextMedia = prev.media.map((item) => {
        if (item.id !== id) return item;
        const patch = typeof updater === 'function' ? updater(item) : updater;
        
        // Si le src est modifié, s'assurer qu'on stocke seulement le nom de fichier
        const finalPatch = { ...patch };
        if (finalPatch.src) {
          finalPatch.src = getFilenameFromPath(finalPatch.src);
        }
        
        updatedItem = { ...item, ...finalPatch, updatedAt: timestamp };
        return updatedItem;
      });
      return { ...prev, media: nextMedia };
    });

    setSelectedMedia((prev) => {
      if (prev?.id === id && updatedItem) {
        return { ...updatedItem, displaySrc: getResourcePath(updatedItem.src) };
      }
      return prev;
    });
    
    toast.success('Modifications enregistrées');
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

  const updateNomenclature = (id, patch) => {
    updateDb((prev) => ({
      ...prev,
      nomenclatures: prev.nomenclatures.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    }));
    toast.success('Nomenclature mise à jour');
  };

  const deleteNomenclature = (id) => {
    updateDb((prev) => ({
      ...prev,
      nomenclatures: prev.nomenclatures.filter((item) => item.id !== id),
    }));
    toast.success('Nomenclature supprimée');
  };

  const handleImportDatabase = (imported) => {
    setDb({
      ...imported,
      nomenclatures: syncNomenclaturesWithMedia(imported.media, imported.nomenclatures),
    });
    toast.success('Base de données importée');
  };

  const handleResetDatabase = () => {
    const fresh = resetDatabase();
    setDb({
      ...fresh,
      nomenclatures: syncNomenclaturesWithMedia(fresh.media, fresh.nomenclatures),
    });
    setSection('oracle');
    setSelectedMedia(null);
    toast.warning('Base de données réinitialisée');
  };

  const startQuiz = () => {
    if (db.quizzList.length === 0) {
      toast.warning('Aucune ressource dans la liste Quiz');
      return;
    }
    setQuizMode(true);
    setQuizResults(null);
  };

  const handleQuizComplete = (results) => {
    setQuizMode(false);
    setQuizResults(results);
  };

  const renderSection = () => {
    // Mode Quiz actif
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

    // Résultats du Quiz
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

    // Détail d'une ressource
    if (selectedMedia) {
      return (
        <MediaDetail
          media={selectedMedia}
          nomenclatures={db.nomenclatures}
          onBack={() => setSelectedMedia(null)}
          onToReview={addTo('reviewList')}
          onToQuizz={addTo('quizzList')}
          onUpdateMedia={updateMedia}
          onDeleteMedia={deleteResource}
          t={t}
        />
      );
    }

    // Sections principales
    switch (section) {
      case 'nomenclatures':
        return (
          <Nomenclatures
            items={db.nomenclatures}
            onAdd={addNomenclature}
            onUpdate={updateNomenclature}
            onDelete={deleteNomenclature}
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
                🎯 Démarrer le Quiz ({db.quizzList.length})
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
            generateUniqueFilename={generateUniqueFilename}
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
          <>
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
              t={t}
              language={language}
            />
            <div style={{ marginTop: '16px' }}>
              <CategoryFilter
                media={db.media}
                onFilterChange={setCategoryFilter}
                t={t}
              />
            </div>
          </>
        );
    }
  };

  const navigation = useMemo(
    () => [
      { key: 'oracle', label: t('sidebarOracle'), icon: '🔮' },
      { key: 'nomenclatures', label: t('sidebarNomenclatures'), icon: '🏷️' },
      { key: 'reviewer', label: t('sidebarReviewer'), icon: '📝' },
      { key: 'quizz', label: t('sidebarQuizz'), icon: '❓' },
      { key: 'statistics', label: t('statisticsTitle') || 'Statistiques', icon: '📊' },
      { key: 'settings', label: t('settingsTitle') || 'Paramètres', icon: '⚙️' },
    ],
    [t]
  );

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
