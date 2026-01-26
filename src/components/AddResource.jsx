import React, { useCallback, useEffect, useMemo, useState } from 'react';
import * as api from '../api.js';

/**
 * Format a source string for use in filename:
 * - Remove special characters (keep alphanumeric and spaces)
 * - Replace spaces with hyphens
 * - Remove accents/diacritics
 */
function formatSourceForFilename(source) {
  if (!source) return '';

  // Normalize and remove diacritics
  const normalized = source.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // Keep only alphanumeric characters and spaces, replace spaces with hyphens
  return normalized
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Format a date as YYYYMMDD
 */
function formatDateForFilename(dateStr) {
  if (!dateStr) return '';

  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}${month}${day}`;
}

/**
 * Get file extension from filename
 */
function getFileExtension(filename) {
  const parts = filename.split('.');
  return parts.length > 1 ? `.${parts[parts.length - 1].toLowerCase()}` : '';
}

export default function AddResource({
  onBack,
  onCreate,
  detectType,
  findExistingResource,
  uploadFile,
  onNavigateToResource,
  t,
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [source, setSource] = useState('');
  const [publicationDate, setPublicationDate] = useState('');
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [duplicateResource, setDuplicateResource] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const [nextNumber, setNextNumber] = useState('001');

  // Fetch next available number when source or date changes
  useEffect(() => {
    const fetchNextNumber = async () => {
      if (!source.trim() || !publicationDate) {
        setNextNumber('001');
        return;
      }

      const datePrefix = formatDateForFilename(publicationDate);
      const sourcePrefix = formatSourceForFilename(source);

      if (!datePrefix || !sourcePrefix) {
        setNextNumber('001');
        return;
      }

      try {
        const result = await api.getNextResourceNumber(datePrefix, sourcePrefix);
        setNextNumber(result.nextNumber || '001');
      } catch (err) {
        console.error('Error fetching next number:', err);
        setNextNumber('001');
      }
    };

    fetchNextNumber();
  }, [source, publicationDate]);

  // Generate the platform filename
  const generatedFilename = useMemo(() => {
    if (!source.trim() || !publicationDate || !file) {
      return '';
    }

    const datePrefix = formatDateForFilename(publicationDate);
    const sourcePrefix = formatSourceForFilename(source);
    const extension = getFileExtension(file.name);

    if (!datePrefix || !sourcePrefix) {
      return '';
    }

    return `${datePrefix}_${sourcePrefix}_${nextNumber}${extension}`;
  }, [source, publicationDate, file, nextNumber]);

  const detectedType = useMemo(() => {
    if (file) {
      return file.type.startsWith('image/') ? 'photo' : 'video';
    }
    return null;
  }, [file]);

  const handleDescriptionKeyDown = (event) => {
    if (event.key === 'Enter' && event.shiftKey) {
      event.stopPropagation();
    }
  };

  const handleFileChange = (event) => {
    const selectedFile = event.target.files?.[0] ?? null;
    setFile(selectedFile);
  };

  const handleDragEnter = useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragActive(true);
  }, []);

  const handleDragLeave = useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragActive(false);
  }, []);

  const handleDragOver = useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const handleDrop = useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragActive(false);

    const droppedFile = event.dataTransfer?.files?.[0];
    if (droppedFile) {
      // Check if it's an image or video
      if (droppedFile.type.startsWith('image/') || droppedFile.type.startsWith('video/')) {
        setFile(droppedFile);
      }
    }
  }, []);

  const handleDropzoneClick = () => {
    document.getElementById('resource-file')?.click();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    // Validate required fields
    if (!title.trim()) {
      setError(t('resourceErrorMissing'));
      return;
    }

    if (!source.trim()) {
      setError(t('resourceErrorMissingSource'));
      return;
    }

    if (!publicationDate) {
      setError(t('resourceErrorMissingDate'));
      return;
    }

    if (!file) {
      setError(t('resourceErrorMissingFile'));
      return;
    }

    if (!generatedFilename) {
      setError(t('resourceErrorMissing'));
      return;
    }

    setIsSubmitting(true);
    setError('');
    setDuplicateResource(null);

    try {
      const payloadFilename = generatedFilename;
      const payloadSrc = payloadFilename;
      const payloadType = file.type.startsWith('image/') ? 'photo' : 'video';

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

      // Upload the file to the server
      await uploadFile(file, payloadFilename);

      // Create the resource
      onCreate({
        title: title.trim(),
        description: description.trim(),
        src: payloadSrc,
        filename: payloadFilename,
        type: payloadType,
        source: source.trim(),
        publicationDate: publicationDate,
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
          <label htmlFor="resource-source">{t('resourceSourceLabel')}</label>
          <input
            id="resource-source"
            type="text"
            value={source}
            onChange={(event) => setSource(event.target.value)}
            placeholder={t('resourceSourcePlaceholder')}
            required
          />
        </div>

        <div className="field-group">
          <label htmlFor="resource-date">{t('resourceDateLabel')}</label>
          <input
            id="resource-date"
            type="date"
            value={publicationDate}
            onChange={(event) => setPublicationDate(event.target.value)}
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
          <label>{t('resourceGeneratedFilenameLabel')}</label>
          <input
            type="text"
            value={generatedFilename || '—'}
            readOnly
            disabled
            style={{
              backgroundColor: 'var(--panel)',
              cursor: 'not-allowed',
              fontFamily: 'monospace',
            }}
          />
          <div className="helper-row">
            <span className="muted">
              {t('resourceGeneratedFilenameHelper')}
            </span>
          </div>
        </div>

        <div className="field-group">
          <label>{t('resourceFileLabel')}</label>
          <div
            className={`dropzone ${isDragActive ? 'dropzone-active' : ''} ${file ? 'dropzone-has-file' : ''}`}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={handleDropzoneClick}
            style={{
              border: `2px dashed ${isDragActive ? 'var(--accent)' : 'var(--border)'}`,
              borderRadius: '12px',
              padding: '24px',
              textAlign: 'center',
              cursor: 'pointer',
              backgroundColor: isDragActive ? 'var(--badge)' : 'var(--panel)',
              transition: 'all 0.2s ease',
            }}
          >
            <input
              id="resource-file"
              type="file"
              accept="image/*,video/*"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            {file ? (
              <div>
                <p style={{ margin: 0, fontWeight: 500 }}>{file.name}</p>
                <p style={{ margin: '8px 0 0', fontSize: '14px', color: 'var(--muted)' }}>
                  {(file.size / (1024 * 1024)).toFixed(2)} MB • {detectedType === 'photo' ? 'Photo' : 'Video'}
                </p>
              </div>
            ) : (
              <p style={{ margin: 0, color: 'var(--muted)' }}>
                {isDragActive ? t('resourceDropzoneActive') : t('resourceDropzoneText')}
              </p>
            )}
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
          <button type="submit" className="primary" disabled={isSubmitting || !generatedFilename}>
            {t('addNewResourceAction')}
          </button>
        </div>
      </form>
    </div>
  );
}
