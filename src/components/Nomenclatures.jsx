import React, { useMemo, useState } from 'react';
import StatsCard from './StatsCard.jsx';

export default function Nomenclatures({
  items,
  onAdd,
  onUpdate,
  onDelete,
  onNavigate,
  isNomenclatureUsed,
  t,
  language,
}) {
  const [label, setLabel] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [draftLabel, setDraftLabel] = useState('');
  const [draftDescription, setDraftDescription] = useState('');
  const [query, setQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const totalNomenclatures = items.length;

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => a.label.localeCompare(b.label, language ?? 'fr'));
  }, [items, language]);

  const filteredItems = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return sortedItems;
    return sortedItems.filter((item) => {
      const labelMatch = item.label.toLowerCase().includes(needle);
      const descriptionMatch = (item.description || '').toLowerCase().includes(needle);
      return labelMatch || descriptionMatch;
    });
  }, [query, sortedItems]);

  const resetForm = () => {
    setLabel('');
    setDescription('');
    setError('');
  };

  const validateLabel = (candidate, excludeId) => {
    const trimmed = candidate.trim();
    if (!trimmed) {
      setError(t('nomenclatureErrorEmpty'));
      return null;
    }
    const exists = items.some(
      (item) => item.id !== excludeId && item.label.toLowerCase() === trimmed.toLowerCase()
    );
    if (exists) {
      setError(t('nomenclatureErrorExists'));
      return null;
    }
    return trimmed;
  };

  const handleAdd = (event) => {
    event.preventDefault();
    const validLabel = validateLabel(label);
    if (!validLabel) return;
    onAdd({ label: validLabel, description: description.trim() });
    resetForm();
    setShowAddModal(false);
  };

  const openAddModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  const closeAddModal = () => {
    resetForm();
    setShowAddModal(false);
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setDraftLabel(item.label);
    setDraftDescription(item.description ?? '');
    setError('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraftLabel('');
    setDraftDescription('');
    setError('');
  };

  const saveEdit = () => {
    const validLabel = validateLabel(draftLabel, editingId);
    if (!validLabel) return;
    onUpdate(editingId, { label: validLabel, description: draftDescription.trim() });
    cancelEdit();
  };

  const handleEditKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      saveEdit();
    }
  };

  const requestDelete = (item) => {
    if (isNomenclatureUsed?.(item.label)) {
      setError(t('nomenclatureDeleteBlocked'));
      return;
    }

    const confirmed = window.confirm(t('nomenclatureConfirmDelete', { label: item.label }));
    if (confirmed) {
      setError('');
      onDelete(item.id);
    }
  };

  return (
    <div className="oracle">
      <div className="header-row">
        <div>
          <h2>{t('nomenclaturePageTitle')}</h2>
          <p>{t('nomenclaturePageSubtitle')}</p>
        </div>
        <div className="kpi-row">
          <button className="ghost success" type="button" onClick={openAddModal}>
            {t('nomenclatureAdd')}
          </button>
          <StatsCard
            label={t('nomenclatureTotalLabel')}
            value={totalNomenclatures}
            accent="#2cb67d"
          />
        </div>
      </div>

      <div className="nomenclature-toolbar oracle-toolbar">
        <div className="field-group wide">
          <div className="input-with-clear">
            <input
              id="nomenclature-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('nomenclatureSearchPlaceholder')}
              aria-label={t('nomenclatureSearchLabel')}
            />
            <button
              type="button"
              className="clear-button"
              aria-label={t('nomenclatureClearFilter')}
              onClick={() => setQuery('')}
              disabled={!query}
            >
              ×
            </button>
          </div>
        </div>
        <div className="search-spacer" aria-hidden="true" />
      </div>
      {error && <div className="error-banner">{error}</div>}

      {showAddModal && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <form className="modal" onSubmit={handleAdd}>
            <h3>{t('nomenclatureAddTitle')}</h3>
            <div className="field-group">
              <label htmlFor="modal-nomenclature-label">{t('nomenclatureLabel')}</label>
              <input
                id="modal-nomenclature-label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder={t('nomenclatureAddExample')}
                autoFocus
              />
            </div>
            <div className="field-group">
              <label htmlFor="modal-nomenclature-description">{t('nomenclatureDescription')}</label>
              <input
                id="modal-nomenclature-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('nomenclatureAddDescriptionPlaceholder')}
              />
            </div>
            <div className="action-group end">
              <button className="ghost" type="button" onClick={closeAddModal}>
                {t('cancel')}
              </button>
              <button className="primary" type="submit">
                {t('add')}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="table-wrapper">
        <div className="table head">
          <div className="cell">{t('nomenclatureLabel')}</div>
          <div className="cell">{t('nomenclatureDescription')}</div>
          <div className="cell actions">{t('actions')}</div>
        </div>
        {filteredItems.map((item) => {
          const isEditing = editingId === item.id;
          return (
            <div className="table row" key={item.id}>
              <div className="cell">
                {isEditing ? (
                  <input
                    value={draftLabel}
                    onChange={(e) => setDraftLabel(e.target.value)}
                    onKeyDown={handleEditKeyDown}
                    aria-label={t('nomenclatureLabel')}
                  />
                ) : (
                  <button
                    className="badge link"
                    type="button"
                    onClick={() => onNavigate?.(item.label)}
                    aria-label={t('searchNomenclature', { label: item.label })}
                  >
                    {item.label}
                  </button>
                )}
              </div>
              <div className="cell">
                {isEditing ? (
                  <input
                    value={draftDescription}
                    onChange={(e) => setDraftDescription(e.target.value)}
                    onKeyDown={handleEditKeyDown}
                    aria-label={t('nomenclatureDescription')}
                  />
                ) : (
                  <span className="muted nomenclature-description" title={item.description || '—'}>
                    {item.description || '—'}
                  </span>
                )}
              </div>
              <div className="cell actions">
                {isEditing ? (
                  <div className="action-group">
                    <button className="primary" onClick={saveEdit}>{t('save')}</button>
                    <button className="ghost" type="button" onClick={cancelEdit}>
                      {t('cancel')}
                    </button>
                  </div>
                ) : (
                  <div className="action-group">
                    <button className="ghost soft" type="button" onClick={() => startEdit(item)}>
                      {t('edit')}
                    </button>
                    <button className="ghost" type="button" onClick={() => requestDelete(item)}>
                      {t('delete')}
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {sortedItems.length === 0 && (
          <div className="table row muted">{t('noNomenclatureRows')}</div>
        )}
      </div>
    </div>
  );
}
