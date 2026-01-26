// src/components/QuizMode.jsx
import React, { useState, useMemo, useCallback } from 'react';

function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default function QuizMode({ items, onComplete, onBack, t }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [showAnswer, setShowAnswer] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);

  // Shuffle items at startup
  const quizItems = useMemo(() => shuffleArray(items), [items]);
  const currentItem = quizItems[currentIndex];

  // Generate answer options
  const options = useMemo(() => {
    if (!currentItem) return [];

    const correctAnswer = currentItem.title;
    const otherItems = quizItems.filter((item, idx) => idx !== currentIndex);
    const wrongAnswers = shuffleArray(otherItems)
      .slice(0, 3)
      .map(item => item.title);

    return shuffleArray([correctAnswer, ...wrongAnswers]);
  }, [currentItem, currentIndex, quizItems]);

  const handleAnswer = useCallback((option) => {
    const isCorrect = option === currentItem.title;

    setSelectedOption(option);
    setShowAnswer(true);

    if (isCorrect) {
      setScore(prev => prev + 1);
    }

    setAnswers(prev => [...prev, {
      item: currentItem,
      selectedAnswer: option,
      correctAnswer: currentItem.title,
      isCorrect
    }]);
  }, [currentItem]);

  const nextQuestion = useCallback(() => {
    if (currentIndex < quizItems.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setShowAnswer(false);
      setSelectedOption(null);
    } else {
      onComplete?.({
        score,
        total: quizItems.length,
        answers,
        percentage: Math.round((score / quizItems.length) * 100)
      });
    }
  }, [currentIndex, quizItems.length, score, answers, onComplete]);

  const skipQuestion = useCallback(() => {
    setAnswers(prev => [...prev, {
      item: currentItem,
      selectedAnswer: null,
      correctAnswer: currentItem.title,
      isCorrect: false
    }]);
    nextQuestion();
  }, [currentItem, nextQuestion]);

  if (!currentItem) {
    return (
      <div className="quiz-empty placeholder">
        <h2>{t('quizEmpty')}</h2>
        <p>{t('quizNoResources')}</p>
        <button className="ghost" onClick={onBack}>{t('quizBack')}</button>
      </div>
    );
  }

  const progress = ((currentIndex + 1) / quizItems.length) * 100;
  const mediaSrc = currentItem.displaySrc || currentItem.src;

  return (
    <div className="quiz-mode">
      <div className="quiz-header">
        <button className="ghost" onClick={onBack}>{t('quizExit')}</button>
        <div className="quiz-progress">
          <span className="quiz-counter">
            {t('quizQuestion')} {currentIndex + 1} / {quizItems.length}
          </span>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <span className="quiz-score">{t('quizScore')}: {score}</span>
        </div>
      </div>

      <div className="quiz-content card">
        <div className="quiz-media">
          {currentItem.type === 'video' ? (
            <video
              src={mediaSrc}
              controls
              className="quiz-video"
              key={currentItem.id}
            />
          ) : (
            <img
              src={mediaSrc}
              alt="Quiz question"
              className="quiz-image"
            />
          )}
        </div>

        <div className="quiz-question">
          <h2>{t('quizQuestionTitle')}</h2>

          {currentItem.description && !showAnswer && (
            <p className="quiz-hint muted">{t('quizHint', { first: currentItem.description })}</p>
          )}

          <div className="quiz-options">
            {options.map((option, index) => {
              const isSelected = selectedOption === option;
              const isCorrect = option === currentItem.title;
              const showCorrect = showAnswer && isCorrect;
              const showWrong = showAnswer && isSelected && !isCorrect;

              return (
                <button
                  key={index}
                  className={`quiz-option ${showCorrect ? 'correct' : ''} ${showWrong ? 'wrong' : ''} ${isSelected && !showAnswer ? 'selected' : ''}`}
                  onClick={() => !showAnswer && handleAnswer(option)}
                  disabled={showAnswer}
                >
                  <span className="option-letter">{String.fromCharCode(65 + index)}</span>
                  <span className="option-text">{option}</span>
                  {showCorrect && <span className="option-icon">✓</span>}
                  {showWrong && <span className="option-icon">✕</span>}
                </button>
              );
            })}
          </div>

          {showAnswer && (
            <div className="quiz-feedback">
              {selectedOption === currentItem.title ? (
                <div className="feedback-correct">
                  <h3>{t('quizCorrect')}</h3>
                  <p>{currentItem.description}</p>
                  {currentItem.tags.length > 0 && (
                    <div className="feedback-tags">
                      <strong>{t('quizTags')}</strong>
                      <div className="tags">
                        {currentItem.tags.map(tag => (
                          <span key={tag} className="badge">{tag}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="feedback-wrong">
                  <h3>{t('quizIncorrect')}</h3>
                  <p>{t('quizCorrectAnswerWas', { first: currentItem.title })}</p>
                  <p className="muted">{currentItem.description}</p>
                </div>
              )}
            </div>
          )}

          <div className="quiz-actions">
            {!showAnswer ? (
              <button className="ghost" onClick={skipQuestion}>
                {t('quizSkip')}
              </button>
            ) : (
              <button className="primary" onClick={nextQuestion}>
                {currentIndex < quizItems.length - 1 ? t('quizNextQuestion') : t('quizSeeResults')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function QuizResults({ results, onRestart, onBack, t }) {
  const { score, total, answers, percentage } = results;

  const grade = percentage >= 80 ? 'excellent' :
                percentage >= 60 ? 'good' :
                percentage >= 40 ? 'average' : 'poor';

  return (
    <div className="quiz-results oracle">
      <div className="header-row">
        <div>
          <h2>{t('quizResultsTitle')}</h2>
          <p>{t('quizResultsAnswered', { first: total })}</p>
        </div>
      </div>

      <div className="results-summary card">
        <div className={`results-grade grade-${grade}`}>
          <div className="grade-circle">
            <span className="grade-percentage">{percentage}%</span>
          </div>
          <div className="grade-details">
            <h3>{score} / {total}</h3>
            <p className="muted">
              {grade === 'excellent' && t('quizGradeExcellent')}
              {grade === 'good' && t('quizGradeGood')}
              {grade === 'average' && t('quizGradeAverage')}
              {grade === 'poor' && t('quizGradePoor')}
            </p>
          </div>
        </div>

        <div className="results-actions">
          <button className="primary" onClick={onRestart}>
            {t('quizRestart')}
          </button>
          <button className="ghost" onClick={onBack}>
            {t('quizBack')}
          </button>
        </div>
      </div>

      <div className="card">
        <h3>{t('quizAnswerDetails')}</h3>
        <div className="results-list">
          {answers.map((answer, index) => (
            <div key={index} className={`result-item ${answer.isCorrect ? 'correct' : 'wrong'}`}>
              <div className="result-number">{index + 1}</div>
              <div className="result-content">
                <h4>{answer.item.title}</h4>
                {!answer.isCorrect && answer.selectedAnswer && (
                  <p className="result-answer">
                    {t('quizYourAnswer')} <span className="wrong-answer">{answer.selectedAnswer}</span>
                  </p>
                )}
                {!answer.selectedAnswer && (
                  <p className="result-answer muted">{t('quizSkipped')}</p>
                )}
              </div>
              <div className="result-icon">
                {answer.isCorrect ? '✓' : '✕'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
