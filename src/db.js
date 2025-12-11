import { mediaLibrary } from './data.js';

const STORAGE_KEY = 'synergo-db';

function deriveNomenclaturesFromMedia(media) {
  const collected = new Map();
  media.forEach((item) => {
    item.tags?.forEach((tag) => {
      if (!collected.has(tag)) {
        collected.set(tag, { id: `seed-${tag}`, label: tag, description: '' });
      }
    });
    item.annotations?.forEach(({ label }) => {
      if (!collected.has(label)) {
        collected.set(label, { id: `seed-${label}`, label, description: '' });
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
      map.set(item.id, { ...item, ...seedItem });
    } else {
      map.set(item.id, item);
    }
  });
  return Array.from(map.values());
}

function buildSeed(media) {
  return {
    media,
    nomenclatures: deriveNomenclaturesFromMedia(media),
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
    return {
      ...seed,
      ...parsed,
      media: mergeById(seed.media, parsed.media),
      nomenclatures: mergeById(seed.nomenclatures, parsed.nomenclatures),
      reviewList: parsed.reviewList ?? seed.reviewList,
      quizzList: parsed.quizzList ?? seed.quizzList,
    };
  } catch (error) {
    console.warn('Réinitialisation de la base locale après lecture invalide', error);
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
