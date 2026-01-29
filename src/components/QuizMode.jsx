// src/components/QuizMode.jsx
import React, { useState, useMemo, useCallback } from 'react';
import { findSimilarToMultiple } from '../utils/similarity.js';

// Question types
const QUESTION_TYPES = {
  IDENTIFICATION: 'identification', // Type 1: Show media, ask which tags/nomenclatures are visible
  DESCRIPTION: 'description',       // Type 2: Show nomenclature label, ask for its description
  INTERPRETATION: 'interpretation'  // Type 3: Show nomenclature label, ask for its interpretation
};

function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Generate quiz questions based on available data
 * @param {Array} items - Media items in quiz list
 * @param {Array} nomenclatures - All nomenclatures
 * @param {number} questionCount - Number of questions to generate
 * @returns {Array} - Array of question objects
 */
function generateQuestions(items, nomenclatures, questionCount) {
  const questions = [];

  // Get all tags used in quiz items
  const quizTags = new Set();
  items.forEach(item => {
    item.tags?.forEach(tag => quizTags.add(tag.toLowerCase()));
  });

  // Get nomenclatures used in quiz items
  const usedNomenclatures = nomenclatures.filter(n =>
    quizTags.has(n.label.toLowerCase())
  );

  // All nomenclature labels for generating wrong answers
  const allLabels = nomenclatures.map(n => n.label);

  // Prepare pools for each question type
  const pools = {
    [QUESTION_TYPES.IDENTIFICATION]: [],
    [QUESTION_TYPES.DESCRIPTION]: [],
    [QUESTION_TYPES.INTERPRETATION]: []
  };

  // Type 1: Items with tags (for identification questions)
  const itemsWithTags = items.filter(item => item.tags?.length > 0);
  itemsWithTags.forEach(item => {
    const correctAnswers = item.tags;
    // Find similar nomenclatures as distractors
    const distractors = findSimilarToMultiple(correctAnswers, allLabels, Math.max(4, correctAnswers.length + 3));

    pools[QUESTION_TYPES.IDENTIFICATION].push({
      type: QUESTION_TYPES.IDENTIFICATION,
      media: item,
      correctAnswers,
      options: shuffleArray([...correctAnswers, ...distractors.slice(0, Math.max(3, 6 - correctAnswers.length))])
    });
  });

  // Type 2: Nomenclatures with descriptions
  const nomenclaturesWithDescription = usedNomenclatures.filter(n => n.description?.trim());
  nomenclaturesWithDescription.forEach(nom => {
    const otherDescriptions = usedNomenclatures
      .filter(n => n.id !== nom.id && n.description?.trim())
      .map(n => n.description);

    if (otherDescriptions.length >= 3) {
      const wrongAnswers = shuffleArray(otherDescriptions).slice(0, 3);
      pools[QUESTION_TYPES.DESCRIPTION].push({
        type: QUESTION_TYPES.DESCRIPTION,
        nomenclature: nom,
        correctAnswer: nom.description,
        options: shuffleArray([nom.description, ...wrongAnswers])
      });
    }
  });

  // Type 3: Nomenclatures with interpretations
  const nomenclaturesWithInterpretation = usedNomenclatures.filter(n => n.interpretation?.trim());
  nomenclaturesWithInterpretation.forEach(nom => {
    const otherInterpretations = usedNomenclatures
      .filter(n => n.id !== nom.id && n.interpretation?.trim())
      .map(n => n.interpretation);

    if (otherInterpretations.length >= 3) {
      const wrongAnswers = shuffleArray(otherInterpretations).slice(0, 3);
      pools[QUESTION_TYPES.INTERPRETATION].push({
        type: QUESTION_TYPES.INTERPRETATION,
        nomenclature: nom,
        correctAnswer: nom.interpretation,
        options: shuffleArray([nom.interpretation, ...wrongAnswers])
      });
    }
  });

  // Shuffle each pool
  Object.keys(pools).forEach(key => {
    pools[key] = shuffleArray(pools[key]);
  });

  // Randomly select questions from pools until we reach the desired count
  const poolKeys = Object.keys(pools).filter(key => pools[key].length > 0);
  let attempts = 0;
  const maxAttempts = questionCount * 10;

  while (questions.length < questionCount && attempts < maxAttempts) {
    attempts++;

    // Pick a random pool that still has questions
    const availablePools = poolKeys.filter(key => pools[key].length > 0);
    if (availablePools.length === 0) break;

    const randomPoolKey = availablePools[Math.floor(Math.random() * availablePools.length)];
    const question = pools[randomPoolKey].shift();

    if (question) {
      questions.push(question);
    }
  }

  return shuffleArray(questions);
}

export default function QuizMode({ items, nomenclatures, questionCount, onComplete, onBack, t }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [scores, setScores] = useState({
    [QUESTION_TYPES.IDENTIFICATION]: { correct: 0, total: 0 },
    [QUESTION_TYPES.DESCRIPTION]: { correct: 0, total: 0 },
    [QUESTION_TYPES.INTERPRETATION]: { correct: 0, total: 0 }
  });
  const [answers, setAnswers] = useState([]);
  const [showAnswer, setShowAnswer] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState(new Set());

  // Generate questions at startup
  const questions = useMemo(
    () => generateQuestions(items, nomenclatures, questionCount),
    [items, nomenclatures, questionCount]
  );

  const currentQuestion = questions[currentIndex];
  const totalScore = Object.values(scores).reduce((sum, s) => sum + s.correct, 0);

  const handleOptionClick = useCallback((option) => {
    if (showAnswer) return;

    if (currentQuestion.type === QUESTION_TYPES.IDENTIFICATION) {
      // Multiple selection for identification questions
      setSelectedOptions(prev => {
        const next = new Set(prev);
        if (next.has(option)) {
          next.delete(option);
        } else {
          next.add(option);
        }
        return next;
      });
    } else {
      // Single selection for description/interpretation questions
      setSelectedOptions(new Set([option]));
    }
  }, [showAnswer, currentQuestion]);

  const handleValidate = useCallback(() => {
    if (showAnswer || selectedOptions.size === 0) return;

    const question = currentQuestion;
    let isCorrect = false;

    if (question.type === QUESTION_TYPES.IDENTIFICATION) {
      // For identification: check if selected options match correct answers exactly
      const correctSet = new Set(question.correctAnswers.map(a => a.toLowerCase()));
      const selectedSet = new Set([...selectedOptions].map(o => o.toLowerCase()));

      // Check if all correct answers are selected and no wrong answers are selected
      const allCorrectSelected = [...correctSet].every(c => selectedSet.has(c));
      const noWrongSelected = [...selectedSet].every(s => correctSet.has(s));
      isCorrect = allCorrectSelected && noWrongSelected;
    } else {
      // For description/interpretation: single correct answer
      const selected = [...selectedOptions][0];
      isCorrect = selected === question.correctAnswer;
    }

    setShowAnswer(true);

    // Update scores
    setScores(prev => ({
      ...prev,
      [question.type]: {
        correct: prev[question.type].correct + (isCorrect ? 1 : 0),
        total: prev[question.type].total + 1
      }
    }));

    // Record answer
    setAnswers(prev => [...prev, {
      question,
      selectedAnswers: [...selectedOptions],
      isCorrect
    }]);
  }, [showAnswer, selectedOptions, currentQuestion]);

  const nextQuestion = useCallback(() => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setShowAnswer(false);
      setSelectedOptions(new Set());
    } else {
      onComplete?.({
        scores,
        totalScore: totalScore + (answers[answers.length - 1]?.isCorrect ? 0 : 0), // Already counted
        total: questions.length,
        answers,
        percentage: Math.round((totalScore / questions.length) * 100)
      });
    }
  }, [currentIndex, questions.length, scores, totalScore, answers, onComplete]);

  const skipQuestion = useCallback(() => {
    setAnswers(prev => [...prev, {
      question: currentQuestion,
      selectedAnswers: [],
      isCorrect: false,
      skipped: true
    }]);

    setScores(prev => ({
      ...prev,
      [currentQuestion.type]: {
        ...prev[currentQuestion.type],
        total: prev[currentQuestion.type].total + 1
      }
    }));

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setShowAnswer(false);
      setSelectedOptions(new Set());
    } else {
      onComplete?.({
        scores,
        totalScore,
        total: questions.length,
        answers: [...answers, {
          question: currentQuestion,
          selectedAnswers: [],
          isCorrect: false,
          skipped: true
        }],
        percentage: Math.round((totalScore / questions.length) * 100)
      });
    }
  }, [currentQuestion, currentIndex, questions.length, scores, totalScore, answers, onComplete]);

  if (!currentQuestion) {
    return (
      <div className="quiz-empty placeholder">
        <h2>{t('quizEmpty')}</h2>
        <p>{t('quizNoResources')}</p>
        <button className="ghost" onClick={onBack}>{t('quizBack')}</button>
      </div>
    );
  }

  const progress = ((currentIndex + 1) / questions.length) * 100;

  // Render question based on type
  const renderQuestion = () => {
    switch (currentQuestion.type) {
      case QUESTION_TYPES.IDENTIFICATION:
        return renderIdentificationQuestion();
      case QUESTION_TYPES.DESCRIPTION:
        return renderDescriptionQuestion();
      case QUESTION_TYPES.INTERPRETATION:
        return renderInterpretationQuestion();
      default:
        return null;
    }
  };

  const renderIdentificationQuestion = () => {
    const { media, options, correctAnswers } = currentQuestion;
    const mediaSrc = media.displaySrc || media.src;
    const correctSet = new Set(correctAnswers.map(a => a.toLowerCase()));

    return (
      <div className="quiz-content card">
        <div className="quiz-media">
          {media.type === 'video' ? (
            <video
              src={mediaSrc}
              controls
              className="quiz-video"
              key={media.id}
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
          <h2>{t('quizIdentificationTitle')}</h2>
          <p className="quiz-instruction muted">{t('quizIdentificationInstruction')}</p>

          <div className="quiz-options quiz-options-multi">
            {options.map((option, index) => {
              const isSelected = selectedOptions.has(option);
              const isCorrect = correctSet.has(option.toLowerCase());
              const showCorrect = showAnswer && isCorrect;
              const showWrong = showAnswer && isSelected && !isCorrect;
              const showMissed = showAnswer && isCorrect && !isSelected;

              return (
                <button
                  key={index}
                  className={`quiz-option quiz-option-checkbox ${showCorrect ? 'correct' : ''} ${showWrong ? 'wrong' : ''} ${showMissed ? 'missed' : ''} ${isSelected && !showAnswer ? 'selected' : ''}`}
                  onClick={() => handleOptionClick(option)}
                  disabled={showAnswer}
                >
                  <span className="option-checkbox">{isSelected ? '☑' : '☐'}</span>
                  <span className="option-text">{option}</span>
                  {showCorrect && <span className="option-icon">✓</span>}
                  {showWrong && <span className="option-icon">✕</span>}
                </button>
              );
            })}
          </div>

          {renderFeedback()}
          {renderActions()}
        </div>
      </div>
    );
  };

  const renderDescriptionQuestion = () => {
    const { nomenclature, options, correctAnswer } = currentQuestion;

    return (
      <div className="quiz-content card">
        <div className="quiz-nomenclature-display">
          <span className="quiz-nomenclature-label">{nomenclature.label}</span>
        </div>

        <div className="quiz-question">
          <h2>{t('quizDescriptionTitle')}</h2>

          <div className="quiz-options">
            {options.map((option, index) => {
              const isSelected = selectedOptions.has(option);
              const isCorrect = option === correctAnswer;
              const showCorrect = showAnswer && isCorrect;
              const showWrong = showAnswer && isSelected && !isCorrect;

              return (
                <button
                  key={index}
                  className={`quiz-option ${showCorrect ? 'correct' : ''} ${showWrong ? 'wrong' : ''} ${isSelected && !showAnswer ? 'selected' : ''}`}
                  onClick={() => handleOptionClick(option)}
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

          {renderFeedback()}
          {renderActions()}
        </div>
      </div>
    );
  };

  const renderInterpretationQuestion = () => {
    const { nomenclature, options, correctAnswer } = currentQuestion;

    return (
      <div className="quiz-content card">
        <div className="quiz-nomenclature-display">
          <span className="quiz-nomenclature-label">{nomenclature.label}</span>
        </div>

        <div className="quiz-question">
          <h2>{t('quizInterpretationTitle')}</h2>

          <div className="quiz-options">
            {options.map((option, index) => {
              const isSelected = selectedOptions.has(option);
              const isCorrect = option === correctAnswer;
              const showCorrect = showAnswer && isCorrect;
              const showWrong = showAnswer && isSelected && !isCorrect;

              return (
                <button
                  key={index}
                  className={`quiz-option ${showCorrect ? 'correct' : ''} ${showWrong ? 'wrong' : ''} ${isSelected && !showAnswer ? 'selected' : ''}`}
                  onClick={() => handleOptionClick(option)}
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

          {renderFeedback()}
          {renderActions()}
        </div>
      </div>
    );
  };

  const renderFeedback = () => {
    if (!showAnswer) return null;

    const lastAnswer = answers[answers.length - 1];
    if (!lastAnswer) return null;

    if (lastAnswer.isCorrect) {
      return (
        <div className="quiz-feedback">
          <div className="feedback-correct">
            <h3>{t('quizCorrect')}</h3>
          </div>
        </div>
      );
    }

    return (
      <div className="quiz-feedback">
        <div className="feedback-wrong">
          <h3>{t('quizIncorrect')}</h3>
          {currentQuestion.type === QUESTION_TYPES.IDENTIFICATION && (
            <p>{t('quizCorrectAnswersWere')}</p>
          )}
          {currentQuestion.type === QUESTION_TYPES.IDENTIFICATION && (
            <div className="feedback-tags">
              {currentQuestion.correctAnswers.map(tag => (
                <span key={tag} className="badge">{tag}</span>
              ))}
            </div>
          )}
          {currentQuestion.type !== QUESTION_TYPES.IDENTIFICATION && (
            <p className="muted">{t('quizCorrectAnswerWas', { first: currentQuestion.correctAnswer })}</p>
          )}
        </div>
      </div>
    );
  };

  const renderActions = () => {
    return (
      <div className="quiz-actions">
        {!showAnswer ? (
          <>
            <button className="ghost" onClick={skipQuestion}>
              {t('quizSkip')}
            </button>
            <button
              className="primary"
              onClick={handleValidate}
              disabled={selectedOptions.size === 0}
            >
              {t('quizValidate')}
            </button>
          </>
        ) : (
          <button className="primary" onClick={nextQuestion}>
            {currentIndex < questions.length - 1 ? t('quizNextQuestion') : t('quizSeeResults')}
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="quiz-mode">
      <div className="quiz-header">
        <button className="ghost" onClick={onBack}>{t('quizExit')}</button>
        <div className="quiz-progress">
          <span className="quiz-counter">
            {t('quizQuestion')} {currentIndex + 1} / {questions.length}
          </span>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <span className="quiz-score">{t('quizScore')}: {totalScore}</span>
        </div>
      </div>

      <div className="quiz-type-indicator">
        <span className={`quiz-type-badge quiz-type-${currentQuestion.type}`}>
          {t(`quizType_${currentQuestion.type}`)}
        </span>
      </div>

      {renderQuestion()}
    </div>
  );
}

export function QuizResults({ results, onRestart, onBack, t }) {
  const { scores, total, answers, percentage } = results;

  const totalCorrect = Object.values(scores).reduce((sum, s) => sum + s.correct, 0);

  const grade = percentage >= 80 ? 'excellent' :
                percentage >= 60 ? 'good' :
                percentage >= 40 ? 'average' : 'poor';

  // Group answers by type for detailed display
  const answersByType = {
    [QUESTION_TYPES.IDENTIFICATION]: answers.filter(a => a.question.type === QUESTION_TYPES.IDENTIFICATION),
    [QUESTION_TYPES.DESCRIPTION]: answers.filter(a => a.question.type === QUESTION_TYPES.DESCRIPTION),
    [QUESTION_TYPES.INTERPRETATION]: answers.filter(a => a.question.type === QUESTION_TYPES.INTERPRETATION)
  };

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
            <h3>{totalCorrect} / {total}</h3>
            <p className="muted">
              {grade === 'excellent' && t('quizGradeExcellent')}
              {grade === 'good' && t('quizGradeGood')}
              {grade === 'average' && t('quizGradeAverage')}
              {grade === 'poor' && t('quizGradePoor')}
            </p>
          </div>
        </div>

        <div className="results-by-type">
          <h4>{t('quizResultsByType')}</h4>
          <div className="type-scores">
            {Object.entries(scores).map(([type, score]) => (
              score.total > 0 && (
                <div key={type} className="type-score-item">
                  <span className={`quiz-type-badge quiz-type-${type}`}>
                    {t(`quizType_${type}`)}
                  </span>
                  <span className="type-score-value">
                    {score.correct} / {score.total}
                  </span>
                </div>
              )
            ))}
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

        {Object.entries(answersByType).map(([type, typeAnswers]) => (
          typeAnswers.length > 0 && (
            <div key={type} className="results-type-section">
              <h4 className={`quiz-type-badge quiz-type-${type}`}>
                {t(`quizType_${type}`)} ({scores[type].correct}/{scores[type].total})
              </h4>
              <div className="results-list">
                {typeAnswers.map((answer, index) => (
                  <div key={index} className={`result-item ${answer.isCorrect ? 'correct' : 'wrong'}`}>
                    <div className="result-number">{index + 1}</div>
                    <div className="result-content">
                      {type === QUESTION_TYPES.IDENTIFICATION ? (
                        <>
                          <h4>{answer.question.media.title}</h4>
                          {!answer.isCorrect && !answer.skipped && (
                            <p className="result-answer">
                              {t('quizYourAnswer')} <span className="wrong-answer">{answer.selectedAnswers.join(', ')}</span>
                            </p>
                          )}
                          {!answer.isCorrect && (
                            <p className="result-correct-answer">
                              {t('quizCorrectAnswersWere')} <span className="correct-answer">{answer.question.correctAnswers.join(', ')}</span>
                            </p>
                          )}
                        </>
                      ) : (
                        <>
                          <h4>{answer.question.nomenclature.label}</h4>
                          {!answer.isCorrect && !answer.skipped && (
                            <p className="result-answer">
                              {t('quizYourAnswer')} <span className="wrong-answer">{answer.selectedAnswers[0]}</span>
                            </p>
                          )}
                          {!answer.isCorrect && (
                            <p className="result-correct-answer muted">
                              {t('quizCorrectAnswerWas', { first: answer.question.correctAnswer })}
                            </p>
                          )}
                        </>
                      )}
                      {answer.skipped && (
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
          )
        ))}
      </div>
    </div>
  );
}
