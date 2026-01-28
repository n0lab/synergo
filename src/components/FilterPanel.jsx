import React, { useState, useMemo } from 'react';
import {
  Filter,
  X,
  ChevronDown,
  ChevronUp,
  Video,
  Image,
  Tag,
  Calendar,
  SortAsc,
  SortDesc,
  RotateCcw
} from 'lucide-react';

/**
 * FilterPanel - Advanced filtering options for media library
 */
export default function FilterPanel({
  isOpen,
  onToggle,
  typeFilter,
  onTypeChange,
  selectedTags = [],
  onTagsChange,
  availableTags = [],
  sortBy = 'date',
  onSortChange,
  sortOrder = 'desc',
  onSortOrderChange,
  dateRange,
  onDateRangeChange,
  onReset,
  activeFiltersCount = 0,
  t
}) {
  const [tagSearchQuery, setTagSearchQuery] = useState('');
  const [isTagsExpanded, setIsTagsExpanded] = useState(false);

  const filteredTags = useMemo(() => {
    if (!tagSearchQuery.trim()) return availableTags;
    const query = tagSearchQuery.toLowerCase();
    return availableTags.filter(tag =>
      tag.label.toLowerCase().includes(query)
    );
  }, [availableTags, tagSearchQuery]);

  const handleTagToggle = (tagLabel) => {
    const newTags = selectedTags.includes(tagLabel)
      ? selectedTags.filter(t => t !== tagLabel)
      : [...selectedTags, tagLabel];
    onTagsChange?.(newTags);
  };

  const sortOptions = [
    { value: 'date', label: t?.('sortByDate') || 'Date' },
    { value: 'title', label: t?.('sortByTitle') || 'Title' },
    { value: 'type', label: t?.('sortByType') || 'Type' },
    { value: 'tags', label: t?.('sortByTags') || 'Tags count' },
  ];

  return (
    <div className="filter-panel-wrapper">
      <button
        className={`ghost filter-toggle-btn ${activeFiltersCount > 0 ? 'has-filters' : ''}`}
        onClick={onToggle}
        aria-expanded={isOpen}
      >
        <Filter size={18} />
        <span>{t?.('filters') || 'Filters'}</span>
        {activeFiltersCount > 0 && (
          <span className="filter-count-badge">{activeFiltersCount}</span>
        )}
        {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {isOpen && (
        <div className="filter-panel glass">
          <div className="filter-panel-header">
            <h4>{t?.('filterOptions') || 'Filter Options'}</h4>
            <button
              className="ghost small icon-btn"
              onClick={onReset}
              title={t?.('resetFilters') || 'Reset filters'}
            >
              <RotateCcw size={16} />
            </button>
          </div>

          {/* Type Filter */}
          <div className="filter-section">
            <label className="filter-label">
              <Video size={16} />
              {t?.('filterByType') || 'Type'}
            </label>
            <div className="filter-type-buttons">
              <button
                className={`filter-type-btn ${typeFilter === 'all' ? 'active' : ''}`}
                onClick={() => onTypeChange('all')}
              >
                {t?.('filterAll') || 'All'}
              </button>
              <button
                className={`filter-type-btn ${typeFilter === 'video' ? 'active' : ''}`}
                onClick={() => onTypeChange('video')}
              >
                <Video size={14} />
                {t?.('filterVideos') || 'Videos'}
              </button>
              <button
                className={`filter-type-btn ${typeFilter === 'photo' ? 'active' : ''}`}
                onClick={() => onTypeChange('photo')}
              >
                <Image size={14} />
                {t?.('filterPhotos') || 'Photos'}
              </button>
            </div>
          </div>

          {/* Sort Options */}
          <div className="filter-section">
            <label className="filter-label">
              <SortAsc size={16} />
              {t?.('sortBy') || 'Sort by'}
            </label>
            <div className="filter-sort-group">
              <select
                className="filter-select"
                value={sortBy}
                onChange={(e) => onSortChange?.(e.target.value)}
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <button
                className={`ghost small icon-btn sort-order-btn`}
                onClick={() => onSortOrderChange?.(sortOrder === 'asc' ? 'desc' : 'asc')}
                title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
              >
                {sortOrder === 'asc' ? <SortAsc size={18} /> : <SortDesc size={18} />}
              </button>
            </div>
          </div>

          {/* Date Range */}
          {onDateRangeChange && (
            <div className="filter-section">
              <label className="filter-label">
                <Calendar size={16} />
                {t?.('dateRange') || 'Date range'}
              </label>
              <div className="filter-date-range">
                <input
                  type="date"
                  value={dateRange?.start || ''}
                  onChange={(e) => onDateRangeChange({ ...dateRange, start: e.target.value })}
                  placeholder="From"
                />
                <span className="date-separator">-</span>
                <input
                  type="date"
                  value={dateRange?.end || ''}
                  onChange={(e) => onDateRangeChange({ ...dateRange, end: e.target.value })}
                  placeholder="To"
                />
              </div>
            </div>
          )}

          {/* Tags Filter */}
          {availableTags.length > 0 && (
            <div className="filter-section">
              <div
                className="filter-label clickable"
                onClick={() => setIsTagsExpanded(!isTagsExpanded)}
              >
                <Tag size={16} />
                {t?.('filterByTags') || 'Tags'}
                {selectedTags.length > 0 && (
                  <span className="selected-count">({selectedTags.length})</span>
                )}
                {isTagsExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>

              {isTagsExpanded && (
                <div className="filter-tags-section">
                  <input
                    type="text"
                    className="filter-tag-search"
                    placeholder={t?.('searchTags') || 'Search tags...'}
                    value={tagSearchQuery}
                    onChange={(e) => setTagSearchQuery(e.target.value)}
                  />
                  <div className="filter-tags-list">
                    {filteredTags.slice(0, 20).map(tag => (
                      <button
                        key={tag.label}
                        className={`filter-tag-btn ${selectedTags.includes(tag.label) ? 'active' : ''}`}
                        onClick={() => handleTagToggle(tag.label)}
                      >
                        {tag.label}
                        {tag.count && <span className="tag-count">{tag.count}</span>}
                      </button>
                    ))}
                    {filteredTags.length > 20 && (
                      <span className="more-tags">
                        +{filteredTags.length - 20} {t?.('moreTags') || 'more'}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Selected Tags Display */}
          {selectedTags.length > 0 && (
            <div className="selected-tags">
              {selectedTags.map(tag => (
                <span key={tag} className="selected-tag">
                  {tag}
                  <button
                    className="remove-tag-btn"
                    onClick={() => handleTagToggle(tag)}
                    aria-label={`Remove ${tag}`}
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
