import React, { useMemo, useRef, useState } from 'react';
import ActionBar from './ActionBar.jsx';

export default function MediaDetail({ media, onBack, onToReview, onToQuizz }) {
  const videoRef = useRef(null);
  const [paused, setPaused] = useState(true);

  const fps = media.fps ?? 30;
  const frameDuration = useMemo(() => 1 / fps, [fps]);

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

  return (
    <div className="detail-view">
      <header className="detail-header">
        <button className="ghost" onClick={onBack}>&larr; Retour</button>
        <ActionBar
          onEdit={() => alert('Edition à implémenter')}
          onToReview={() => onToReview(media)}
          onToQuizz={() => onToQuizz(media)}
        />
      </header>
      <div className="detail-body">
        <section className="media-panel">
          {media.type === 'video' ? (
            <div className="video-wrapper">
              <video ref={videoRef} src={media.src} controls className="video-player" onPause={() => setPaused(true)} onPlay={() => setPaused(false)} />
              <div className="video-controls">
                <button onClick={() => step(-1)}>&lt; image</button>
                <button onClick={handlePlayPause}>{paused ? 'Lecture' : 'Pause'}</button>
                <button onClick={() => step(1)}>image &gt;</button>
              </div>
            </div>
          ) : (
            <img src={media.src} alt={media.title} className="photo" />
          )}
          <p className="description">{media.description}</p>
        </section>
        <aside className="tags-panel">
          <h3>Nomenclatures</h3>
          <div className="tags">
            {media.tags.map((tag) => (
              <span className="badge" key={tag}>
                {tag}
              </span>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
