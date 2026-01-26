import React, { useMemo, useState } from 'react';

export default function AddResource({
  onBack,
  onCreate,
  detectType,
  findExistingResource,
  generateUniqueFilename,
  uploadFile,
  onNavigateToResource,
  t,
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [link, setLink] = useState('');
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [duplicateResource, setDuplicateResource] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const detectedType = useMemo(() => detectType?.(link), [detectType, link]);

  const handleDescriptionKeyDown = (event) => {
    if (event.key === 'Enter' && event.shiftKey) {
      event.stopPropagation();
    }
  };

  const handleFileChange = (event) => {
    const selectedFile = event.target.files?.[0] ?? null;
    setFile(selectedFile);

    // Auto-fill the filename field if it's empty and a file was selected
    if (selectedFile && !link.trim()) {
      const uniqueFilename = generateUniqueFilename?.(selectedFile.name) || selectedFile.name;
      setLink(uniqueFilename);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const trimmedLink = link.trim();
    const hasLink = !!trimmedLink;
    const hasFile = !!file;

    if (!title.trim() || (!hasLink && !hasFile)) {
      setError(t('resourceErrorMissing'));
      return;
    }

    if (hasLink) {
      const normalizedLink = trimmedLink.toLowerCase();
      if (normalizedLink.includes('youtube.com') || normalizedLink.includes('youtu.be')) {
        setError(t('resourceErrorYoutube'));
        return;
      }
    }

    setIsSubmitting(true);
    setError('');
    setDuplicateResource(null);

    try {
      let payloadSrc = trimmedLink;
      let payloadFilename = null;
      let payloadType = detectedType;

      if (hasFile) {
        // Use the filename from the link field, or generate a unique one
        payloadFilename = trimmedLink || generateUniqueFilename?.(file.name) || file.name;
        payloadSrc = payloadFilename;
        payloadType = file.type.startsWith('image/') ? 'photo' : 'video';

        // Upload the file to the server
        await uploadFile(file, payloadFilename);
      }

      payloadType = payloadType || detectType?.(payloadSrc);

      // Check for duplicates
      const existingResource = findExistingResource?.({
        title: title.trim(),
        src: payloadSrc,
      });

      if (existingResource) {
        setDuplicateResource(existingResource);
        setIsSubmitting(false);
        return;
      }

      // Create the resource
      onCreate({
        title: title.trim(),
        description: description.trim(),
        src: payloadSrc,
        filename: payloadFilename,
        type: payloadType,
      });
    } catch (uploadError) {
      console.error(uploadError);
      setError(t('resourceErrorUpload'));
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(false);
  };

  return (
    <div className="add-resource-page">
      <div className="page-header">
        <h2>{t('addResourceTitle')}</h2>
        <p>{t('addResourceSubtitle')}</p>
      </div>

      <div className="card info-banner" style={{
        background: 'var(--badge)',
        border: '1px solid var(--border)',
        padding: '16px',
        borderRadius: '12px',
        marginBottom: '16px'
      }}>
        <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', color: 'var(--accent)' }}>
          📂 Comment ajouter une ressource
        </h3>
        <p style={{ margin: '0', fontSize: '14px', lineHeight: '1.6' }}>
          • <strong>Option 1:</strong> Entrez le nom d'un fichier déjà présent dans <code style={{
            background: 'var(--panel)',
            padding: '2px 6px',
            borderRadius: '4px',
            fontFamily: 'monospace'
          }}>/resources/</code><br/>
          • <strong>Option 2:</strong> Sélectionnez un fichier local (il sera automatiquement copié dans /resources/)
        </p>
      </div>

      <form className="card form-grid" onSubmit={handleSubmit}>
        <div className="field-group">
          <label htmlFor="resource-title">{t('resourceNameLabel')}</label>
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
          <label htmlFor="resource-description">{t('resourceDescriptionLabel')}</label>
          <textarea
            id="resource-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            onKeyDown={handleDescriptionKeyDown}
            placeholder="Contexte, intention, détails sur la ressource..."
            rows={4}
          />
        </div>

        <div className="field-group">
          <label htmlFor="resource-link">Nom du fichier dans /resources/</label>
          <input
            id="resource-link"
            type="text"
            value={link}
            onChange={(event) => setLink(event.target.value)}
            placeholder="exemple-video.mp4 ou exemple-photo.jpg"
          />
          <div className="helper-row">
            <span className="muted">
              {t('resourceTypeDetected', { type: detectedType })}
            </span>
          </div>
        </div>

        <div className="field-group">
          <label htmlFor="resource-file">{t('resourceFileLabel')}</label>
          <input
            id="resource-file"
            type="file"
            accept="image/*,video/*"
            onChange={handleFileChange}
          />
          <div className="helper-row">
            <span className="muted">
              Le fichier sera automatiquement copié dans /resources/
            </span>
          </div>
        </div>

        {(error || duplicateResource) && (
          <div className="error-banner">
            {duplicateResource ? (
              <>
                {t('resourceDuplicate')}{' '}
                <button
                  type="button"
                  className="resource-link"
                  onClick={() => duplicateResource && onNavigateToResource?.(duplicateResource)}
                >
                  {duplicateResource.title}
                </button>
              </>
            ) : (
              error
            )}
          </div>
        )}

        <div className="action-group end">
          <button type="button" className="ghost" onClick={onBack}>
            {t('cancel')}
          </button>
          <button type="submit" className="primary" disabled={isSubmitting}>
            {t('addResourceAction')}
          </button>
        </div>
      </form>
    </div>
  );
}
