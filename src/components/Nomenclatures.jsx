import React, { useMemo, useState } from 'react';

const pattern = /^[A-Za-z0-9]+(?:_[A-Za-z0-9]+)*$/;

export default function Nomenclatures({ items, onAdd, onUpdate, onDelete }) {
  const [label, setLabel] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [draftLabel, setDraftLabel] = useState('');
  const [draftDescription, setDraftDescription] = useState('');

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => a.label.localeCompare(b.label, 'fr'));
  }, [items]);

  const resetForm = () => {
    setLabel('');
    setDescription('');
    setError('');
  };

  const validateLabel = (candidate, excludeId) => {
    const trimmed = candidate.trim();
    if (!pattern.test(trimmed)) {
      setError('La nomenclature doit contenir lettres/chiffres séparés par "_".');
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
    const confirmed = window.confirm(
      `Supprimer la nomenclature "${item.label}" ? Cette action est définitive.`
    );
    if (confirmed) {
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

      <form className="nomenclature-form" onSubmit={handleAdd}>
        <div className="field-group">
          <label htmlFor="nomenclature-label">Nomenclature</label>
          <input
            id="nomenclature-label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Ex: R_C_E_3_1"
          />
        </div>
        <div className="field-group">
          <label htmlFor="nomenclature-description">Description</label>
          <input
            id="nomenclature-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Contexte, posture, interprétation..."
          />
        </div>
        <button type="submit">Ajouter</button>
      </form>
      {error && <div className="error-banner">{error}</div>}

      <div className="table-wrapper">
        <div className="table head">
          <div className="cell">Nomenclature</div>
          <div className="cell">Description</div>
          <div className="cell actions">Actions</div>
        </div>
        {sortedItems.map((item) => {
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
                  <span className="badge">{item.label}</span>
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
                    <button onClick={saveEdit}>Enregistrer</button>
                    <button className="ghost" type="button" onClick={cancelEdit}>
                      Annuler
                    </button>
                  </div>
                ) : (
                  <div className="action-group">
                    <button type="button" onClick={() => startEdit(item)}>
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
