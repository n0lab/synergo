import React from 'react';

export default function ActionBar({ editing, onEdit, onToReview, onToQuizz, onDelete }) {
  return (
    <div className="action-bar">
      {editing && (
        <button className="ghost danger" onClick={onDelete}>
          Supprimer
        </button>
      )}
      <button className="ghost" onClick={onEdit}>{editing ? 'Sauvegarder' : 'Edit'}</button>
      <button className="ghost" onClick={onToReview}>To Review</button>
      <button className="ghost" onClick={onToQuizz}>To Quizz</button>
    </div>
  );
}
