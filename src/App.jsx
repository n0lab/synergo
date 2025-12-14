import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Sidebar from './components/Sidebar.jsx';
import OracleOverview from './components/OracleOverview.jsx';
import ReviewerOverview from './components/ReviewerOverview.jsx';
import MediaDetail from './components/MediaDetail.jsx';
import Nomenclatures from './components/Nomenclatures.jsx';
import AddResource from './components/AddResource.jsx';
import { deriveNomenclaturesFromMedia, loadDatabase, persistDatabase } from './db.js';
import { translate } from './i18n.js';

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

export default function App() {
  const [theme, setTheme] = useState(palette.dark);
  const [sidebarPinned, setSidebarPinned] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [section, setSection] = useState('oracle');
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [language, setLanguage] = useState('en');
  const [db, setDb] = useState(() => {
    const initial = loadDatabase();
    return {
      ...initial,
      nomenclatures: syncNomenclaturesWithMedia(initial.media, initial.nomenclatures),
    };
  });

  const t = useCallback((key, params) => translate(language, key, params), [language]);

  useEffect(() => {
    persistDatabase(db);
  }, [db]);

  useEffect(() => {
    const { classList } = document.body;

    classList.remove(...Object.values(palette));
    classList.add(theme);

    return () => {
      classList.remove(theme);
    };
  }, [theme]);

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

  const filteredMedia = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const matchesQuery = (item) => {
      const inTags = item.tags.some((tag) => tag.toLowerCase().includes(normalized));
      const inTitle = item.title.toLowerCase().includes(normalized);
      const inDescription = (item.description || '').toLowerCase().includes(normalized);
      return inTags || inTitle || inDescription;
    };

    return orderedMedia.filter((item) => {
      const typeOk = typeFilter === 'all' ? true : item.type === typeFilter;
      if (!normalized) return typeOk;
      return typeOk && matchesQuery(item);
    });
  }, [orderedMedia, query, typeFilter]);

  const navigateToOracleWithQuery = (value) => {
    setSection('oracle');
    setSelectedMedia(null);
    setQuery(value);
    setTypeFilter('all');
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
      if (exists) return prev;
      return { ...prev, [listKey]: [...prev[listKey], item] };
    });
  };

  const addManyToList = (listKey, items) => {
    if (!items?.length) return;

    updateDb((prev) => {
      const existingIds = new Set(prev[listKey].map((entry) => entry.id));
      const additions = items.filter((item) => !existingIds.has(item.id));

      if (additions.length === 0) return prev;
      return { ...prev, [listKey]: [...prev[listKey], ...additions] };
    });
  };

  const removeFromList = (listKey) => (id) =>
    updateDb((prev) => ({
      ...prev,
      [listKey]: prev[listKey].filter((entry) => entry.id !== id),
    }));

  const addNomenclature = (entry) =>
    updateDb((prev) => ({
      ...prev,
      nomenclatures: [...prev.nomenclatures, { id: `user-${Date.now()}-${entry.label}`, ...entry }],
    }));

  const findExistingResource = ({ title, src }) => {
    const normalizedTitle = title?.trim().toLowerCase();
    const normalizedSrc = src?.trim();

    return db.media.find((item) => {
      const sameTitle = normalizedTitle && item.title.trim().toLowerCase() === normalizedTitle;
      const sameSrc = normalizedSrc && item.src?.trim() === normalizedSrc;
      return sameTitle || sameSrc;
    });
  };

  const addResource = ({ title, description, src, type }) => {
    const resolvedType = type || detectMediaType(src);
    const timestamp = Date.now();
    const newEntry = {
      id: `user-media-${timestamp}`,
      title,
      description,
      src,
      type: resolvedType,
      tags: [],
      annotations: [],
      addedAt: timestamp,
      updatedAt: timestamp,
      ...(resolvedType === 'video' ? { fps: 30 } : {}),
    };

    updateDb((prev) => ({ ...prev, media: [newEntry, ...prev.media] }));
  };

  const deleteResource = (id) => {
    updateDb((prev) => ({
      ...prev,
      media: prev.media.filter((item) => item.id !== id),
      reviewList: prev.reviewList.filter((item) => item.id !== id),
      quizzList: prev.quizzList.filter((item) => item.id !== id),
    }));

    setSelectedMedia((prev) => (prev?.id === id ? null : prev));
  };

  const updateMedia = (id, updater) => {
    let updatedItem = null;
    updateDb((prev) => {
      const timestamp = Date.now();
      const nextMedia = prev.media.map((item) => {
        if (item.id !== id) return item;
        const patch = typeof updater === 'function' ? updater(item) : updater;
        updatedItem = { ...item, ...patch, updatedAt: timestamp };
        return updatedItem;
      });
      return { ...prev, media: nextMedia };
    });

    setSelectedMedia((prev) => {
      if (prev?.id === id && updatedItem) {
        return updatedItem;
      }
      return prev;
    });
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

  const updateNomenclature = (id, patch) =>
    updateDb((prev) => ({
      ...prev,
      nomenclatures: prev.nomenclatures.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    }));

  const deleteNomenclature = (id) =>
    updateDb((prev) => ({
      ...prev,
      nomenclatures: prev.nomenclatures.filter((item) => item.id !== id),
    }));

  const renderSection = () => {
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

    if (section === 'nomenclatures') {
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
    }

    if (section === 'reviewer') {
      return (
        <ReviewerOverview
          items={db.reviewList}
          onSelect={setSelectedMedia}
          onRemove={removeFromList('reviewList')}
          t={t}
        />
      );
    }

    if (section === 'quizz') {
      return (
        <div className="placeholder">
          <h2>{t('quizzTitle')}</h2>
          <p>{t('quizzPlaceholder')}</p>
          <ul>
            {db.quizzList.map((item) => (
              <li key={`quiz-${item.id}`}>{item.title}</li>
            ))}
          </ul>
          {db.quizzList.length === 0 && <div className="muted">{t('reviewerEmpty')}</div>}
        </div>
      );
    }

    if (section === 'add-resource') {
      return (
        <AddResource
          detectType={detectMediaType}
          findExistingResource={findExistingResource}
          t={t}
          onNavigateToResource={(resource) => {
            setSection('oracle');
            setSelectedMedia(resource);
            setQuery('');
            setTypeFilter('all');
          }}
          onBack={() => {
            setSection('oracle');
            setSelectedMedia(null);
          }}
          onCreate={(payload) => {
            addResource({ ...payload, type: detectMediaType(payload.src) });
            setSection('oracle');
            setSelectedMedia(null);
            setQuery('');
            setTypeFilter('all');
          }}
        />
      );
    }

    return (
      <OracleOverview
        stats={stats}
        query={query}
        onQueryChange={setQuery}
        items={filteredMedia}
        onSelect={setSelectedMedia}
        activeType={typeFilter}
        onTypeChange={setTypeFilter}
        onAddResource={() => setSection('add-resource')}
        onAddResultsToReview={() => addManyToList('reviewList', filteredMedia)}
        onAddResultsToQuizz={() => addManyToList('quizzList', filteredMedia)}
        t={t}
        language={language}
      />
    );
  };

  const navigation = useMemo(
    () => [
      { key: 'oracle', label: t('sidebarOracle'), icon: '🔮' },
      { key: 'nomenclatures', label: t('sidebarNomenclatures'), icon: '🏷️' },
      { key: 'reviewer', label: t('sidebarReviewer'), icon: '📝' },
      { key: 'quizz', label: t('sidebarQuizz'), icon: '❓' },
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
