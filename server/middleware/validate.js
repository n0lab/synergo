/**
 * Input validation middleware
 */

import { ApiError } from './errorHandler.js';
import config from '../config.js';

// Sanitize string input
function sanitizeString(str) {
  if (typeof str !== 'string') return str;
  return str.trim();
}

// Sanitize filename to prevent path traversal
export function sanitizeFilename(filename) {
  if (typeof filename !== 'string') return filename;
  // Remove path traversal characters and dangerous patterns
  return filename
    .replace(/\.\./g, '')
    .replace(/[\/\\]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '_');
}

// Validate media creation/update payload
export function validateMedia(req, res, next) {
  const { title, src, type, tags, annotations, fps, source, publicationDate } = req.body;

  // Required fields for creation
  if (req.method === 'POST') {
    if (!title || typeof title !== 'string' || !title.trim()) {
      throw ApiError.badRequest('Title is required');
    }
    if (!src || typeof src !== 'string' || !src.trim()) {
      throw ApiError.badRequest('Source (src) is required');
    }
    if (!type || !config.mediaTypes.includes(type)) {
      throw ApiError.badRequest(`Type must be one of: ${config.mediaTypes.join(', ')}`);
    }
  }

  // Validate type if provided
  if (type !== undefined && !config.mediaTypes.includes(type)) {
    throw ApiError.badRequest(`Type must be one of: ${config.mediaTypes.join(', ')}`);
  }

  // Validate tags if provided
  if (tags !== undefined) {
    if (!Array.isArray(tags)) {
      throw ApiError.badRequest('Tags must be an array');
    }
    if (!tags.every(tag => typeof tag === 'string')) {
      throw ApiError.badRequest('All tags must be strings');
    }
  }

  // Validate annotations if provided
  if (annotations !== undefined) {
    if (!Array.isArray(annotations)) {
      throw ApiError.badRequest('Annotations must be an array');
    }
    for (const ann of annotations) {
      if (typeof ann !== 'object' || ann === null) {
        throw ApiError.badRequest('Each annotation must be an object');
      }
      if (typeof ann.label !== 'string') {
        throw ApiError.badRequest('Annotation label must be a string');
      }
      if (ann.time !== undefined && typeof ann.time !== 'number') {
        throw ApiError.badRequest('Annotation time must be a number');
      }
    }
  }

  // Validate fps if provided
  if (fps !== undefined && (typeof fps !== 'number' || fps <= 0)) {
    throw ApiError.badRequest('FPS must be a positive number');
  }

  // Validate source if provided (must be a string)
  if (source !== undefined && typeof source !== 'string') {
    throw ApiError.badRequest('Source must be a string');
  }

  // Validate publicationDate if provided (must be a string in ISO format or empty)
  if (publicationDate !== undefined && typeof publicationDate !== 'string') {
    throw ApiError.badRequest('Publication date must be a string');
  }

  // Sanitize src filename if provided
  if (req.body.src && !req.body.src.startsWith('http')) {
    req.body.src = sanitizeFilename(req.body.src);
  }

  // Sanitize strings
  if (req.body.title) req.body.title = sanitizeString(req.body.title);
  if (req.body.description) req.body.description = sanitizeString(req.body.description);
  if (req.body.source) req.body.source = sanitizeString(req.body.source);

  next();
}

// Validate nomenclature payload
export function validateNomenclature(req, res, next) {
  const { label, description, interpretation, id } = req.body;

  // Required fields for creation
  if (req.method === 'POST' && req.path !== '/sync') {
    if (!label || typeof label !== 'string' || !label.trim()) {
      throw ApiError.badRequest('Label is required');
    }
  }

  // For sync endpoint, both id and label are required
  if (req.path === '/sync') {
    if (!id || typeof id !== 'string') {
      throw ApiError.badRequest('ID is required for sync');
    }
    if (!label || typeof label !== 'string' || !label.trim()) {
      throw ApiError.badRequest('Label is required for sync');
    }
  }

  // Sanitize strings
  if (req.body.label) req.body.label = sanitizeString(req.body.label);
  if (req.body.description) req.body.description = sanitizeString(req.body.description);
  if (req.body.interpretation) req.body.interpretation = sanitizeString(req.body.interpretation);

  next();
}

// Validate list operations
export function validateListOperation(req, res, next) {
  const { mediaId, mediaIds } = req.body;

  // Single mediaId validation
  if (req.method === 'POST' && !req.path.includes('/bulk')) {
    if (!mediaId || typeof mediaId !== 'string') {
      throw ApiError.badRequest('mediaId is required');
    }
  }

  // Bulk operation validation
  if (req.path.includes('/bulk')) {
    if (!Array.isArray(mediaIds)) {
      throw ApiError.badRequest('mediaIds must be an array');
    }
    if (mediaIds.length === 0) {
      throw ApiError.badRequest('mediaIds array cannot be empty');
    }
    if (!mediaIds.every(id => typeof id === 'string')) {
      throw ApiError.badRequest('All mediaIds must be strings');
    }
    // Limit bulk operations
    if (mediaIds.length > 100) {
      throw ApiError.badRequest('Cannot process more than 100 items at once');
    }
  }

  next();
}

// Validate ID parameter
export function validateIdParam(req, res, next) {
  const { id, mediaId } = req.params;
  const paramId = id || mediaId;

  if (!paramId || typeof paramId !== 'string') {
    throw ApiError.badRequest('Invalid ID parameter');
  }

  next();
}

export default {
  validateMedia,
  validateNomenclature,
  validateListOperation,
  validateIdParam,
  sanitizeFilename
};
