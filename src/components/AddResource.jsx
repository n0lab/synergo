import React, { useMemo, useState } from 'react';

export default function AddResource({ onBack, onCreate, detectType }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [link, setLink] = useState('');
  const [error, setError] = useState('');

  const detectedType = useMemo(() => detectType?.(link), [detectType, link]);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!title.trim() || !link.trim()) {
      setError('Merci de renseigner au minimum un nom et un lien.');
      return;
    }

    setError('');
    onCreate({
      title: title.trim(),
      description: description.trim(),
      src: link.trim(),
      type: detectedType,
    });
  };

  return (
    <div className="add-resource-page">
      <div className="page-header">
        <h2>Ajouter une ressource</h2>
        <p>Créez une nouvelle vidéo ou photo en fonction du lien fourni.</p>
      </div>

      <form className="card form-grid" onSubmit={handleSubmit}>
        <div className="field-group">
          <label htmlFor="resource-title">Nom de la ressource</label>
          <input
            id="resource-title"
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Ex: Regard déterminé"
            required
          />
        </div>

        <div className="field-group">
          <label htmlFor="resource-description">Description</label>
          <textarea
            id="resource-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Contexte, intention, détails sur la ressource..."
            rows={4}
          />
        </div>

        <div className="field-group">
          <label htmlFor="resource-link">Lien de la ressource</label>
          <input
            id="resource-link"
            type="url"
            value={link}
            onChange={(event) => setLink(event.target.value)}
            placeholder="https://..."
            required
          />
          <div className="helper-row">
            <span className="muted">
              Le type est détecté automatiquement : <strong>{detectedType === 'photo' ? 'Photo' : 'Vidéo'}</strong>
            </span>
          </div>
        </div>

        {error && <div className="error-banner">{error}</div>}

        <div className="action-group end">
          <button type="button" className="ghost" onClick={onBack}>
            Annuler
          </button>
          <button type="submit" className="primary">
            Ajouter la ressource
          </button>
        </div>
      </form>
    </div>
  );
}
