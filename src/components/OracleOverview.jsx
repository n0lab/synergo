import React, { memo, useMemo } from 'react';
import StatsCard from './StatsCard.jsx';
import SearchBar from './SearchBar.jsx';
import MediaCard from './MediaCard.jsx';

/**
 * OracleOverview - Main media browsing view
 * Uses memoized MediaCard components for better performance
 */
const OracleOverview = memo(function OracleOverview({
  stats,
  query,
  onQueryChange,
  items,
  onSelect,
  activeType,
  onTypeChange,
  onAddResource,
  onAddResultsToReview,
  onAddResultsToQuizz,
  t,
}) {
  const hasQuery = query.trim().length > 0;

  // Memoize labels to prevent MediaCard re-renders
  const videoLabel = useMemo(() => t('oracleVideoTag'), [t]);
  const photoLabel = useMemo(() => t('oraclePhotoTag'), [t]);

  return (
    <div className="oracle" role="main" aria-label="Media library">
      <div className="header-row">
        <div>
          <h2>{t('oracleTitle')}</h2>
          <p>{t('oracleSubtitle')}</p>
        </div>
        <div className="kpi-row">
          {hasQuery && (
            <>
              <button
                className="ghost info"
                type="button"
                onClick={onAddResultsToReview}
                disabled={items.length === 0}
                aria-label={`${t('oracleToReviewer')} (${items.length} items)`}
              >
                {t('oracleToReviewer')}
              </button>
              <button
                className="ghost purple"
                type="button"
                onClick={onAddResultsToQuizz}
                disabled={items.length === 0}
                aria-label={`${t('oracleToQuizz')} (${items.length} items)`}
              >
                {t('oracleToQuizz')}
              </button>
            </>
          )}
          <button type="button" className="ghost success" onClick={onAddResource}>
            {t('oracleAdd')}
          </button>
          <StatsCard
            label={t('oracleVideos')}
            value={stats.videos}
            accent="#7f5af0"
            onClick={() => onTypeChange('video')}
            active={activeType === 'video'}
          />
          <StatsCard
            label={t('oraclePhotos')}
            value={stats.photos}
            accent="#2cb67d"
            onClick={() => onTypeChange('photo')}
            active={activeType === 'photo'}
          />
        </div>
      </div>

      <div className="oracle-toolbar">
        <SearchBar value={query} onChange={onQueryChange} t={t} />
        <div className="oracle-actions">
          {activeType !== 'all' && (
            <button className="ghost" type="button" onClick={() => onTypeChange('all')}>
              {t('oracleResetFilter')}
            </button>
          )}
        </div>
      </div>

      <div
        className="grid"
        role="grid"
        aria-label={`Media items (${items.length} results)`}
      >
        {items.map((item) => (
          <MediaCard
            key={item.id}
            item={item}
            onSelect={onSelect}
            videoLabel={videoLabel}
            photoLabel={photoLabel}
          />
        ))}
        {items.length === 0 && (
          <div className="muted" role="status">
            {t('oracleNoResults')}
          </div>
        )}
      </div>
    </div>
  );
});

export default OracleOverview;
