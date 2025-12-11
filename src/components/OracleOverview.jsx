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
}) {
  const hasQuery = query.trim().length > 0;

  return (
    <div className="oracle">
      <div className="header-row">
        <div>
          <h2>Oracle</h2>
          <p>Explorez les ressources de gestes non-verbaux et leurs nomenclatures.</p>
        </div>
        <div className="kpi-row">
          <button type="button" className="ghost success" onClick={onAddResource}>
            Ajouter
          </button>
          <StatsCard
            label="Vidéos"
            value={stats.videos}
            accent="#7f5af0"
            onClick={() => onTypeChange('video')}
            active={activeType === 'video'}
          />
          <StatsCard
            label="Photos"
            value={stats.photos}
            accent="#2cb67d"
            onClick={() => onTypeChange('photo')}
            active={activeType === 'photo'}
          />
        </div>
      </div>

      <div className="oracle-toolbar">
        <SearchBar value={query} onChange={onQueryChange} />
        <div className="oracle-actions">
          {hasQuery && (
            <>
              <button
                className="ghost"
                type="button"
                onClick={onAddResultsToReview}
                disabled={items.length === 0}
              >
                Vers reviewer
              </button>
              <button
                className="ghost"
                type="button"
                onClick={onAddResultsToQuizz}
                disabled={items.length === 0}
              >
                Vers quizz
              </button>
            </>
          )}
          {activeType !== 'all' && (
            <button className="ghost" type="button" onClick={() => onTypeChange('all')}>
              Réinitialiser le filtrage
            </button>
          )}
        </div>
      </div>

      <div className="grid">
        {items.map((item) => (
          <div className="card media-card" key={item.id} onClick={() => onSelect(item)}>
            <div className="media-type">{item.type === 'video' ? '🎬 Vidéo' : '📷 Photo'}</div>
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
        {items.length === 0 && <div className="muted">Aucun résultat pour cette nomenclature.</div>}
      </div>
    </div>
  );
}
