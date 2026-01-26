/**
 * Media Service Layer
 * Provides a clean abstraction over the API for media operations
 */

import * as api from '../api.js';

/**
 * Cache for optimistic updates
 */
let mediaCache = new Map();

/**
 * Get all media
 */
export async function getAll() {
  const data = await api.loadDatabase();
  // Update cache
  data.media.forEach(m => mediaCache.set(m.id, m));
  return data;
}

/**
 * Get media by ID
 */
export async function getById(id) {
  // Check cache first
  if (mediaCache.has(id)) {
    return mediaCache.get(id);
  }
  const media = await api.getMediaById(id);
  if (media) {
    mediaCache.set(id, media);
  }
  return media;
}

/**
 * Create new media
 */
export async function create(mediaData) {
  const media = await api.createMedia(mediaData);
  mediaCache.set(media.id, media);
  return media;
}

/**
 * Update media with optimistic update support
 * @param {string} id - Media ID
 * @param {object} updates - Fields to update
 * @param {function} onOptimisticUpdate - Called immediately with optimistic state
 * @param {function} onError - Called if API fails
 */
export async function update(id, updates, { onOptimisticUpdate, onError } = {}) {
  // Get current state for rollback
  const previousState = mediaCache.get(id);

  // Apply optimistic update
  if (previousState && onOptimisticUpdate) {
    const optimisticState = { ...previousState, ...updates };
    mediaCache.set(id, optimisticState);
    onOptimisticUpdate(optimisticState);
  }

  try {
    const media = await api.updateMedia(id, updates);
    mediaCache.set(id, media);
    return media;
  } catch (error) {
    // Rollback on error
    if (previousState) {
      mediaCache.set(id, previousState);
    }
    if (onError) {
      onError(error, previousState);
    }
    throw error;
  }
}

/**
 * Delete media
 */
export async function remove(id) {
  await api.deleteMedia(id);
  mediaCache.delete(id);
  return true;
}

/**
 * Clear the media cache
 */
export function clearCache() {
  mediaCache.clear();
}

/**
 * Add media to review list
 */
export async function addToReview(mediaId) {
  return api.addToReviewList(mediaId);
}

/**
 * Add media to quiz list
 */
export async function addToQuiz(mediaId) {
  return api.addToQuizList(mediaId);
}

/**
 * Add multiple media to review list
 */
export async function addManyToReview(mediaIds) {
  return api.addManyToReviewList(mediaIds);
}

/**
 * Add multiple media to quiz list
 */
export async function addManyToQuiz(mediaIds) {
  return api.addManyToQuizList(mediaIds);
}

/**
 * Remove from review list
 */
export async function removeFromReview(mediaId) {
  return api.removeFromReviewList(mediaId);
}

/**
 * Remove from quiz list
 */
export async function removeFromQuiz(mediaId) {
  return api.removeFromQuizList(mediaId);
}

export default {
  getAll,
  getById,
  create,
  update,
  remove,
  clearCache,
  addToReview,
  addToQuiz,
  addManyToReview,
  addManyToQuiz,
  removeFromReview,
  removeFromQuiz
};
