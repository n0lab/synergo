// src/utils/search.js

/**
 * Recherche fuzzy avec scoring
 * @param {Array} items - Liste des éléments à rechercher
 * @param {string} query - Terme de recherche
 * @param {Object} options - Options de recherche
 * @returns {Array} Items triés par pertinence
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
          // Bonus si match au début
          const bonus = value.startsWith(needle) ? 2 : 1;
          // Bonus selon la longueur du match
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
 * Parse un tag hiérarchique
 * @param {string} tag - Tag au format R_C_E_3_1
 * @returns {Object} Composants du tag
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
 * Filtre par catégorie hiérarchique
 * @param {Array} media - Liste des médias
 * @param {string} categoryPrefix - Préfixe de catégorie (ex: "R_C")
 * @returns {Array} Médias filtrés
 */
export function filterByCategory(media, categoryPrefix) {
  if (!categoryPrefix) return media;
  
  return media.filter(item =>
    item.tags.some(tag => tag.startsWith(categoryPrefix))
  );
}

/**
 * Extrait toutes les catégories uniques
 * @param {Array} media - Liste des médias
 * @returns {Object} Hiérarchie des catégories
 */
export function extractCategories(media) {
  const categories = new Map();

  media.forEach(item => {
    item.tags.forEach(tag => {
      const parsed = parseTag(tag);
      if (!parsed.isHierarchical) return;

      const catKey = parsed.category;
      if (!categories.has(catKey)) {
        categories.set(catKey, {
          key: catKey,
          subcategories: new Map()
        });
      }

      const cat = categories.get(catKey);
      const subKey = `${parsed.category}_${parsed.subcategory}`;
      
      if (parsed.subcategory && !cat.subcategories.has(subKey)) {
        cat.subcategories.set(subKey, {
          key: subKey,
          types: new Set()
        });
      }

      if (parsed.type && cat.subcategories.has(subKey)) {
        cat.subcategories.get(subKey).types.add(parsed.type);
      }
    });
  });

  // Convertir en structure utilisable
  return Array.from(categories.values()).map(cat => ({
    key: cat.key,
    subcategories: Array.from(cat.subcategories.values()).map(sub => ({
      key: sub.key,
      types: Array.from(sub.types)
    }))
  }));
}

/**
 * Recherche par similarité de tags
 * @param {string} tag - Tag de référence
 * @param {Array} media - Liste des médias
 * @param {number} maxResults - Nombre max de résultats
 * @returns {Array} Médias similaires
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