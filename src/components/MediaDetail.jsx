import React, { useEffect, useMemo, useRef, useState } from 'react';
import ActionBar from './ActionBar.jsx';

export default function MediaDetail({
  media,
  nomenclatures,
  onBack,
  onToReview,
  onToQuizz,
  onUpdateMedia,
}) {
  const videoRef = useRef(null);
  const [paused, setPaused] = useState(true);
  const [editing, setEditing] = useState(false);

  const fps = media.fps ?? 30;
  const frameDuration = useMemo(() => 1 / fps, [fps]);
  const nomenclatureByLabel = useMemo(() => {
    const map = new Map();
    (nomenclatures ?? []).forEach((entry) => {
      map.set(entry.label, entry);
    });
    return map;
  }, [nomenclatures]);

  const toggleEditing = () => setEditing((prev) => !prev);

  const seekTo = (timeInSeconds) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(0, timeInSeconds);
    if (!video.paused) {
      video.play();
    }
  };

  const sortedAnnotations = useMemo(() => {
    if (!media.annotations) return [];
    return [...media.annotations].sort((a, b) => a.time - b.time);
  }, [media.annotations]);

  const handlePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
      setPaused(false);
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

  const findDescription = (label) => {
    const found = nomenclatureByLabel.get(label);
    if (!found) return '';
    return found.description?.trim() ?? '';
  };

  const handleAnnotationLabelChange = (time, currentLabel, nextValue) => {
    const nextLabel = nextValue.trim();
    if (!nextLabel) return;

    onUpdateMedia?.(media.id, (item) => {
      const updatedAnnotations = (item.annotations ?? []).map((ann) =>
        ann.time === time && ann.label === currentLabel ? { ...ann, label: nextLabel } : ann
      );

      let updatedTags = item.tags ?? [];
      const stillUsesOldLabel = updatedAnnotations.some((ann) => ann.label === currentLabel);
      updatedTags = stillUsesOldLabel
        ? updatedTags
        : updatedTags.filter((tag) => tag !== currentLabel);

      if (!updatedTags.includes(nextLabel)) {
        updatedTags = [...updatedTags, nextLabel];
      }

      return {
        ...item,
        annotations: updatedAnnotations,
        tags: updatedTags,
      };
    });
  };

  const handlePhotoTagChange = (index, nextValue) => {
    const nextLabel = nextValue.trim();
    if (!nextLabel) return;

    onUpdateMedia?.(media.id, (item) => {
      const updatedTags = item.tags.map((tag, idx) => (idx === index ? nextLabel : tag));
      return { ...item, tags: updatedTags };
    });
  };

  const requestDelete = (label, time) => {
    const confirmed = window.confirm(
      media.type === 'video'
        ? `Supprimer la nomenclature "${label}" à ${formatTimestamp(time)} ?`
        : `Supprimer la nomenclature "${label}" de cette photo ?`
    );

    if (!confirmed) return;

    onUpdateMedia?.(media.id, (item) => {
      const remainingAnnotations = (item.annotations ?? []).filter(
        (ann) => !(ann.label === label && ann.time === time)
      );

      let updatedTags = item.tags ?? [];
      if (item.type === 'video') {
        const labelStillUsed = remainingAnnotations.some((ann) => ann.label === label);
        updatedTags = labelStillUsed
          ? updatedTags
          : updatedTags.filter((tag) => tag !== label);
      } else {
        updatedTags = updatedTags.filter((tag) => tag !== label);
      }

      return { ...item, annotations: remainingAnnotations, tags: updatedTags };
    });
  };

  return (
    <div className="detail-view">
      <header className="detail-header">
        <div className="title-block">
          <button className="ghost" onClick={onBack}>&larr; Retour</button>
          <div className="media-title">{media.title}</div>
        </div>
        <ActionBar
          editing={editing}
          onEdit={toggleEditing}
          onToReview={() => onToReview(media)}
          onToQuizz={() => onToQuizz(media)}
        />
      </header>
      <div className="detail-body">
        <section className="media-panel">
          <h2 className="media-heading">{media.title}</h2>
          {media.type === 'video' ? (
            <div className="video-wrapper">
              <video
                ref={videoRef}
                src={media.src}
                controls
                className="video-player"
                onPause={() => setPaused(true)}
                onPlay={() => setPaused(false)}
              />
              <div className="video-controls">
                <button onClick={() => step(-1)} aria-label="Image précédente">
                  ← Image
                </button>
                <button onClick={handlePlayPause}>{paused ? 'Lecture' : 'Pause'}</button>
                <button onClick={() => step(1)} aria-label="Image suivante">
                  Image →
                </button>
              </div>
            </div>
          ) : (
            <img src={media.src} alt={media.title} className="photo" />
          )}
          <p className="description">{media.description}</p>
        </section>
        <aside className="tags-panel">
          <h3>Nomenclatures</h3>
          {media.type === 'video' ? (
            <div className="annotation-list">
              {sortedAnnotations.map(({ time, label }) => {
                const description = findDescription(label);
                const rowKey = `${media.id}-${time}-${label}`;

                return (
                  <div key={rowKey} className={`annotation-row ${editing ? 'editing' : ''}`}>
                    {editing && (
                      <button
                        type="button"
                        className="delete-annotation"
                        aria-label={`Supprimer ${label}`}
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
                            aria-label="Nomenclature"
                          />
                        ) : (
                          <span className="badge">{label}</span>
                        )}
                      </div>
                      {!editing &&
                        description && (
                          <div className="annotation-description">{description}</div>
                        )}
                    </div>
                  </div>
                );
              })}
              {sortedAnnotations.length === 0 && (
                <div className="muted">Aucune nomenclature horodatée.</div>
              )}
            </div>
          ) : (
            <div className="annotation-list">
              {media.tags.map((tag, index) => {
                const description = findDescription(tag);

                return (
                  <div
                    key={`${tag}-${index}`}
                    className={`annotation-row ${editing ? 'editing' : ''}`}
                  >
                    {editing && (
                      <button
                        type="button"
                        className="delete-annotation"
                        aria-label={`Supprimer ${tag}`}
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
                            aria-label="Nomenclature"
                          />
                        ) : (
                          <span className="badge">{tag}</span>
                        )}
                      </div>
                      {!editing &&
                        description && (
                          <div className="annotation-description">{description}</div>
                        )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
