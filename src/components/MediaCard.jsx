import React, { memo, useCallback } from 'react';

/**
 * Memoized MediaCard component
 * Prevents unnecessary re-renders when parent state changes
 */
const MediaCard = memo(function MediaCard({
  item,
  onSelect,
  videoLabel,
  photoLabel
}) {
  const handleClick = useCallback(() => {
    onSelect(item);
  }, [item, onSelect]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect(item);
    }
  }, [item, onSelect]);

  return (
    <div
      className="card media-card"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`${item.title} - ${item.type === 'video' ? videoLabel : photoLabel}`}
    >
      <div className="media-type" aria-hidden="true">
        {item.type === 'video' ? videoLabel : photoLabel}
      </div>
      <h3>{item.title}</h3>
      <p className="description">{item.description}</p>
      <div className="tags" aria-label="Tags">
        {item.tags.map((tag) => (
          <span className="badge" key={`${item.id}-${tag}`}>
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
});

export default MediaCard;
