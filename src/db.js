import { mediaLibrary } from './data.js';

const STORAGE_KEY = 'synergo-db';
const SUPABASE_TABLE = 'synergo_db';
const SUPABASE_ROW_ID = 'singleton';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

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
      // Preserve user edits while still applying new seeded fields by letting
      // the saved item override the seed when both share a property.
      map.set(item.id, { ...seedItem, ...item });
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

export function getSeedDatabase() {
  return buildSeed(mediaLibrary);
}

function isSupabaseConfigured() {
  return Boolean(supabaseUrl && supabaseKey);
}

function supabaseHeaders() {
  return {
    apikey: supabaseKey,
    Authorization: `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json',
  };
}

async function fetchRemotePayload() {
  if (!isSupabaseConfigured()) return null;

  const url = `${supabaseUrl}/rest/v1/${SUPABASE_TABLE}?id=eq.${SUPABASE_ROW_ID}&select=payload`;
  const response = await fetch(url, { headers: supabaseHeaders() });

  if (!response.ok) {
    throw new Error(`Supabase read failed: ${response.status}`);
  }

  const rows = await response.json();
  return rows?.[0]?.payload ?? null;
}

async function upsertRemotePayload(db) {
  if (!isSupabaseConfigured()) return;

  const url = `${supabaseUrl}/rest/v1/${SUPABASE_TABLE}?on_conflict=id`;
  const body = JSON.stringify({ id: SUPABASE_ROW_ID, payload: db, updated_at: new Date().toISOString() });
  const response = await fetch(url, {
    method: 'POST',
    headers: { ...supabaseHeaders(), Prefer: 'return=minimal' },
    body,
  });

  if (!response.ok) {
    throw new Error(`Supabase write failed: ${response.status}`);
  }
}

async function deleteRemotePayload() {
  if (!isSupabaseConfigured()) return;

  const url = `${supabaseUrl}/rest/v1/${SUPABASE_TABLE}?id=eq.${SUPABASE_ROW_ID}`;
  const response = await fetch(url, {
    method: 'DELETE',
    headers: { ...supabaseHeaders(), Prefer: 'return=minimal' },
  });

  if (!response.ok && response.status !== 404) {
    throw new Error(`Supabase delete failed: ${response.status}`);
  }
}

function mergeDatabase(seed, saved) {
  if (!saved) return seed;
  return {
    ...seed,
    ...saved,
    media: mergeById(seed.media, saved.media),
    nomenclatures: mergeById(seed.nomenclatures, saved.nomenclatures),
    reviewList: saved.reviewList ?? seed.reviewList,
    quizzList: saved.quizzList ?? seed.quizzList,
  };
}

export async function loadDatabase() {
  const seed = buildSeed(mediaLibrary);

  if (!isSupabaseConfigured()) {
    console.warn('Supabase environment variables manquants, fallback sur le seed en mémoire.');
    return seed;
  }

  try {
    const payload = await fetchRemotePayload();
    if (!payload) {
      await upsertRemotePayload(seed);
      return seed;
    }
    return mergeDatabase(seed, payload);
  } catch (error) {
    console.warn('Lecture Supabase échouée, fallback sur le seed.', error);
    return seed;
  }
}

export async function persistDatabase(db) {
  if (!isSupabaseConfigured()) return;
  try {
    await upsertRemotePayload(db);
  } catch (error) {
    console.warn('Écriture Supabase échouée, données non synchronisées.', error);
  }
}

export async function resetDatabase() {
  const seed = buildSeed(mediaLibrary);
  if (!isSupabaseConfigured()) return seed;

  try {
    await deleteRemotePayload();
    await upsertRemotePayload(seed);
    return seed;
  } catch (error) {
    console.warn('Réinitialisation Supabase échouée.', error);
    return seed;
  }
}

// Legacy local storage helpers remain for backward compatibility in case
// existing user agents rely on them outside React (not used anymore).
export function loadFromLocalStorage() {
  const seed = buildSeed(mediaLibrary);
  if (typeof localStorage === 'undefined') return seed;
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return seed;
  try {
    const parsed = JSON.parse(saved);
    return mergeDatabase(seed, parsed);
  } catch (error) {
    console.warn('Lecture locale invalide, utilisation du seed.', error);
    return seed;
  }
}
