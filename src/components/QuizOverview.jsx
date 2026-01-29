import React from 'react';
import MediaCard from './MediaCard.jsx';

export default function QuizOverview({
  items,
  onSelect,
  onRemove,
  onStartQuiz,
  t
}) {
  return (
    <div className="oracle">
      <div className="header-row">
        <div>
          <h2>{t('quizzTitle')}</h2>
          <p>{t('quizzPlaceholder')}</p>
        </div>
        <button
          className="primary"
          onClick={onStartQuiz}
          disabled={items.length === 0}
        >
          {t('startQuizButton', { first: items.length })}
        </button>
      </div>

      <div className="grid">
        {items.map((item) => (
          <MediaCard
            key={item.id}
            item={item}
            onSelect={onSelect}
            videoLabel={t('oracleVideoTag')}
            photoLabel={t('oraclePhotoTag')}
            onRemoveFromList={() => onRemove(item.id)}
            removeLabel={t('quizRemove')}
            viewMode="grid"
          />
        ))}
        {items.length === 0 && <div className="muted">{t('reviewerEmpty')}</div>}
      </div>
    </div>
  );
}
