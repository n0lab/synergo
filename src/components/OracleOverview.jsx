import React, { memo, useMemo, useState } from 'react';
import { Plus, ListPlus, HelpCircle } from 'lucide-react';
import StatsCard from './StatsCard.jsx';
import SearchBar from './SearchBar.jsx';
import MediaCard from './MediaCard.jsx';
import ViewToggle from './ViewToggle.jsx';
import FilterPanel from './FilterPanel.jsx';
import { SkeletonGrid } from './SkeletonLoader.jsx';

/**
 * OracleOverview - Main media browsing view with modern UI
 * Features: view toggle, advanced filters, grid/list modes
 */
const OracleOverview = memo(function OracleOverview({
  stats,
  query,
  onQueryChange,
  items,
  onSelect,
  activeType,
  onTypeChange,
  onAddResource,
  onAddResultsToReview,
  onAddResultsToQuizz,
  onAddToReview,
  onAddToQuiz,
  onQuickDelete,
  reviewListIds = [],
  quizListIds = [],
  availableTags = [],
  isLoading = false,
  t,
}) {
  const [viewMode, setViewMode] = useState('grid');
  const [gridSize, setGridSize] = useState('medium');
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [selectedTags, setSelectedTags] = useState([]);
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');

  const hasQuery = query.trim().length > 0;

  // Memoize labels to prevent MediaCard re-renders
  const videoLabel = useMemo(() => t('oracleVideoTag'), [t]);
  const photoLabel = useMemo(() => t('oraclePhotoTag'), [t]);

  // Create sets for quick lookup
  const reviewSet = useMemo(() => new Set(reviewListIds), [reviewListIds]);
  const quizSet = useMemo(() => new Set(quizListIds), [quizListIds]);

  // Calculate active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (activeType !== 'all') count++;
    if (selectedTags.length > 0) count += selectedTags.length;
    return count;
  }, [activeType, selectedTags]);

  // Filter and sort items
  const processedItems = useMemo(() => {
    let result = [...items];

    // Filter by selected tags
    if (selectedTags.length > 0) {
      result = result.filter(item =>
        selectedTags.some(tag => item.tags?.includes(tag))
      );
    }

    // Sort items
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'type':
          comparison = a.type.localeCompare(b.type);
          break;
        case 'tags':
          comparison = (b.tags?.length || 0) - (a.tags?.length || 0);
          break;
        case 'date':
        default:
          const dateA = Math.max(a.updatedAt ?? 0, a.addedAt ?? 0);
          const dateB = Math.max(b.updatedAt ?? 0, b.addedAt ?? 0);
          comparison = dateB - dateA;
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [items, selectedTags, sortBy, sortOrder]);

  const handleResetFilters = () => {
    onTypeChange('all');
    setSelectedTags([]);
    setSortBy('date');
    setSortOrder('desc');
  };

  // Grid size class
  const gridSizeClass = `grid-${gridSize}`;

  return (
    <div className="oracle" role="main" aria-label="Media library">
      {/* Header Section */}
      <div className="oracle-header">
        <div className="oracle-title-section">
          <h2>{t('oracleTitle')}</h2>
          <p className="oracle-subtitle">{t('oracleSubtitle')}</p>
        </div>

        <div className="oracle-stats">
          <StatsCard
            label={t('oracleVideos')}
            value={stats.videos}
            accent="#7f5af0"
            onClick={() => onTypeChange(activeType === 'video' ? 'all' : 'video')}
            active={activeType === 'video'}
          />
          <StatsCard
            label={t('oraclePhotos')}
            value={stats.photos}
            accent="#2cb67d"
            onClick={() => onTypeChange(activeType === 'photo' ? 'all' : 'photo')}
            active={activeType === 'photo'}
          />
        </div>
      </div>

      {/* Toolbar Section */}
      <div className="oracle-toolbar glass">
        <div className="toolbar-left">
          <SearchBar value={query} onChange={onQueryChange} t={t} />
          <FilterPanel
            isOpen={isFilterPanelOpen}
            onToggle={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
            typeFilter={activeType}
            onTypeChange={onTypeChange}
            selectedTags={selectedTags}
            onTagsChange={setSelectedTags}
            availableTags={availableTags}
            sortBy={sortBy}
            onSortChange={setSortBy}
            sortOrder={sortOrder}
            onSortOrderChange={setSortOrder}
            onReset={handleResetFilters}
            activeFiltersCount={activeFiltersCount}
            t={t}
          />
        </div>

        <div className="toolbar-right">
          {/* Bulk actions when search is active */}
          {hasQuery && processedItems.length > 0 && (
            <div className="bulk-actions">
              <button
                className="ghost info compact"
                type="button"
                onClick={onAddResultsToReview}
                aria-label={`${t('oracleToReviewer')} (${processedItems.length} items)`}
              >
                <ListPlus size={16} />
                <span className="btn-label">{t('oracleToReviewer')}</span>
                <span className="count-badge">{processedItems.length}</span>
              </button>
              <button
                className="ghost purple compact"
                type="button"
                onClick={onAddResultsToQuizz}
                aria-label={`${t('oracleToQuizz')} (${processedItems.length} items)`}
              >
                <HelpCircle size={16} />
                <span className="btn-label">{t('oracleToQuizz')}</span>
                <span className="count-badge">{processedItems.length}</span>
              </button>
            </div>
          )}

          <ViewToggle
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            gridSize={gridSize}
            onGridSizeChange={setGridSize}
            t={t}
          />

          <button
            type="button"
            className="primary compact add-resource-btn"
            onClick={onAddResource}
          >
            <Plus size={18} />
            <span>{t('oracleAdd')}</span>
          </button>
        </div>
      </div>

      {/* Results info */}
      {(hasQuery || activeFiltersCount > 0) && (
        <div className="results-info">
          <span className="results-count">
            {processedItems.length} {t('resultsFound') || 'result(s)'}
          </span>
          {activeFiltersCount > 0 && (
            <button
              className="ghost small clear-filters-btn"
              onClick={handleResetFilters}
            >
              {t('clearFilters') || 'Clear filters'}
            </button>
          )}
        </div>
      )}

      {/* Content Grid/List */}
      {isLoading ? (
        <SkeletonGrid count={6} />
      ) : viewMode === 'list' ? (
        <div className="media-list" role="list" aria-label={`Media items (${processedItems.length} results)`}>
          {processedItems.map((item) => (
            <MediaCard
              key={item.id}
              item={item}
              onSelect={onSelect}
              videoLabel={videoLabel}
              photoLabel={photoLabel}
              viewMode="list"
              onAddToReview={onAddToReview}
              onAddToQuiz={onAddToQuiz}
              onQuickDelete={onQuickDelete}
              inReviewList={reviewSet.has(item.id)}
              inQuizList={quizSet.has(item.id)}
            />
          ))}
          {processedItems.length === 0 && (
            <div className="empty-state">
              <p className="muted">{t('oracleNoResults')}</p>
            </div>
          )}
        </div>
      ) : (
        <div
          className={`grid ${gridSizeClass}`}
          role="grid"
          aria-label={`Media items (${processedItems.length} results)`}
        >
          {processedItems.map((item) => (
            <MediaCard
              key={item.id}
              item={item}
              onSelect={onSelect}
              videoLabel={videoLabel}
              photoLabel={photoLabel}
              viewMode="grid"
              onAddToReview={onAddToReview}
              onAddToQuiz={onAddToQuiz}
              onQuickDelete={onQuickDelete}
              inReviewList={reviewSet.has(item.id)}
              inQuizList={quizSet.has(item.id)}
            />
          ))}
          {processedItems.length === 0 && (
            <div className="empty-state" role="status">
              <p className="muted">{t('oracleNoResults')}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

export default OracleOverview;
