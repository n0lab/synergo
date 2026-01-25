// src/components/CategoryFilter.jsx
import React, { useMemo, useState } from 'react';
import { extractCategories } from '../utils/search.js';

export default function CategoryFilter({ media, onFilterChange, t }) {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [expanded, setExpanded] = useState(false);

  const categories = useMemo(() => extractCategories(media), [media]);

  const handleCategoryClick = (categoryKey) => {
    if (selectedCategory === categoryKey) {
      setSelectedCategory(null);
      setSelectedSubcategory(null);
      onFilterChange?.(null);
    } else {
      setSelectedCategory(categoryKey);
      setSelectedSubcategory(null);
      onFilterChange?.(categoryKey);
    }
  };

  const handleSubcategoryClick = (subcategoryKey) => {
    if (selectedSubcategory === subcategoryKey) {
      setSelectedSubcategory(null);
      onFilterChange?.(selectedCategory);
    } else {
      setSelectedSubcategory(subcategoryKey);
      onFilterChange?.(subcategoryKey);
    }
  };

  const clearFilter = () => {
    setSelectedCategory(null);
    setSelectedSubcategory(null);
    onFilterChange?.(null);
  };

  if (categories.length === 0) {
    return null;
  }

  return (
    <div className="category-filter">
      <button 
        className="filter-toggle ghost"
        onClick={() => setExpanded(!expanded)}
      >
        📂 {t?.('filterByCategory') || 'Filtrer par catégorie'}
        {(selectedCategory || selectedSubcategory) && (
          <span className="filter-badge">{selectedSubcategory || selectedCategory}</span>
        )}
      </button>

      {expanded && (
        <div className="filter-dropdown card">
          <div className="filter-header">
            <h4>{t?.('categories') || 'Catégories'}</h4>
            {(selectedCategory || selectedSubcategory) && (
              <button className="ghost compact" onClick={clearFilter}>
                Effacer
              </button>
            )}
          </div>

          <div className="category-list">
            {categories.map(category => (
              <div key={category.key} className="category-item">
                <button
                  className={`category-button ${selectedCategory === category.key ? 'active' : ''}`}
                  onClick={() => handleCategoryClick(category.key)}
                >
                  <span className="badge">{category.key}</span>
                  <span className="category-count">
                    {media.filter(m => m.tags.some(t => t.startsWith(category.key))).length}
                  </span>
                </button>

                {selectedCategory === category.key && category.subcategories.length > 0 && (
                  <div className="subcategory-list">
                    {category.subcategories.map(sub => (
                      <button
                        key={sub.key}
                        className={`subcategory-button ${selectedSubcategory === sub.key ? 'active' : ''}`}
                        onClick={() => handleSubcategoryClick(sub.key)}
                      >
                        <span className="badge badge--outline">{sub.key}</span>
                        <span className="subcategory-count">
                          {media.filter(m => m.tags.some(t => t.startsWith(sub.key))).length}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}