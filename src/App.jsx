import React, { useMemo, useState } from 'react';
import Sidebar from './components/Sidebar.jsx';
import OracleOverview from './components/OracleOverview.jsx';
import MediaDetail from './components/MediaDetail.jsx';
import { mediaLibrary } from './data.js';

const palette = {
  light: 'light',
  dark: 'dark',
};

export default function App() {
  const [theme, setTheme] = useState(palette.dark);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [section, setSection] = useState('oracle');
  const [query, setQuery] = useState('');
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [reviewList, setReviewList] = useState([]);
  const [quizzList, setQuizzList] = useState([]);

  const stats = useMemo(
    () => ({
      videos: mediaLibrary.filter((item) => item.type === 'video').length,
      photos: mediaLibrary.filter((item) => item.type === 'photo').length,
    }),
    []
  );

  const filteredMedia = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return mediaLibrary;
    return mediaLibrary.filter((item) =>
      item.tags.some((tag) => tag.toLowerCase().includes(normalized))
    );
  }, [query]);

  const addTo = (listSetter) => (item) => {
    listSetter((prev) => {
      if (prev.find((entry) => entry.id === item.id)) return prev;
      return [...prev, item];
    });
  };

  const renderSection = () => {
    if (section === 'reviewer') {
      return (
        <div className="placeholder">
          <h2>Reviewer</h2>
          <p>Éléments à revoir</p>
          <ul>
            {reviewList.map((item) => (
              <li key={`review-${item.id}`}>{item.title}</li>
            ))}
          </ul>
          {reviewList.length === 0 && <div className="muted">Aucun élément pour l'instant.</div>}
        </div>
      );
    }

    if (section === 'quizz') {
      return (
        <div className="placeholder">
          <h2>Quizz</h2>
          <p>Sélection pour quiz futur</p>
          <ul>
            {quizzList.map((item) => (
              <li key={`quiz-${item.id}`}>{item.title}</li>
            ))}
          </ul>
          {quizzList.length === 0 && <div className="muted">Aucun élément pour l'instant.</div>}
        </div>
      );
    }

    if (selectedMedia) {
      return (
        <MediaDetail
          media={selectedMedia}
          onBack={() => setSelectedMedia(null)}
          onToReview={addTo(setReviewList)}
          onToQuizz={addTo(setQuizzList)}
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
      />
    );
  };

  return (
    <div className={`app ${theme}`}>
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
