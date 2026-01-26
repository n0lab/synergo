import { Router } from 'express';
import {
  getReviewList,
  addToReviewList,
  removeFromReviewList,
  clearReviewList,
  getQuizList,
  addToQuizList,
  removeFromQuizList,
  clearQuizList,
  getMediaById
} from '../db.js';
import { ApiError, asyncHandler } from '../middleware/errorHandler.js';
import { validateListOperation, validateIdParam } from '../middleware/validate.js';

const router = Router();

// ============ REVIEW LIST ============

// GET /api/lists/review - Get review list
router.get('/review', asyncHandler(async (req, res) => {
  const list = getReviewList();
  res.json(list);
}));

// POST /api/lists/review - Add to review list
router.post('/review', validateListOperation, asyncHandler(async (req, res) => {
  const { mediaId } = req.body;

  // Verify media exists
  const media = getMediaById(mediaId);
  if (!media) {
    throw ApiError.notFound('Media not found');
  }

  addToReviewList(mediaId);
  res.json({ success: true });
}));

// POST /api/lists/review/bulk - Add multiple items to review list
router.post('/review/bulk', validateListOperation, asyncHandler(async (req, res) => {
  const { mediaIds } = req.body;
  let addedCount = 0;

  for (const mediaId of mediaIds) {
    const media = getMediaById(mediaId);
    if (media) {
      addToReviewList(mediaId);
      addedCount++;
    }
  }

  res.json({ success: true, count: addedCount });
}));

// DELETE /api/lists/review/:mediaId - Remove from review list
router.delete('/review/:mediaId', validateIdParam, asyncHandler(async (req, res) => {
  removeFromReviewList(req.params.mediaId);
  res.json({ success: true });
}));

// DELETE /api/lists/review - Clear review list
router.delete('/review', asyncHandler(async (req, res) => {
  clearReviewList();
  res.json({ success: true });
}));

// ============ QUIZ LIST ============

// GET /api/lists/quiz - Get quiz list
router.get('/quiz', asyncHandler(async (req, res) => {
  const list = getQuizList();
  res.json(list);
}));

// POST /api/lists/quiz - Add to quiz list
router.post('/quiz', validateListOperation, asyncHandler(async (req, res) => {
  const { mediaId } = req.body;

  // Verify media exists
  const media = getMediaById(mediaId);
  if (!media) {
    throw ApiError.notFound('Media not found');
  }

  addToQuizList(mediaId);
  res.json({ success: true });
}));

// POST /api/lists/quiz/bulk - Add multiple items to quiz list
router.post('/quiz/bulk', validateListOperation, asyncHandler(async (req, res) => {
  const { mediaIds } = req.body;
  let addedCount = 0;

  for (const mediaId of mediaIds) {
    const media = getMediaById(mediaId);
    if (media) {
      addToQuizList(mediaId);
      addedCount++;
    }
  }

  res.json({ success: true, count: addedCount });
}));

// DELETE /api/lists/quiz/:mediaId - Remove from quiz list
router.delete('/quiz/:mediaId', validateIdParam, asyncHandler(async (req, res) => {
  removeFromQuizList(req.params.mediaId);
  res.json({ success: true });
}));

// DELETE /api/lists/quiz - Clear quiz list
router.delete('/quiz', asyncHandler(async (req, res) => {
  clearQuizList();
  res.json({ success: true });
}));

export default router;
