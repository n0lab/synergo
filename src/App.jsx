import React, { useEffect, useMemo, useState } from 'react';
import Sidebar from './components/Sidebar.jsx';
import OracleOverview from './components/OracleOverview.jsx';
import MediaDetail from './components/MediaDetail.jsx';
import Nomenclatures from './components/Nomenclatures.jsx';
import { loadDatabase, persistDatabase } from './db.js';

const palette = {
  light: 'light',
  dark: 'dark',
};

export default function App() {
  const [theme, setTheme] = useState(palette.dark);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [section, setSection] = useState('oracle');
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [db, setDb] = useState(() => loadDatabase());

  useEffect(() => {
    persistDatabase(db);
  }, [db]);

  const stats = useMemo(
    () => ({
      videos: db.media.filter((item) => item.type === 'video').length,
      photos: db.media.filter((item) => item.type === 'photo').length,
    }),
    [db.media]
  );

  const filteredMedia = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const matchesQuery = (item) =>
      item.tags.some((tag) => tag.toLowerCase().includes(normalized));

    return db.media.filter((item) => {
      const typeOk = typeFilter === 'all' ? true : item.type === typeFilter;
      if (!normalized) return typeOk;
      return typeOk && matchesQuery(item);
    });
  }, [db.media, query, typeFilter]);

  const navigateToOracleWithQuery = (value) => {
    setSection('oracle');
    setSelectedMedia(null);
    setQuery(value);
    setTypeFilter('all');
  };

  const updateDb = (updater) => {
    setDb((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
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

  const addNomenclature = (entry) =>
    updateDb((prev) => ({
      ...prev,
      nomenclatures: [...prev.nomenclatures, { id: `user-${Date.now()}-${entry.label}`, ...entry }],
    }));

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
    if (section === 'nomenclatures') {
      return (
        <Nomenclatures
          items={db.nomenclatures}
          onAdd={addNomenclature}
          onUpdate={updateNomenclature}
          onDelete={deleteNomenclature}
          onNavigate={navigateToOracleWithQuery}
        />
      );
    }

    if (section === 'reviewer') {
      return (
        <div className="placeholder">
          <h2>Reviewer</h2>
          <p>Éléments à revoir</p>
          <ul>
            {db.reviewList.map((item) => (
              <li key={`review-${item.id}`}>{item.title}</li>
            ))}
          </ul>
          {db.reviewList.length === 0 && <div className="muted">Aucun élément pour l'instant.</div>}
        </div>
      );
    }

    if (section === 'quizz') {
      return (
        <div className="placeholder">
          <h2>Quizz</h2>
          <p>Sélection pour quiz futur</p>
          <ul>
            {db.quizzList.map((item) => (
              <li key={`quiz-${item.id}`}>{item.title}</li>
            ))}
          </ul>
          {db.quizzList.length === 0 && <div className="muted">Aucun élément pour l'instant.</div>}
        </div>
      );
    }

    if (selectedMedia) {
      return (
        <MediaDetail
          media={selectedMedia}
          onBack={() => setSelectedMedia(null)}
          onToReview={addTo('reviewList')}
          onToQuizz={addTo('quizzList')}
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
      />
    );
  };

  return (
    <div className={`app ${theme} ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <Sidebar
        activeSection={section}
        onSelect={(key) => {
          setSection(key);
          setSelectedMedia(null);
        }}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((c) => !c)}
      />
      <main>
        <header className="topbar">
          <div />
          <div className="topbar-actions">
            <button className="ghost" onClick={() => setTheme((t) => (t === palette.dark ? palette.light : palette.dark))}>
              {theme === palette.dark ? 'Mode clair' : 'Mode sombre'}
            </button>
          </div>
        </header>
        <section className="content">{renderSection()}</section>
      </main>
    </div>
  );
}
