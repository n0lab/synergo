/**
 * Database utilities for Synergo
 * Path resolution and filename helpers (no localStorage - data is server-side)
 */

const RESOURCES_FOLDER = '/resources/';

/**
 * Builds the full path to a resource
 * @param {string} filename - File name
 * @returns {string} Full path
 */
export function getResourcePath(filename) {
  if (!filename) return '';

  // If it's already a full URL, return it as-is
  if (filename.startsWith('http://') || filename.startsWith('https://') || filename.startsWith('data:')) {
    return filename;
  }

  // Otherwise, build the path to the resources folder
  return `${RESOURCES_FOLDER}${filename}`;
}

/**
 * Extracts the filename from a path
 * @param {string} path - Path or URL
 * @returns {string} File name
 */
export function getFilenameFromPath(path) {
  if (!path) return '';

  // If it's a data URL or an external URL, return it as-is
  if (path.startsWith('data:') || path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  // Extract the filename
  return path.replace(RESOURCES_FOLDER, '');
}

/**
 * Generates a unique filename
 * @param {string} originalName - Original file name
 * @returns {string} Unique filename
 */
export function generateUniqueFilename(originalName) {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const extension = originalName.split('.').pop();
  const nameWithoutExt = originalName.replace(`.${extension}`, '').replace(/[^a-z0-9]/gi, '_');

  return `${nameWithoutExt}_${timestamp}_${random}.${extension}`;
}

/**
 * Derives nomenclatures from media tags and annotations
 * @param {Array} media - Media items
 * @returns {Array} Nomenclature entries
 */
export function deriveNomenclaturesFromMedia(media) {
  const collected = new Map();
  media.forEach((item) => {
    item.tags?.forEach((tag) => {
      if (!collected.has(tag)) {
        collected.set(tag, { id: `seed-${tag}`, label: tag, description: '', interpretation: '' });
      }
    });
    item.annotations?.forEach(({ label }) => {
      if (!collected.has(label)) {
        collected.set(label, { id: `seed-${label}`, label, description: '', interpretation: '' });
      }
    });
  });
  return Array.from(collected.values());
}
