import React, { memo, useCallback, useState, useRef } from 'react';
import {
  Play,
  Image,
  Clock,
  Edit3,
  Trash2,
  ListPlus,
  HelpCircle,
  Eye,
  MoreVertical,
  X
} from 'lucide-react';

/**
 * Modern MediaCard component with hover preview and quick actions
 * Features: video preview on hover, quick action buttons, duration badge
 */
const MediaCard = memo(function MediaCard({
  item,
  onSelect,
  videoLabel,
  photoLabel,
  onQuickEdit,
  onQuickDelete,
  onAddToReview,
  onAddToQuiz,
  onRemoveFromList,
  removeLabel = 'Remove',
  inReviewList = false,
  inQuizList = false,
  viewMode = 'grid',
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const videoRef = useRef(null);
  const hoverTimeoutRef = useRef(null);

  const handleClick = useCallback(() => {
    onSelect(item);
  }, [item, onSelect]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect(item);
    }
  }, [item, onSelect]);

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
    // Start video preview after a short delay
    if (item.type === 'video' && videoRef.current) {
      hoverTimeoutRef.current = setTimeout(() => {
        videoRef.current?.play()?.catch(() => {});
      }, 500);
    }
  }, [item.type]);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    setShowActions(false);
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, []);

  const handleQuickAction = useCallback((e, action) => {
    e.stopPropagation();
    action?.(item);
    setShowActions(false);
  }, [item]);

  const toggleActions = useCallback((e) => {
    e.stopPropagation();
    setShowActions(prev => !prev);
  }, []);

  const isVideo = item.type === 'video';
  const TypeIcon = isVideo ? Play : Image;

  // List view render
  if (viewMode === 'list') {
    return (
      <div
        className="media-card-list glass"
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        aria-label={`${item.title} - ${isVideo ? videoLabel : photoLabel}`}
      >
        <div className="media-card-list-preview">
          {isVideo ? (
            <Play size={24} className="preview-icon" />
          ) : (
            <Image size={24} className="preview-icon" />
          )}
        </div>
        <div className="media-card-list-content">
          <div className="media-card-list-header">
            <h3>{item.title}</h3>
            <span className={`media-type-badge ${item.type}`}>
              <TypeIcon size={12} />
              {isVideo ? videoLabel : photoLabel}
            </span>
          </div>
          <p className="description-line">{item.description}</p>
          <div className="tags-line">
            {item.tags.slice(0, 5).map((tag) => (
              <span className="badge small" key={`${item.id}-${tag}`}>
                {tag}
              </span>
            ))}
            {item.tags.length > 5 && (
              <span className="badge small muted">+{item.tags.length - 5}</span>
            )}
          </div>
        </div>
        <div className="media-card-list-indicators">
          {inReviewList && (
            <span className="indicator-badge review" title="In Review List">
              <Eye size={14} />
            </span>
          )}
          {inQuizList && (
            <span className="indicator-badge quiz" title="In Quiz List">
              <HelpCircle size={14} />
            </span>
          )}
        </div>
        <div className="media-card-list-actions">
          <button
            className="icon-btn ghost small"
            onClick={toggleActions}
            aria-label="More actions"
          >
            <MoreVertical size={18} />
          </button>
          {showActions && (
            <div className="quick-actions-dropdown glass">
              {onQuickEdit && (
                <button onClick={(e) => handleQuickAction(e, onQuickEdit)}>
                  <Edit3 size={14} /> Edit
                </button>
              )}
              {onAddToReview && !inReviewList && (
                <button onClick={(e) => handleQuickAction(e, onAddToReview)}>
                  <ListPlus size={14} /> Add to Review
                </button>
              )}
              {onAddToQuiz && !inQuizList && (
                <button onClick={(e) => handleQuickAction(e, onAddToQuiz)}>
                  <HelpCircle size={14} /> Add to Quiz
                </button>
              )}
              {onQuickDelete && (
                <button className="danger" onClick={(e) => handleQuickAction(e, onQuickDelete)}>
                  <Trash2 size={14} /> Delete
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Grid view render (default)
  return (
    <div
      className={`card media-card glass ${isHovered ? 'hovered' : ''}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      role="button"
      tabIndex={0}
      aria-label={`${item.title} - ${isVideo ? videoLabel : photoLabel}`}
    >
      {/* Preview area for videos */}
      {isVideo && item.displaySrc && (
        <div className="media-card-preview">
          <video
            ref={videoRef}
            src={item.displaySrc}
            muted
            loop
            playsInline
            preload="metadata"
          />
          <div className="preview-overlay">
            <Play size={32} className="play-icon" />
          </div>
        </div>
      )}

      {/* Photo thumbnail */}
      {!isVideo && item.displaySrc && (
        <div className="media-card-preview photo">
          <img
            src={item.displaySrc}
            alt={item.title}
            loading="lazy"
          />
        </div>
      )}

      {/* Card content */}
      <div className="media-card-content">
        <div className="media-card-header">
          <span className={`media-type-badge ${item.type}`}>
            <TypeIcon size={12} />
            {isVideo ? videoLabel : photoLabel}
          </span>
          {/* Status indicators or remove button */}
          {onRemoveFromList ? (
            <button
              type="button"
              className="remove-from-list-btn"
              onClick={(e) => {
                e.stopPropagation();
                onRemoveFromList();
              }}
              aria-label={removeLabel}
              title={removeLabel}
            >
              <X size={16} />
            </button>
          ) : (
            <div className="status-indicators">
              {inReviewList && (
                <span className="indicator-dot review" title="In Review List" />
              )}
              {inQuizList && (
                <span className="indicator-dot quiz" title="In Quiz List" />
              )}
            </div>
          )}
        </div>

        <h3>{item.title}</h3>
        <p className="description">{item.description}</p>

        <div className="tags" aria-label="Tags">
          {item.tags.slice(0, 4).map((tag) => (
            <span className="badge" key={`${item.id}-${tag}`}>
              {tag}
            </span>
          ))}
          {item.tags.length > 4 && (
            <span className="badge muted">+{item.tags.length - 4}</span>
          )}
        </div>
      </div>

      {/* Quick actions on hover */}
      {isHovered && (
        <div className="media-card-actions">
          {onQuickEdit && (
            <button
              className="quick-action-btn"
              onClick={(e) => handleQuickAction(e, onQuickEdit)}
              title="Quick Edit"
            >
              <Edit3 size={16} />
            </button>
          )}
          {onAddToReview && !inReviewList && (
            <button
              className="quick-action-btn"
              onClick={(e) => handleQuickAction(e, onAddToReview)}
              title="Add to Review"
            >
              <ListPlus size={16} />
            </button>
          )}
          {onAddToQuiz && !inQuizList && (
            <button
              className="quick-action-btn"
              onClick={(e) => handleQuickAction(e, onAddToQuiz)}
              title="Add to Quiz"
            >
              <HelpCircle size={16} />
            </button>
          )}
          {onQuickDelete && (
            <button
              className="quick-action-btn danger"
              onClick={(e) => handleQuickAction(e, onQuickDelete)}
              title="Delete"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      )}

      {/* Duration badge for videos */}
      {isVideo && item.duration && (
        <span className="duration-badge">
          <Clock size={12} />
          {item.duration}
        </span>
      )}
    </div>
  );
});

export default MediaCard;
