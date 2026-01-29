import React, { useState, useMemo } from 'react';
import MediaCard from './MediaCard.jsx';

export default function QuizOverview({
  items,
  nomenclatures,
  onSelect,
  onRemove,
  onStartQuiz,
  t
}) {
  const [questionCount, setQuestionCount] = useState(10);

  // Calculate the maximum possible questions based on available data
  const maxQuestions = useMemo(() => {
    // Get all tags from quiz items
    const quizTags = new Set();
    items.forEach(item => {
      item.tags?.forEach(tag => quizTags.add(tag.toLowerCase()));
    });

    // Get nomenclatures used in quiz items with description/interpretation
    const usedNomenclatures = nomenclatures.filter(n =>
      quizTags.has(n.label.toLowerCase())
    );

    // Type 1: Identification (need items with tags)
    const itemsWithTags = items.filter(item => item.tags?.length > 0);
    const type1Count = itemsWithTags.length;

    // Type 2: Description (need nomenclatures with description)
    const nomenclaturesWithDescription = usedNomenclatures.filter(n => n.description?.trim());
    const type2Count = nomenclaturesWithDescription.length;

    // Type 3: Interpretation (need nomenclatures with interpretation)
    const nomenclaturesWithInterpretation = usedNomenclatures.filter(n => n.interpretation?.trim());
    const type3Count = nomenclaturesWithInterpretation.length;

    return type1Count + type2Count + type3Count;
  }, [items, nomenclatures]);

  // Ensure questionCount doesn't exceed maxQuestions
  const effectiveQuestionCount = Math.min(questionCount, maxQuestions);

  const handleStartQuiz = () => {
    onStartQuiz(effectiveQuestionCount);
  };

  const canStartQuiz = items.length > 0 && maxQuestions > 0;

  return (
    <div className="oracle">
      <div className="header-row">
        <div>
          <h2>{t('quizzTitle')}</h2>
          <p>{t('quizzPlaceholder')}</p>
        </div>
        <div className="quiz-config">
          <div className="quiz-question-count">
            <label htmlFor="question-count">{t('quizQuestionCountLabel')}</label>
            <input
              id="question-count"
              type="number"
              min="1"
              max={maxQuestions || 1}
              value={effectiveQuestionCount}
              onChange={(e) => setQuestionCount(Math.max(1, parseInt(e.target.value) || 1))}
              disabled={!canStartQuiz}
            />
            <span className="quiz-max-info">
              {t('quizMaxQuestions', { first: maxQuestions })}
            </span>
          </div>
          <button
            className="primary"
            onClick={handleStartQuiz}
            disabled={!canStartQuiz}
          >
            {t('startQuizButton', { first: items.length })}
          </button>
        </div>
      </div>

      {maxQuestions === 0 && items.length > 0 && (
        <div className="quiz-warning card">
          <p>{t('quizNoValidQuestions')}</p>
        </div>
      )}

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
