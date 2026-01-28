import React, { useCallback, useEffect, useMemo, useState } from 'react';
import * as api from '../api.js';
import { getFilenameFromPath } from '../db.js';

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
  media = [],
  t,
}) {
  // Mode: 'selection' | 'upload' | 'existing'
  const [mode, setMode] = useState('selection');
  const [unusedFiles, setUnusedFiles] = useState([]);
  const [selectedExistingFile, setSelectedExistingFile] = useState('');
  const [isLoadingFiles, setIsLoadingFiles] = useState(true);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [source, setSource] = useState('');
  const [subjectName, setSubjectName] = useState('');
  const [publicationDate, setPublicationDate] = useState('');
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [duplicateResource, setDuplicateResource] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const [nextNumber, setNextNumber] = useState('001');

  // Fetch unused files on mount
  useEffect(() => {
    const fetchUnusedFiles = async () => {
      setIsLoadingFiles(true);
      try {
        const data = await api.getResourceFiles();
        const resourceFiles = data.files || [];

        // Get all filenames used in media (local files only)
        const usedFilenames = new Set();
        media.forEach(item => {
          if (item.src && !item.src.startsWith('http')) {
            usedFilenames.add(getFilenameFromPath(item.src));
          }
        });

        // Filter resource files that are not used
        const unused = resourceFiles.filter(file => !usedFilenames.has(file));
        setUnusedFiles(unused);

        // If no unused files, skip to upload mode directly
        if (unused.length === 0) {
          setMode('upload');
        }
      } catch (err) {
        console.error('Error fetching resource files:', err);
        setUnusedFiles([]);
        setMode('upload');
      }
      setIsLoadingFiles(false);
    };

    fetchUnusedFiles();
  }, [media]);

  // Fetch next available number when source, subject name or date changes
  useEffect(() => {
    const fetchNextNumber = async () => {
      if (!source.trim() || !subjectName.trim() || !publicationDate) {
        setNextNumber('001');
        return;
      }

      const datePrefix = formatDateForFilename(publicationDate);
      const sourcePrefix = formatSourceForFilename(source);
      const subjectPrefix = formatSourceForFilename(subjectName);

      if (!datePrefix || !sourcePrefix || !subjectPrefix) {
        setNextNumber('001');
        return;
      }

      try {
        const result = await api.getNextResourceNumber(datePrefix, sourcePrefix, subjectPrefix);
        setNextNumber(result.nextNumber || '001');
      } catch (err) {
        console.error('Error fetching next number:', err);
        setNextNumber('001');
      }
    };

    fetchNextNumber();
  }, [source, subjectName, publicationDate]);

  // Generate the platform filename
  const generatedFilename = useMemo(() => {
    if (!source.trim() || !subjectName.trim() || !publicationDate || !file) {
      return '';
    }

    const datePrefix = formatDateForFilename(publicationDate);
    const sourcePrefix = formatSourceForFilename(source);
    const subjectPrefix = formatSourceForFilename(subjectName);
    const extension = getFileExtension(file.name);

    if (!datePrefix || !sourcePrefix || !subjectPrefix) {
      return '';
    }

    return `${datePrefix}_${sourcePrefix}_${subjectPrefix}_${nextNumber}${extension}`;
  }, [source, subjectName, publicationDate, file, nextNumber]);

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

  // Detect file type based on extension
  const getFileTypeFromExtension = useCallback((filename) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'];
    const videoExtensions = ['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv'];

    if (imageExtensions.includes(ext)) return 'photo';
    if (videoExtensions.includes(ext)) return 'video';
    return 'video'; // Default to video
  }, []);

  // Get the detected type for the selected existing file
  const existingFileType = useMemo(() => {
    if (!selectedExistingFile) return null;
    return getFileTypeFromExtension(selectedExistingFile);
  }, [selectedExistingFile, getFileTypeFromExtension]);

  // Handle going back to selection mode
  const handleBackToSelection = () => {
    setMode('selection');
    setError('');
    setDuplicateResource(null);
    // Reset form fields
    setTitle('');
    setDescription('');
    setSource('');
    setSubjectName('');
    setPublicationDate('');
    setFile(null);
    setSelectedExistingFile('');
  };

  // Handle submission for existing file
  const handleSubmitExisting = async (event) => {
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

    if (!subjectName.trim()) {
      setError(t('resourceErrorMissingSubjectName'));
      return;
    }

    if (!publicationDate) {
      setError(t('resourceErrorMissingDate'));
      return;
    }

    if (!selectedExistingFile) {
      setError(t('resourceErrorMissingFile'));
      return;
    }

    setIsSubmitting(true);
    setError('');
    setDuplicateResource(null);

    try {
      const payloadSrc = selectedExistingFile;
      const payloadType = getFileTypeFromExtension(selectedExistingFile);

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

      // Create the resource (no upload needed, file already exists)
      onCreate({
        title: title.trim(),
        description: description.trim(),
        src: payloadSrc,
        filename: selectedExistingFile,
        type: payloadType,
        source: source.trim(),
        publicationDate: publicationDate,
      });
    } catch (err) {
      console.error(err);
      setError(t('resourceErrorUpload'));
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(false);
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

    if (!subjectName.trim()) {
      setError(t('resourceErrorMissingSubjectName'));
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

  // Loading state
  if (isLoadingFiles) {
    return (
      <div className="add-resource-page">
        <div className="page-header">
          <h2>{t('addResourceTitle')}</h2>
          <p>{t('loadingTitle')}</p>
        </div>
      </div>
    );
  }

  // Selection screen with two cards
  if (mode === 'selection') {
    return (
      <div className="add-resource-page">
        <div className="page-header">
          <h2>{t('resourceSelectionTitle')}</h2>
          <p>{t('resourceSelectionSubtitle')}</p>
        </div>

        <div className="resource-selection-cards">
          <button
            type="button"
            className="resource-selection-card"
            onClick={() => setMode('upload')}
          >
            <div className="selection-card-icon upload-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            <h3>{t('resourceOptionUpload')}</h3>
            <p>{t('resourceOptionUploadDesc')}</p>
          </button>

          <button
            type="button"
            className="resource-selection-card"
            onClick={() => setMode('existing')}
          >
            <div className="selection-card-icon existing-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                <line x1="12" y1="11" x2="12" y2="17" />
                <line x1="9" y1="14" x2="15" y2="14" />
              </svg>
            </div>
            <h3>{t('resourceOptionExisting')}</h3>
            <p>{t('resourceOptionExistingDesc')}</p>
            <span className="unused-count-badge">{unusedFiles.length}</span>
          </button>
        </div>

        <div className="action-group" style={{ marginTop: 'var(--space-lg)' }}>
          <button type="button" className="ghost" onClick={onBack}>
            {t('cancel')}
          </button>
        </div>
      </div>
    );
  }

  // Existing file selection mode
  if (mode === 'existing') {
    return (
      <div className="add-resource-page">
        <div className="page-header">
          <h2>{t('addResourceTitle')}</h2>
          <p>{t('resourceOptionExistingDesc')}</p>
        </div>

        <form className="card form-grid" onSubmit={handleSubmitExisting}>
          {/* File selection dropdown */}
          <div className="field-group">
            <label htmlFor="existing-file">{t('resourceSelectFile')}</label>
            <select
              id="existing-file"
              value={selectedExistingFile}
              onChange={(e) => setSelectedExistingFile(e.target.value)}
              required
            >
              <option value="">{t('resourceSelectFilePlaceholder')}</option>
              {unusedFiles.map((file) => (
                <option key={file} value={file}>
                  {file}
                </option>
              ))}
            </select>
          </div>

          {/* Preview of selected file */}
          {selectedExistingFile && (
            <div className="field-group">
              <label>{t('resourcePreviewLabel')}</label>
              <div className="existing-file-preview">
                {existingFileType === 'photo' ? (
                  <img
                    src={`/resources/${selectedExistingFile}`}
                    alt={selectedExistingFile}
                    className="preview-media"
                  />
                ) : (
                  <video
                    src={`/resources/${selectedExistingFile}`}
                    controls
                    className="preview-media"
                  />
                )}
                <div className="preview-info">
                  <span className="preview-filename">{selectedExistingFile}</span>
                  <span className={`media-type-badge ${existingFileType}`}>
                    {existingFileType === 'photo' ? t('fileTypePhoto') : t('fileTypeVideo')}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="field-group">
            <label htmlFor="resource-title">{t('resourceNameLabel')}</label>
            <input
              id="resource-title"
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder={t('resourceTitlePlaceholder')}
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
            <label htmlFor="resource-subject-name">{t('resourceSubjectNameLabel')}</label>
            <input
              id="resource-subject-name"
              type="text"
              value={subjectName}
              onChange={(event) => setSubjectName(event.target.value)}
              placeholder={t('resourceSubjectNamePlaceholder')}
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
              placeholder={t('resourceDescriptionPlaceholder')}
              rows={4}
            />
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
            {unusedFiles.length > 0 && (
              <button type="button" className="ghost" onClick={handleBackToSelection}>
                {t('resourceBackToChoice')}
              </button>
            )}
            <button type="button" className="ghost" onClick={onBack}>
              {t('cancel')}
            </button>
            <button type="submit" className="primary" disabled={isSubmitting || !selectedExistingFile}>
              {t('addNewResourceAction')}
            </button>
          </div>
        </form>
      </div>
    );
  }

  // Upload mode (original form)
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
            placeholder={t('resourceTitlePlaceholder')}
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
          <label htmlFor="resource-subject-name">{t('resourceSubjectNameLabel')}</label>
          <input
            id="resource-subject-name"
            type="text"
            value={subjectName}
            onChange={(event) => setSubjectName(event.target.value)}
            placeholder={t('resourceSubjectNamePlaceholder')}
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
            placeholder={t('resourceDescriptionPlaceholder')}
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
                  {(file.size / (1024 * 1024)).toFixed(2)} MB • {detectedType === 'photo' ? t('fileTypePhoto') : t('fileTypeVideo')}
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
          {unusedFiles.length > 0 && (
            <button type="button" className="ghost" onClick={handleBackToSelection}>
              {t('resourceBackToChoice')}
            </button>
          )}
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
