import React, { useEffect, useMemo, useRef, useState } from 'react';
import ActionBar from './ActionBar.jsx';

export default function MediaDetail({ media, nomenclatures, onBack, onToReview, onToQuizz }) {
  const videoRef = useRef(null);
  const [paused, setPaused] = useState(true);

  const fps = media.fps ?? 30;
  const frameDuration = useMemo(() => 1 / fps, [fps]);
  const nomenclatureByLabel = useMemo(() => {
    const map = new Map();
    (nomenclatures ?? []).forEach((entry) => {
      map.set(entry.label, entry);
    });
    return map;
  }, [nomenclatures]);
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

  return (
    <div className="detail-view">
      <header className="detail-header">
        <div className="title-block">
          <button className="ghost" onClick={onBack}>&larr; Retour</button>
          <div className="media-title">{media.title}</div>
        </div>
        <ActionBar
          onEdit={() => alert('Edition à implémenter')}
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
              {sortedAnnotations.map(({ time, label }) => (
                <div key={`${media.id}-${time}-${label}`} className="annotation-row">
                  <div className="annotation-row-header">
                    <button
                      type="button"
                      className="timestamp link"
                      onClick={() => seekTo(time)}
                    >
                      {formatTimestamp(time)}
                    </button>
                    <span className="badge">{label}</span>
                  </div>
                  {findDescription(label) && (
                    <div className="annotation-description">{findDescription(label)}</div>
                  )}
                </div>
              ))}
              {sortedAnnotations.length === 0 && (
                <div className="muted">Aucune nomenclature horodatée.</div>
              )}
            </div>
          ) : (
            <div className="annotation-list">
              {media.tags.map((tag) => (
                <div className="annotation-row" key={tag}>
                  <div className="annotation-row-header">
                    <span className="badge">{tag}</span>
                  </div>
                  {findDescription(tag) && (
                    <div className="annotation-description">{findDescription(tag)}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
