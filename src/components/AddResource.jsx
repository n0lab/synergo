import React, { useMemo, useState } from 'react';

export default function AddResource({ onBack, onCreate, detectType }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [link, setLink] = useState('');
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const detectedType = useMemo(() => detectType?.(link), [detectType, link]);

  const readFileAsDataUrl = (selectedFile) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result?.toString() ?? '');
      reader.onerror = () => reject(new Error("Impossible de lire le fichier."));
      reader.readAsDataURL(selectedFile);
    });

  const handleSubmit = async (event) => {
    event.preventDefault();
    const hasLink = !!link.trim();
    const hasFile = !!file;

    if (!title.trim() || (!hasLink && !hasFile)) {
      setError('Merci de renseigner au minimum un nom et un lien ou un fichier.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      let payloadSrc = link.trim();
      let payloadType = detectedType;

      if (hasFile) {
        payloadSrc = await readFileAsDataUrl(file);
        payloadType = file.type.startsWith('image/') ? 'photo' : 'video';
      }

      payloadType = payloadType || detectType?.(payloadSrc);

      onCreate({
        title: title.trim(),
        description: description.trim(),
        src: payloadSrc,
        type: payloadType,
      });
    } catch (uploadError) {
      console.error(uploadError);
      setError('Le fichier n\'a pas pu être importé. Merci de réessayer.');
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(false);
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
          />
          <div className="helper-row">
            <span className="muted">
              Le type est détecté automatiquement : <strong>{detectedType === 'photo' ? 'Photo' : 'Vidéo'}</strong>
            </span>
          </div>
        </div>

        <div className="field-group">
          <label htmlFor="resource-file">Ou importer un fichier</label>
          <input
            id="resource-file"
            type="file"
            accept="image/*,video/*"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          />
          <div className="helper-row">
            <span className="muted">
              Ajoutez un lien (YouTube inclus) ou déposez un fichier qui sera conservé localement.
            </span>
          </div>
        </div>

        {error && <div className="error-banner">{error}</div>}

        <div className="action-group end">
          <button type="button" className="ghost" onClick={onBack}>
            Annuler
          </button>
          <button type="submit" className="primary" disabled={isSubmitting}>
            Ajouter la ressource
          </button>
        </div>
      </form>
    </div>
  );
}
