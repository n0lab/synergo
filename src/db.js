import { mediaLibrary } from './data.js';

const STORAGE_KEY = 'synergo-db';
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

function applyAddedAt(media) {
  const now = Date.now();
  return media.map((item, index) => ({
    ...item,
    addedAt: typeof item.addedAt === 'number' ? item.addedAt : now - (media.length - index),
    updatedAt:
      typeof item.updatedAt === 'number'
        ? item.updatedAt
        : typeof item.addedAt === 'number'
          ? item.addedAt
          : now - (media.length - index),
  }));
}

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

function mergeById(seedList, savedList) {
  const map = new Map(seedList.map((item) => [item.id, item]));
  (savedList ?? []).forEach((item) => {
    const seedItem = map.get(item.id);
    if (seedItem) {
      map.set(item.id, { ...seedItem, ...item });
    } else {
      map.set(item.id, item);
    }
  });
  return Array.from(map.values());
}

function buildSeed(media) {
  const seededMedia = applyAddedAt(media);
  return {
    media: seededMedia,
    nomenclatures: deriveNomenclaturesFromMedia(seededMedia),
    reviewList: [],
    quizzList: [],
  };
}

export function loadDatabase() {
  const seed = buildSeed(mediaLibrary);
  if (typeof localStorage === 'undefined') return seed;
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
    return seed;
  }
  try {
    const parsed = JSON.parse(saved);
    const seededMedia = applyAddedAt(seed.media);
    const parsedMedia = applyAddedAt(parsed.media ?? []);

    return {
      ...seed,
      ...parsed,
      media: mergeById(seededMedia, parsedMedia),
      nomenclatures: mergeById(seed.nomenclatures, parsed.nomenclatures),
      reviewList: parsed.reviewList ?? seed.reviewList,
      quizzList: parsed.quizzList ?? seed.quizzList,
    };
  } catch (error) {
    console.warn('Resetting local database after invalid read', error);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
    return seed;
  }
}

export function persistDatabase(db) {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

export function resetDatabase() {
  if (typeof localStorage === 'undefined') return buildSeed(mediaLibrary);
  const seed = buildSeed(mediaLibrary);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
  return seed;
}
