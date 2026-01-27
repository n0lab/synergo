import React from 'react';
import { LayoutGrid, List, Grid3X3 } from 'lucide-react';

/**
 * ViewToggle - Switch between grid and list view modes
 */
export default function ViewToggle({
  viewMode,
  onViewModeChange,
  gridSize = 'medium',
  onGridSizeChange,
  t
}) {
  return (
    <div className="view-toggle">
      <div className="view-toggle-group">
        <button
          className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
          onClick={() => onViewModeChange('grid')}
          title={t?.('viewGrid') || 'Grid view'}
          aria-label="Grid view"
          aria-pressed={viewMode === 'grid'}
        >
          <LayoutGrid size={18} />
        </button>
        <button
          className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
          onClick={() => onViewModeChange('list')}
          title={t?.('viewList') || 'List view'}
          aria-label="List view"
          aria-pressed={viewMode === 'list'}
        >
          <List size={18} />
        </button>
      </div>

      {viewMode === 'grid' && onGridSizeChange && (
        <div className="grid-size-toggle">
          <button
            className={`grid-size-btn ${gridSize === 'small' ? 'active' : ''}`}
            onClick={() => onGridSizeChange('small')}
            title={t?.('gridSmall') || 'Small'}
            aria-label="Small grid"
          >
            <Grid3X3 size={14} />
          </button>
          <button
            className={`grid-size-btn ${gridSize === 'medium' ? 'active' : ''}`}
            onClick={() => onGridSizeChange('medium')}
            title={t?.('gridMedium') || 'Medium'}
            aria-label="Medium grid"
          >
            <Grid3X3 size={16} />
          </button>
          <button
            className={`grid-size-btn ${gridSize === 'large' ? 'active' : ''}`}
            onClick={() => onGridSizeChange('large')}
            title={t?.('gridLarge') || 'Large'}
            aria-label="Large grid"
          >
            <Grid3X3 size={18} />
          </button>
        </div>
      )}
    </div>
  );
}
