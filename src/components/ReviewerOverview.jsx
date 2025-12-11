import React from 'react';

export default function ReviewerOverview({ items, onSelect, onRemove, t }) {
  return (
    <div className="oracle">
      <div className="header-row">
        <div>
          <h2>{t('reviewerTitle')}</h2>
          <p>{t('reviewerSubtitle')}</p>
        </div>
      </div>

      <div className="grid">
        {items.map((item) => (
          <div className="card media-card" key={item.id} onClick={() => onSelect(item)}>
            <div className="media-card-header">
              <div className="media-type">{item.type === 'video' ? t('oracleVideoTag') : t('oraclePhotoTag')}</div>
              <button
                type="button"
                className="remove-review"
                onClick={(event) => {
                  event.stopPropagation();
                  onRemove(item.id);
                }}
                aria-label={t('reviewerRemove')}
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
        {items.length === 0 && <div className="muted">{t('reviewerEmpty')}</div>}
      </div>
    </div>
  );
}
