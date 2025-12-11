import React, { useMemo, useState } from 'react';

export default function Nomenclatures({
  items,
  onAdd,
  onUpdate,
  onDelete,
  onNavigate,
  isNomenclatureUsed,
}) {
  const [label, setLabel] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [draftLabel, setDraftLabel] = useState('');
  const [draftDescription, setDraftDescription] = useState('');
  const [query, setQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => a.label.localeCompare(b.label, 'fr'));
  }, [items]);

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
      setError('La nomenclature ne peut pas être vide.');
      return null;
    }
    const exists = items.some(
      (item) => item.id !== excludeId && item.label.toLowerCase() === trimmed.toLowerCase()
    );
    if (exists) {
      setError('Cette nomenclature existe déjà.');
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

  const requestDelete = (item) => {
    if (isNomenclatureUsed?.(item.label)) {
      setError('Impossible de supprimer une nomenclature utilisée sur une ressource.');
      return;
    }

    const confirmed = window.confirm(
      `Supprimer la nomenclature "${item.label}" ? Cette action est définitive.`
    );
    if (confirmed) {
      setError('');
      onDelete(item.id);
    }
  };

  return (
    <div className="nomenclature-page">
      <header className="page-header">
        <h2>Nomenclatures</h2>
        <p className="muted">
          Gérez les nomenclatures ajoutées via les médias ou directement depuis cette page.
        </p>
      </header>

      <div className="nomenclature-toolbar">
        <div className="field-group wide">
          <label htmlFor="nomenclature-search">Rechercher</label>
          <div className="input-with-clear">
            <input
              id="nomenclature-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filtrer par nomenclature ou description..."
            />
            <button
              type="button"
              className="clear-button"
              aria-label="Effacer le filtre"
              onClick={() => setQuery('')}
              disabled={!query}
            >
              ×
            </button>
          </div>
        </div>
        <button className="primary" type="button" onClick={openAddModal}>
          Ajouter
        </button>
      </div>
      {error && <div className="error-banner">{error}</div>}

      {showAddModal && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <form className="modal" onSubmit={handleAdd}>
            <h3>Ajouter une nomenclature</h3>
            <div className="field-group">
              <label htmlFor="modal-nomenclature-label">Nomenclature</label>
              <input
                id="modal-nomenclature-label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Ex: R_C_E_3_1"
                autoFocus
              />
            </div>
            <div className="field-group">
              <label htmlFor="modal-nomenclature-description">Description</label>
              <input
                id="modal-nomenclature-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Contexte, posture, interprétation..."
              />
            </div>
            <div className="action-group end">
              <button className="ghost" type="button" onClick={closeAddModal}>
                Annuler
              </button>
              <button className="primary" type="submit">
                Ajouter
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="table-wrapper">
        <div className="table head">
          <div className="cell">Nomenclature</div>
          <div className="cell">Description</div>
          <div className="cell actions">Actions</div>
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
                    aria-label="Libellé"
                  />
                ) : (
                  <button
                    className="badge link"
                    type="button"
                    onClick={() => onNavigate?.(item.label)}
                    aria-label={`Rechercher ${item.label}`}
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
                    aria-label="Description"
                  />
                ) : (
                  <span className="muted">{item.description || '—'}</span>
                )}
              </div>
              <div className="cell actions">
                {isEditing ? (
                  <div className="action-group">
                    <button className="primary" onClick={saveEdit}>Enregistrer</button>
                    <button className="ghost" type="button" onClick={cancelEdit}>
                      Annuler
                    </button>
                  </div>
                ) : (
                  <div className="action-group">
                    <button className="ghost soft" type="button" onClick={() => startEdit(item)}>
                      Modifier
                    </button>
                    <button className="ghost" type="button" onClick={() => requestDelete(item)}>
                      Supprimer
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {sortedItems.length === 0 && (
          <div className="table row muted">Aucune nomenclature enregistrée.</div>
        )}
      </div>
    </div>
  );
}
