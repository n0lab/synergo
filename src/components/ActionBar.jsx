import React from 'react';

export default function ActionBar({ editing, onEdit, onToReview, onToQuizz }) {
  return (
    <div className="action-bar">
      <button className="ghost" onClick={onEdit}>{editing ? 'Cancel' : 'Edit'}</button>
      <button className="ghost" onClick={onToReview}>To Review</button>
      <button className="ghost" onClick={onToQuizz}>To Quizz</button>
    </div>
  );
}
