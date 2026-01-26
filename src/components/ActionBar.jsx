import React from 'react';

export default function ActionBar({
  editing,
  onStartEdit,
  onSave,
  onCancel,
  onToReview,
  onToQuizz,
  onDelete,
  t,
}) {
  return (
    <div className="action-bar">
      {editing && (
        <button className="ghost danger" type="button" onClick={onDelete}>
          {t('actionDelete')}
        </button>
      )}
      {editing && (
        <button className="ghost warning" type="button" onClick={onCancel}>
          {t('actionCancel')}
        </button>
      )}
      <button
        className="ghost success"
        type="button"
        onClick={editing ? onSave : onStartEdit}
      >
        {editing ? t('actionSave') : t('actionEdit')}
      </button>
      {!editing && (
        <button className="ghost info" type="button" onClick={onToReview}>
          {t('actionToReview')}
        </button>
      )}
      {!editing && (
        <button className="ghost purple" type="button" onClick={onToQuizz}>
          {t('actionToQuizz')}
        </button>
      )}
    </div>
  );
}
