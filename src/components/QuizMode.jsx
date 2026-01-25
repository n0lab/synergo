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

  // Mélanger les items au démarrage
  const quizItems = useMemo(() => shuffleArray(items), [items]);
  const currentItem = quizItems[currentIndex];

  // Générer des options de réponse
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
        <h2>Quiz vide</h2>
        <p>Aucune ressource disponible pour le quiz.</p>
        <button className="ghost" onClick={onBack}>Retour</button>
      </div>
    );
  }

  const progress = ((currentIndex + 1) / quizItems.length) * 100;
  const mediaSrc = currentItem.displaySrc || currentItem.src;

  return (
    <div className="quiz-mode">
      <div className="quiz-header">
        <button className="ghost" onClick={onBack}>← Quitter le quiz</button>
        <div className="quiz-progress">
          <span className="quiz-counter">
            Question {currentIndex + 1} / {quizItems.length}
          </span>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <span className="quiz-score">Score: {score}</span>
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
          <h2>Quel est le nom de ce geste non-verbal ?</h2>
          
          {currentItem.description && !showAnswer && (
            <p className="quiz-hint muted">💡 Indice: {currentItem.description}</p>
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
                  <h3>🎉 Correct !</h3>
                  <p>{currentItem.description}</p>
                  {currentItem.tags.length > 0 && (
                    <div className="feedback-tags">
                      <strong>Tags:</strong>
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
                  <h3>❌ Incorrect</h3>
                  <p>La bonne réponse était: <strong>{currentItem.title}</strong></p>
                  <p className="muted">{currentItem.description}</p>
                </div>
              )}
            </div>
          )}

          <div className="quiz-actions">
            {!showAnswer ? (
              <button className="ghost" onClick={skipQuestion}>
                Passer
              </button>
            ) : (
              <button className="primary" onClick={nextQuestion}>
                {currentIndex < quizItems.length - 1 ? 'Question suivante' : 'Voir les résultats'}
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
          <h2>🎯 Résultats du Quiz</h2>
          <p>Vous avez répondu à {total} questions</p>
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
              {grade === 'excellent' && '🌟 Excellent travail !'}
              {grade === 'good' && '👍 Bon travail !'}
              {grade === 'average' && '📚 Continuez à pratiquer !'}
              {grade === 'poor' && '💪 Il faut réviser !'}
            </p>
          </div>
        </div>

        <div className="results-actions">
          <button className="primary" onClick={onRestart}>
            Recommencer le quiz
          </button>
          <button className="ghost" onClick={onBack}>
            Retour
          </button>
        </div>
      </div>

      <div className="card">
        <h3>📋 Détails des réponses</h3>
        <div className="results-list">
          {answers.map((answer, index) => (
            <div key={index} className={`result-item ${answer.isCorrect ? 'correct' : 'wrong'}`}>
              <div className="result-number">{index + 1}</div>
              <div className="result-content">
                <h4>{answer.item.title}</h4>
                {!answer.isCorrect && answer.selectedAnswer && (
                  <p className="result-answer">
                    Votre réponse: <span className="wrong-answer">{answer.selectedAnswer}</span>
                  </p>
                )}
                {!answer.selectedAnswer && (
                  <p className="result-answer muted">Question passée</p>
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
