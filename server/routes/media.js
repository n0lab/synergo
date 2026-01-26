import { Router } from 'express';
import {
  getAllMedia,
  getMediaById,
  createMedia,
  updateMedia,
  deleteMedia,
  getMediaPaginated,
  getNextResourceNumber
} from '../db.js';
import { ApiError, asyncHandler } from '../middleware/errorHandler.js';
import { validateMedia, validateIdParam } from '../middleware/validate.js';

const router = Router();

// GET /api/media/next-id - Get next available resource ID for a given date and source
router.get('/next-id', asyncHandler(async (req, res) => {
  const { datePrefix, sourcePrefix } = req.query;

  if (!datePrefix || !sourcePrefix) {
    throw ApiError.badRequest('datePrefix and sourcePrefix are required');
  }

  const nextNumber = getNextResourceNumber(datePrefix, sourcePrefix);
  res.json({ nextNumber });
}));

// GET /api/media - Get all media (with optional pagination)
router.get('/', asyncHandler(async (req, res) => {
  const { limit, offset } = req.query;

  // If pagination params provided, use paginated query
  if (limit !== undefined || offset !== undefined) {
    const parsedLimit = Math.min(parseInt(limit) || 50, 1000);
    const parsedOffset = parseInt(offset) || 0;
    const result = getMediaPaginated(parsedLimit, parsedOffset);
    res.json(result);
  } else {
    const media = getAllMedia();
    res.json(media);
  }
}));

// GET /api/media/:id - Get single media
router.get('/:id', validateIdParam, asyncHandler(async (req, res) => {
  const media = getMediaById(req.params.id);
  if (!media) {
    throw ApiError.notFound('Media not found');
  }
  res.json(media);
}));

// POST /api/media - Create new media
router.post('/', validateMedia, asyncHandler(async (req, res) => {
  const { title, description, src, type, tags, annotations, fps, source, publicationDate } = req.body;

  const timestamp = Date.now();
  const media = createMedia({
    id: `user-media-${timestamp}`,
    title,
    description: description || '',
    src,
    type,
    tags: tags || [],
    annotations: annotations || [],
    fps: fps || 30,
    addedAt: timestamp,
    updatedAt: timestamp,
    source: source || '',
    publicationDate: publicationDate || ''
  });

  res.status(201).json(media);
}));

// PUT /api/media/:id - Update media
router.put('/:id', validateIdParam, validateMedia, asyncHandler(async (req, res) => {
  const media = updateMedia(req.params.id, req.body);
  if (!media) {
    throw ApiError.notFound('Media not found');
  }
  res.json(media);
}));

// DELETE /api/media/:id - Delete media
router.delete('/:id', validateIdParam, asyncHandler(async (req, res) => {
  const deleted = deleteMedia(req.params.id);
  if (!deleted) {
    throw ApiError.notFound('Media not found');
  }
  res.json({ success: true });
}));

export default router;
