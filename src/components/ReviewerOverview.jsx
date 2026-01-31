import React, { useState, useEffect } from 'react';
import MediaCard from './MediaCard.jsx';

const GRID_SIZE_KEY = 'synergo-grid-size';

export default function ReviewerOverview({ items, onSelect, onRemove, t }) {
  const [gridSize, setGridSize] = useState(() => {
    const saved = localStorage.getItem(GRID_SIZE_KEY);
    return saved && ['small', 'medium', 'large'].includes(saved) ? saved : 'medium';
  });

  // Listen for storage changes to sync with Oracle page
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === GRID_SIZE_KEY && e.newValue) {
        if (['small', 'medium', 'large'].includes(e.newValue)) {
          setGridSize(e.newValue);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const gridSizeClass = `grid-${gridSize}`;

  return (
    <div className="oracle">
      <div className="header-row">
        <div>
          <h2>{t('reviewerTitle')}</h2>
          <p>{t('reviewerSubtitle')}</p>
        </div>
      </div>

      <div className={`grid ${gridSizeClass}`}>
        {items.map((item) => (
          <MediaCard
            key={item.id}
            item={item}
            onSelect={onSelect}
            videoLabel={t('oracleVideoTag')}
            photoLabel={t('oraclePhotoTag')}
            onRemoveFromList={() => onRemove(item.id)}
            removeLabel={t('reviewerRemove')}
            viewMode="grid"
          />
        ))}
        {items.length === 0 && <div className="muted">{t('reviewerEmpty')}</div>}
      </div>
    </div>
  );
}
