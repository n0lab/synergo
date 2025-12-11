import React from 'react';

export default function ReviewerOverview({ items, onSelect, onRemove }) {
  return (
    <div className="oracle">
      <div className="header-row">
        <div>
          <h2>Reviewer</h2>
          <p>Éléments à revoir, prêts à être ouverts ou retirés.</p>
        </div>
      </div>

      <div className="grid">
        {items.map((item) => (
          <div className="card media-card" key={item.id} onClick={() => onSelect(item)}>
            <div className="media-card-header">
              <div className="media-type">{item.type === 'video' ? '🎬 Vidéo' : '📷 Photo'}</div>
              <button
                type="button"
                className="remove-review"
                onClick={(event) => {
                  event.stopPropagation();
                  onRemove(item.id);
                }}
                aria-label="Retirer de la liste Reviewer"
              >
                ✕
              </button>
            </div>
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
        {items.length === 0 && <div className="muted">Aucun élément pour l'instant.</div>}
      </div>
    </div>
  );
}
