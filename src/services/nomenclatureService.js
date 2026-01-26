/**
 * Nomenclature Service Layer
 * Provides a clean abstraction over the API for nomenclature operations
 */

import * as api from '../api.js';

/**
 * Get all nomenclatures
 */
export async function getAll() {
  return api.getAllNomenclatures();
}

/**
 * Create a new nomenclature
 */
export async function create(nomenclature) {
  return api.createNomenclature(nomenclature);
}

/**
 * Sync a nomenclature (upsert)
 */
export async function sync(nomenclature) {
  return api.syncNomenclature(nomenclature);
}

/**
 * Update a nomenclature
 */
export async function update(id, updates) {
  return api.updateNomenclature(id, updates);
}

/**
 * Delete a nomenclature
 */
export async function remove(id) {
  return api.deleteNomenclature(id);
}

/**
 * Sync nomenclatures from media tags/annotations
 * Automatically creates nomenclatures for new tags
 */
export async function syncFromMedia(media) {
  const tags = new Set();

  // Collect all tags
  media.tags?.forEach(tag => tags.add(tag));
  media.annotations?.forEach(ann => tags.add(ann.label));

  // Sync each unique tag
  const syncPromises = [];
  for (const label of tags) {
    syncPromises.push(
      sync({
        id: `seed-${label}`,
        label,
        description: '',
        interpretation: ''
      }).catch(() => {
        // Ignore sync errors - nomenclature may already exist
      })
    );
  }

  await Promise.all(syncPromises);
}

export default {
  getAll,
  create,
  sync,
  update,
  remove,
  syncFromMedia
};
