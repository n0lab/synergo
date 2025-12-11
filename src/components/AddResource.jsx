import React, { useMemo, useState } from 'react';

export default function AddResource({
  onBack,
  onCreate,
  detectType,
  findExistingResource,
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

  const readFileAsDataUrl = (selectedFile) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result?.toString() ?? '');
      reader.onerror = () => reject(new Error('Unable to read the file.'));
      reader.readAsDataURL(selectedFile);
    });

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
      let payloadType = detectedType;

      if (hasFile) {
        payloadSrc = await readFileAsDataUrl(file);
        payloadType = file.type.startsWith('image/') ? 'photo' : 'video';
      }

      payloadType = payloadType || detectType?.(payloadSrc);

      const existingResource = findExistingResource?.({
        title: title.trim(),
        src: payloadSrc,
      });

      if (existingResource) {
        setDuplicateResource(existingResource);
        setIsSubmitting(false);
        return;
      }

      onCreate({
        title: title.trim(),
        description: description.trim(),
        src: payloadSrc,
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
            placeholder="Contexte, intention, détails sur la ressource..."
            rows={4}
          />
        </div>

        <div className="field-group">
          <label htmlFor="resource-link">{t('resourceLinkLabel')}</label>
          <input
            id="resource-link"
            type="url"
            value={link}
            onChange={(event) => setLink(event.target.value)}
            placeholder="https://..."
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
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          />
          <div className="helper-row">
            <span className="muted">
              {t('resourceFileHelper')}
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
