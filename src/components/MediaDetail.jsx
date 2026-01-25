import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ActionBar from './ActionBar.jsx';

export default function MediaDetail({
  media,
  nomenclatures,
  onBack,
  onToReview,
  onToQuizz,
  onUpdateMedia,
  onDeleteMedia,
  t,
}) {
  const videoRef = useRef(null);
  const [paused, setPaused] = useState(true);
  const [hidePlayOverlay, setHidePlayOverlay] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draftAnnotations, setDraftAnnotations] = useState(media.annotations ?? []);
  const [draftTags, setDraftTags] = useState(media.tags ?? []);
  const [draftTitle, setDraftTitle] = useState(media.title ?? '');
  const [draftDescription, setDraftDescription] = useState(media.description ?? '');
  const [draftSrc, setDraftSrc] = useState(media.src ?? '');
  const [newNomenclatureLabel, setNewNomenclatureLabel] = useState('');

  const fps = media.fps ?? 30;
  const frameDuration = useMemo(() => 1 / fps, [fps]);
  const nomenclatureByLabel = useMemo(() => {
    const map = new Map();
    (nomenclatures ?? []).forEach((entry) => {
      map.set(entry.label, entry);
    });
    return map;
  }, [nomenclatures]);

  const syncDraftsWithMedia = useCallback(() => {
    setDraftAnnotations(media.annotations ?? []);
    setDraftTags(media.tags ?? []);
    setDraftTitle(media.title ?? '');
    setDraftDescription(media.description ?? '');
    setDraftSrc(media.src ?? '');
    setNewNomenclatureLabel('');
  }, [media.annotations, media.description, media.src, media.tags, media.title]);

  useEffect(() => {
    setEditing(false);
    syncDraftsWithMedia();
  }, [media, syncDraftsWithMedia]);

  const seekTo = (timeInSeconds) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(0, timeInSeconds);
    video.pause();
    setPaused(true);
    setHidePlayOverlay(true);
  };

  const sortedAnnotations = useMemo(() => {
    const source = editing ? draftAnnotations : media.annotations;
    if (!source) return [];
    return [...source].sort((a, b) => a.time - b.time);
  }, [draftAnnotations, editing, media.annotations]);

  const startEditing = useCallback(() => {
    syncDraftsWithMedia();
    setEditing(true);
  }, [syncDraftsWithMedia]);

  const cancelEditing = useCallback(() => {
    syncDraftsWithMedia();
    setEditing(false);
  }, [syncDraftsWithMedia]);

  const saveEdits = useCallback(() => {
    const nextTitle = draftTitle.trim() || media.title;
    const nextDescription = draftDescription.trim();
    const nextSrc = draftSrc.trim() || media.src;

    if (media.type === 'video') {
      const sanitizedAnnotations = (draftAnnotations ?? [])
        .map((ann) => ({ ...ann, label: ann.label.trim() }))
        .filter((ann) => ann.label);

      const sanitizedTags = Array.from(new Set(sanitizedAnnotations.map((ann) => ann.label)));

      onUpdateMedia?.(media.id, {
        annotations: sanitizedAnnotations,
        tags: sanitizedTags,
        title: nextTitle,
        description: nextDescription,
        src: nextSrc,
      });
    } else {
      const sanitizedTags = (draftTags ?? [])
        .map((tag) => tag.trim())
        .filter(Boolean);

      onUpdateMedia?.(media.id, {
        tags: sanitizedTags,
        title: nextTitle,
        description: nextDescription,
        src: nextSrc,
      });
    }

    setEditing(false);
  }, [draftAnnotations, draftDescription, draftSrc, draftTags, draftTitle, media]);

  const confirmDeletion = useCallback(() => {
    const confirmed = window.confirm(t('confirmDeleteResource', { title: media.title }));
    if (!confirmed) return;
    onDeleteMedia?.(media.id);
  }, [media.id, media.title, onDeleteMedia, t]);

  useEffect(() => {
    if (!editing) return;

    const handleKey = (event) => {
      if (event.key !== 'Enter') return;

      const isDescriptionInput = event.target?.id === 'description-input';
      if (event.shiftKey && isDescriptionInput) return;

      event.preventDefault();
      saveEdits();
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [editing, saveEdits]);

  const handlePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
      setPaused(false);
      setHidePlayOverlay(false);
    } else {
      video.pause();
      setPaused(true);
    }
  };

  const step = (direction) => {
    const video = videoRef.current;
    if (!video) return;
    video.pause();
    setPaused(true);
    video.currentTime = Math.max(0, video.currentTime + direction * frameDuration);
  };

  useEffect(() => {
    const handleKey = (event) => {
      if (media.type !== 'video') return;
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        step(-1);
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        step(1);
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [frameDuration, media.type]);

  const formatTimestamp = (timeInSeconds) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    const paddedSeconds = seconds.toFixed(1).padStart(4, '0');
    return `${minutes}:${paddedSeconds}`;
  };

  // Use displaySrc for display, raw src for editing
  const displaySrc = media.displaySrc || media.src;
  const mediaSrc = editing ? draftSrc : displaySrc;

  const findDetails = (label) => {
    const found = nomenclatureByLabel.get(label);
    if (!found) return { description: '', interpretation: '' };
    return {
      description: found.description?.trim() ?? '',
      interpretation: found.interpretation?.trim() ?? '',
    };
  };

  const handleAnnotationLabelChange = (time, currentLabel, nextValue) => {
    const nextLabel = nextValue.trim();
    if (!nextLabel) return;

    setDraftAnnotations((prev) =>
      (prev ?? []).map((ann) =>
        ann.time === time && ann.label === currentLabel ? { ...ann, label: nextValue } : ann
      )
    );
  };

  const handlePhotoTagChange = (index, nextValue) => {
    const nextLabel = nextValue.trim();
    if (!nextLabel) return;

    setDraftTags((prev) => (prev ?? []).map((tag, idx) => (idx === index ? nextValue : tag)));
  };

  const requestDelete = (label, time) => {
    const confirmed = window.confirm(
      media.type === 'video'
        ? t('confirmDeleteAnnotationVideo', { label, first: label, second: formatTimestamp(time) })
        : t('confirmDeleteAnnotationPhoto', { label })
    );

    if (!confirmed) return;

    if (media.type === 'video') {
      setDraftAnnotations((prev) =>
        (prev ?? []).filter((ann) => !(ann.label === label && ann.time === time))
      );
    } else {
      setDraftTags((prev) => (prev ?? []).filter((tag) => tag !== label));
    }
  };

  const addNomenclatureFromInput = (event) => {
    event.preventDefault();

    const trimmed = newNomenclatureLabel.trim();
    if (!trimmed) return;

    if (media.type === 'video') {
      const currentTime = Number((videoRef.current?.currentTime ?? 0).toFixed(1));

      if (editing) {
        setDraftAnnotations((prev) => {
          const next = [...(prev ?? [])];
          const exists = next.some(
            (ann) => ann.label.trim() === trimmed && ann.time === currentTime
          );
          if (exists) return next;
          return [...next, { time: currentTime, label: trimmed }];
        });
      } else {
        const exists = (media.annotations ?? []).some(
          (ann) => ann.label.trim() === trimmed && ann.time === currentTime
        );
        if (!exists) {
          const nextAnnotations = [...(media.annotations ?? []), { time: currentTime, label: trimmed }];
          const nextTags = Array.from(new Set([...(media.tags ?? []), trimmed]));
          onUpdateMedia?.(media.id, { annotations: nextAnnotations, tags: nextTags });
        }
      }
    } else {
      if (editing) {
        setDraftTags((prev) => {
          const next = prev ?? [];
          const exists = next.some((tag) => tag.trim().toLowerCase() === trimmed.toLowerCase());
          if (exists) return next;
          return [...next, trimmed];
        });
      } else {
        const exists = (media.tags ?? []).some(
          (tag) => tag.trim().toLowerCase() === trimmed.toLowerCase()
        );
        if (!exists) {
          const nextTags = [...(media.tags ?? []), trimmed];
          onUpdateMedia?.(media.id, { tags: nextTags });
        }
      }
    }

    setNewNomenclatureLabel('');
  };

  return (
    <div className="detail-view">
      <header className="detail-header">
        <div className="title-block">
          <button className="ghost" onClick={onBack}>{t('back')}</button>
          <div className="media-title">{media.title}</div>
        </div>
        <ActionBar
          editing={editing}
          onStartEdit={startEditing}
          onSave={saveEdits}
          onCancel={cancelEditing}
          onToReview={() => onToReview(media)}
          onToQuizz={() => onToQuizz(media)}
          onDelete={confirmDeletion}
          t={t}
        />
      </header>
      <div className="detail-body">
        <section className="media-panel">
          <div className="metadata-grid">
            <div className="field-group">
              {editing && (
                <label className="muted" htmlFor="title-input">
                  {t('titleLabel')}
                </label>
              )}
              {editing ? (
                <input
                  id="title-input"
                  value={draftTitle}
                  onChange={(event) => setDraftTitle(event.target.value)}
                  className="text-input"
                />
              ) : (
                <h2 className="media-heading">{media.title}</h2>
              )}
            </div>
            <div className="field-group full-span">
              {editing && (
                <label className="muted" htmlFor="description-input">
                  {t('descriptionLabel')}
                </label>
              )}
              {editing ? (
                <textarea
                  id="description-input"
                  value={draftDescription}
                  onChange={(event) => setDraftDescription(event.target.value)}
                  className="text-input"
                  rows={3}
                />
              ) : (
                <p className="description">{media.description}</p>
              )}
            </div>
            {editing && (
              <div className="field-group full-span resource-field">
                <label className="muted" htmlFor="link-input">
                  {t('linkLabel')} (nom du fichier)
                </label>
                <input
                  id="link-input"
                  value={draftSrc}
                  onChange={(event) => setDraftSrc(event.target.value)}
                  className="text-input"
                  placeholder="exemple.mp4"
                />
                <span className="muted" style={{ fontSize: '12px', marginTop: '4px' }}>
                  ℹ️ Chemin complet: /resources/{draftSrc}
                </span>
              </div>
            )}
          </div>
          {media.type === 'video' ? (
            <div className="video-wrapper">
              <video
                ref={videoRef}
                src={mediaSrc}
                controls
                className={`video-player${hidePlayOverlay ? ' hide-play-overlay' : ''}`}
                onPause={() => setPaused(true)}
                onPlay={() => {
                  setPaused(false);
                  setHidePlayOverlay(false);
                }}
              />
              <div className="video-controls">
                <button onClick={() => step(-1)} aria-label={t('previousFrame')}>
                  {t('previousFrame')}
                </button>
                <button onClick={handlePlayPause}>{paused ? t('play') : t('pause')}</button>
                <button onClick={() => step(1)} aria-label={t('nextFrame')}>
                  {t('nextFrame')}
                </button>
              </div>
            </div>
          ) : (
            <img src={mediaSrc} alt={media.title} className="photo" />
          )}
        </section>
        <aside className="tags-panel">
          <div className="tags-panel-header">
            <h3>{t('nomenclaturesHeading')}</h3>
          </div>
          <div className="annotation-section">
            {media.type === 'video' ? (
              <div className="annotation-list">
                {sortedAnnotations.map(({ time, label }, index) => {
                  const { description, interpretation } = findDetails(label);
                  const rowKey = `${media.id}-${time}-${index}`;

                  return (
                    <div key={rowKey} className={`annotation-row ${editing ? 'editing' : ''}`}>
                      {editing && (
                        <button
                          type="button"
                          className="delete-annotation"
                          aria-label={t('deleteNomenclatureLabel', { label })}
                          onClick={() => requestDelete(label, time)}
                        >
                          ×
                        </button>
                      )}
                      <div className="annotation-row-content">
                        <div className="annotation-row-header">
                          <button
                            type="button"
                            className="timestamp link"
                            onClick={() => seekTo(time)}
                            disabled={editing}
                          >
                            {formatTimestamp(time)}
                          </button>
                          {editing ? (
                            <input
                              className="badge editable"
                              value={label}
                              onChange={(e) => handleAnnotationLabelChange(time, label, e.target.value)}
                              aria-label={t('nomenclatureLabel')}
                            />
                          ) : (
                            <span className="badge">{label}</span>
                          )}
                        </div>
                        {!editing && description && (
                          <div className="annotation-description">{description}</div>
                        )}
                        {!editing && interpretation && (
                          <div className="annotation-description">{interpretation}</div>
                        )}
                      </div>
                    </div>
                  );
                })}
                {sortedAnnotations.length === 0 && (
                  <div className="muted">{t('noTimedNomenclatures')}</div>
                )}
              </div>
            ) : (
              <div className="annotation-list">
                {(editing ? draftTags : media.tags).map((tag, index) => {
                  const { description, interpretation } = findDetails(tag);

                  return (
                    <div
                      key={`${media.id}-photo-tag-${index}`}
                      className={`annotation-row ${editing ? 'editing' : ''}`}
                    >
                      {editing && (
                        <button
                          type="button"
                          className="delete-annotation"
                          aria-label={t('deleteNomenclatureLabel', { label: tag })}
                          onClick={() => requestDelete(tag)}
                        >
                          ×
                        </button>
                      )}
                      <div className="annotation-row-content">
                        <div className="annotation-row-header">
                          {editing ? (
                            <input
                              className="badge editable"
                              value={tag}
                              onChange={(e) => handlePhotoTagChange(index, e.target.value)}
                              aria-label={t('nomenclatureLabel')}
                            />
                          ) : (
                            <span className="badge">{tag}</span>
                          )}
                        </div>
                        {!editing && description && (
                          <div className="annotation-description">{description}</div>
                        )}
                        {!editing && interpretation && (
                          <div className="annotation-description">{interpretation}</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          {!editing && (
            <form className="add-nomenclature-form" onSubmit={addNomenclatureFromInput}>
              <input
                value={newNomenclatureLabel}
                onChange={(event) => setNewNomenclatureLabel(event.target.value)}
                placeholder={t('newNomenclaturePlaceholder')}
                aria-label={t('addNomenclatureAria')}
              />
              <button type="submit" className="primary compact">
                {t('add')}
              </button>
            </form>
          )}
        </aside>
      </div>
    </div>
  );
}
