// src/utils/search.js

/**
 * Fuzzy search with scoring
 * @param {Array} items - List of items to search
 * @param {string} query - Search term
 * @param {Object} options - Search options
 * @returns {Array} Items sorted by relevance
 */
export function fuzzySearch(items, query, options = {}) {
  const {
    keys = ['title', 'description', 'tags'],
    threshold = 0,
    includeScore = false
  } = options;

  if (!query || !query.trim()) {
    return items;
  }

  const needle = query.toLowerCase().trim();
  
  const scored = items.map(item => {
    let score = 0;
    const matches = {};

    keys.forEach(key => {
      if (key === 'tags' && Array.isArray(item.tags)) {
        const tagMatches = item.tags.filter(tag => 
          tag.toLowerCase().includes(needle)
        );
        if (tagMatches.length > 0) {
          score += tagMatches.length * 2;
          matches.tags = tagMatches;
        }
      } else if (typeof item[key] === 'string') {
        const value = item[key].toLowerCase();
        if (value.includes(needle)) {
          // Bonus if match at the beginning
          const bonus = value.startsWith(needle) ? 2 : 1;
          // Bonus based on match length
          const lengthBonus = needle.length / value.length;
          score += (key === 'title' ? 3 : 1) * bonus * (1 + lengthBonus);
          matches[key] = true;
        }
      }
    });

    return { item, score, matches };
  });

  const filtered = scored
    .filter(({ score }) => score > threshold)
    .sort((a, b) => b.score - a.score);

  if (includeScore) {
    return filtered;
  }

  return filtered.map(({ item }) => item);
}

/**
 * Parse a hierarchical tag
 * @param {string} tag - Tag in R_C_E_3_1 format
 * @returns {Object} Tag components
 */
export function parseTag(tag) {
  const parts = tag.split('_');
  
  return {
    raw: tag,
    category: parts[0] || '',
    subcategory: parts[1] || '',
    type: parts[2] || '',
    level: parts[3] || '',
    variant: parts[4] || '',
    isHierarchical: parts.length >= 3
  };
}

/**
 * Search by tag similarity
 * @param {string} tag - Reference tag
 * @param {Array} media - List of media
 * @param {number} maxResults - Maximum number of results
 * @returns {Array} Similar media
 */
export function findSimilarByTag(tag, media, maxResults = 5) {
  const parsed = parseTag(tag);
  
  const scored = media.map(item => {
    let score = 0;
    
    item.tags.forEach(itemTag => {
      const itemParsed = parseTag(itemTag);
      
      if (itemParsed.category === parsed.category) score += 1;
      if (itemParsed.subcategory === parsed.subcategory) score += 2;
      if (itemParsed.type === parsed.type) score += 3;
      if (itemTag === tag) score += 10;
    });
    
    return { item, score };
  });
  
  return scored
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults)
    .map(({ item }) => item);
}
