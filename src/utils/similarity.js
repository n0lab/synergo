// src/utils/similarity.js
// Utility functions for string similarity comparison

/**
 * Calculate Levenshtein distance between two strings
 * @param {string} a - First string
 * @param {string} b - Second string
 * @returns {number} - Edit distance
 */
export function levenshteinDistance(a, b) {
  const aLower = a.toLowerCase();
  const bLower = b.toLowerCase();

  if (aLower === bLower) return 0;
  if (aLower.length === 0) return bLower.length;
  if (bLower.length === 0) return aLower.length;

  const matrix = [];

  for (let i = 0; i <= bLower.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= aLower.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= bLower.length; i++) {
    for (let j = 1; j <= aLower.length; j++) {
      if (bLower.charAt(i - 1) === aLower.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[bLower.length][aLower.length];
}

/**
 * Calculate similarity score between two strings (0 to 1)
 * @param {string} a - First string
 * @param {string} b - Second string
 * @returns {number} - Similarity score (1 = identical, 0 = completely different)
 */
export function stringSimilarity(a, b) {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  const distance = levenshteinDistance(a, b);
  return 1 - distance / maxLen;
}

/**
 * Find common prefix length between two strings
 * @param {string} a - First string
 * @param {string} b - Second string
 * @returns {number} - Length of common prefix
 */
export function commonPrefixLength(a, b) {
  const aLower = a.toLowerCase();
  const bLower = b.toLowerCase();
  let i = 0;
  while (i < aLower.length && i < bLower.length && aLower[i] === bLower[i]) {
    i++;
  }
  return i;
}

/**
 * Check if strings share common words/tokens
 * @param {string} a - First string
 * @param {string} b - Second string
 * @returns {number} - Number of common tokens
 */
export function commonTokens(a, b) {
  const tokensA = new Set(a.toLowerCase().split(/[\s_\-]+/).filter(Boolean));
  const tokensB = new Set(b.toLowerCase().split(/[\s_\-]+/).filter(Boolean));
  let count = 0;
  for (const token of tokensA) {
    if (tokensB.has(token)) count++;
  }
  return count;
}

/**
 * Calculate a combined similarity score for nomenclatures
 * Takes into account: Levenshtein distance, common prefix, and common tokens
 * @param {string} a - First string
 * @param {string} b - Second string
 * @returns {number} - Combined similarity score (higher = more similar)
 */
export function nomenclatureSimilarity(a, b) {
  const similarity = stringSimilarity(a, b);
  const prefixBonus = commonPrefixLength(a, b) / Math.max(a.length, b.length, 1);
  const tokenBonus = commonTokens(a, b) * 0.2;

  return similarity + prefixBonus * 0.3 + tokenBonus;
}

/**
 * Find the most similar items from a list
 * @param {string} target - The target string to compare against
 * @param {string[]} candidates - List of candidate strings
 * @param {number} count - Number of results to return
 * @param {string[]} exclude - Strings to exclude from results
 * @returns {string[]} - Most similar strings sorted by similarity (descending)
 */
export function findSimilar(target, candidates, count = 3, exclude = []) {
  const excludeSet = new Set(exclude.map(e => e.toLowerCase()));

  const scored = candidates
    .filter(c => !excludeSet.has(c.toLowerCase()))
    .map(candidate => ({
      value: candidate,
      score: nomenclatureSimilarity(target, candidate)
    }))
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, count).map(s => s.value);
}

/**
 * Find similar nomenclatures for multiple targets
 * Useful for Type 1 questions where we need distractors similar to multiple correct answers
 * @param {string[]} targets - Target strings to compare against
 * @param {string[]} candidates - List of candidate strings
 * @param {number} count - Number of results to return
 * @returns {string[]} - Most similar strings considering all targets
 */
export function findSimilarToMultiple(targets, candidates, count = 3) {
  const excludeSet = new Set(targets.map(t => t.toLowerCase()));

  const scored = candidates
    .filter(c => !excludeSet.has(c.toLowerCase()))
    .map(candidate => {
      // Calculate average similarity to all targets
      const avgSimilarity = targets.reduce((sum, target) => {
        return sum + nomenclatureSimilarity(target, candidate);
      }, 0) / targets.length;

      return {
        value: candidate,
        score: avgSimilarity
      };
    })
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, count).map(s => s.value);
}
