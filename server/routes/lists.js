import { Router } from 'express';
import {
  getReviewList,
  addToReviewList,
  removeFromReviewList,
  clearReviewList,
  getQuizList,
  addToQuizList,
  removeFromQuizList,
  clearQuizList
} from '../db.js';

const router = Router();

// ============ REVIEW LIST ============

// GET /api/lists/review - Get review list
router.get('/review', (req, res) => {
  try {
    const list = getReviewList();
    res.json(list);
  } catch (error) {
    console.error('Error fetching review list:', error);
    res.status(500).json({ error: 'Failed to fetch review list' });
  }
});

// POST /api/lists/review - Add to review list
router.post('/review', (req, res) => {
  try {
    const { mediaId } = req.body;
    if (!mediaId) {
      return res.status(400).json({ error: 'mediaId is required' });
    }
    addToReviewList(mediaId);
    res.json({ success: true });
  } catch (error) {
    console.error('Error adding to review list:', error);
    res.status(500).json({ error: 'Failed to add to review list' });
  }
});

// POST /api/lists/review/bulk - Add multiple items to review list
router.post('/review/bulk', (req, res) => {
  try {
    const { mediaIds } = req.body;
    if (!Array.isArray(mediaIds)) {
      return res.status(400).json({ error: 'mediaIds array is required' });
    }
    for (const mediaId of mediaIds) {
      addToReviewList(mediaId);
    }
    res.json({ success: true, count: mediaIds.length });
  } catch (error) {
    console.error('Error adding to review list:', error);
    res.status(500).json({ error: 'Failed to add to review list' });
  }
});

// DELETE /api/lists/review/:mediaId - Remove from review list
router.delete('/review/:mediaId', (req, res) => {
  try {
    removeFromReviewList(req.params.mediaId);
    res.json({ success: true });
  } catch (error) {
    console.error('Error removing from review list:', error);
    res.status(500).json({ error: 'Failed to remove from review list' });
  }
});

// DELETE /api/lists/review - Clear review list
router.delete('/review', (req, res) => {
  try {
    clearReviewList();
    res.json({ success: true });
  } catch (error) {
    console.error('Error clearing review list:', error);
    res.status(500).json({ error: 'Failed to clear review list' });
  }
});

// ============ QUIZ LIST ============

// GET /api/lists/quiz - Get quiz list
router.get('/quiz', (req, res) => {
  try {
    const list = getQuizList();
    res.json(list);
  } catch (error) {
    console.error('Error fetching quiz list:', error);
    res.status(500).json({ error: 'Failed to fetch quiz list' });
  }
});

// POST /api/lists/quiz - Add to quiz list
router.post('/quiz', (req, res) => {
  try {
    const { mediaId } = req.body;
    if (!mediaId) {
      return res.status(400).json({ error: 'mediaId is required' });
    }
    addToQuizList(mediaId);
    res.json({ success: true });
  } catch (error) {
    console.error('Error adding to quiz list:', error);
    res.status(500).json({ error: 'Failed to add to quiz list' });
  }
});

// POST /api/lists/quiz/bulk - Add multiple items to quiz list
router.post('/quiz/bulk', (req, res) => {
  try {
    const { mediaIds } = req.body;
    if (!Array.isArray(mediaIds)) {
      return res.status(400).json({ error: 'mediaIds array is required' });
    }
    for (const mediaId of mediaIds) {
      addToQuizList(mediaId);
    }
    res.json({ success: true, count: mediaIds.length });
  } catch (error) {
    console.error('Error adding to quiz list:', error);
    res.status(500).json({ error: 'Failed to add to quiz list' });
  }
});

// DELETE /api/lists/quiz/:mediaId - Remove from quiz list
router.delete('/quiz/:mediaId', (req, res) => {
  try {
    removeFromQuizList(req.params.mediaId);
    res.json({ success: true });
  } catch (error) {
    console.error('Error removing from quiz list:', error);
    res.status(500).json({ error: 'Failed to remove from quiz list' });
  }
});

// DELETE /api/lists/quiz - Clear quiz list
router.delete('/quiz', (req, res) => {
  try {
    clearQuizList();
    res.json({ success: true });
  } catch (error) {
    console.error('Error clearing quiz list:', error);
    res.status(500).json({ error: 'Failed to clear quiz list' });
  }
});

export default router;
