import React from 'react';

export default function ActionBar({
  editing,
  onStartEdit,
  onSave,
  onCancel,
  onToReview,
  onToQuizz,
  onDelete,
}) {
  return (
    <div className="action-bar">
      {editing && (
        <button className="ghost danger" type="button" onClick={onDelete}>
          Supprimer
        </button>
      )}
      {editing && (
        <button className="ghost warning" type="button" onClick={onCancel}>
          Annuler
        </button>
      )}
      <button
        className="ghost success"
        type="button"
        onClick={editing ? onSave : onStartEdit}
      >
        {editing ? 'Enregistrer' : 'Éditer'}
      </button>
      <button className="ghost info" type="button" onClick={onToReview}>
        To Review
      </button>
      <button className="ghost purple" type="button" onClick={onToQuizz}>
        To Quizz
      </button>
    </div>
  );
}
