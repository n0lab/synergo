import React from 'react';
import StatsCard from './StatsCard.jsx';
import SearchBar from './SearchBar.jsx';

export default function OracleOverview({
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

  return (
    <div className="oracle">
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
              >
                {t('oracleToReviewer')}
              </button>
              <button
                className="ghost purple"
                type="button"
                onClick={onAddResultsToQuizz}
                disabled={items.length === 0}
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

      <div className="grid">
        {items.map((item) => (
          <div className="card media-card" key={item.id} onClick={() => onSelect(item)}>
            <div className="media-type">{item.type === 'video' ? t('oracleVideoTag') : t('oraclePhotoTag')}</div>
            <h3>{item.title}</h3>
            <p className="description">{item.description}</p>
            <div className="tags">
              {item.tags.map((tag) => (
                <span className="badge" key={`${item.id}-${tag}`}>
                  {tag}
                </span>
              ))}
            </div>
          </div>
        ))}
        {items.length === 0 && <div className="muted">{t('oracleNoResults')}</div>}
      </div>
    </div>
  );
}
