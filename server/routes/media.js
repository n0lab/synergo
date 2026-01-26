import { Router } from 'express';
import {
  getAllMedia,
  getMediaById,
  createMedia,
  updateMedia,
  deleteMedia
} from '../db.js';

const router = Router();

// GET /api/media - Get all media
router.get('/', (req, res) => {
  try {
    const media = getAllMedia();
    res.json(media);
  } catch (error) {
    console.error('Error fetching media:', error);
    res.status(500).json({ error: 'Failed to fetch media' });
  }
});

// GET /api/media/:id - Get single media
router.get('/:id', (req, res) => {
  try {
    const media = getMediaById(req.params.id);
    if (!media) {
      return res.status(404).json({ error: 'Media not found' });
    }
    res.json(media);
  } catch (error) {
    console.error('Error fetching media:', error);
    res.status(500).json({ error: 'Failed to fetch media' });
  }
});

// POST /api/media - Create new media
router.post('/', (req, res) => {
  try {
    const { title, description, src, type, tags, annotations, fps } = req.body;

    if (!title || !src || !type) {
      return res.status(400).json({ error: 'Title, src and type are required' });
    }

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
      updatedAt: timestamp
    });

    res.status(201).json(media);
  } catch (error) {
    console.error('Error creating media:', error);
    res.status(500).json({ error: 'Failed to create media' });
  }
});

// PUT /api/media/:id - Update media
router.put('/:id', (req, res) => {
  try {
    const media = updateMedia(req.params.id, req.body);
    if (!media) {
      return res.status(404).json({ error: 'Media not found' });
    }
    res.json(media);
  } catch (error) {
    console.error('Error updating media:', error);
    res.status(500).json({ error: 'Failed to update media' });
  }
});

// DELETE /api/media/:id - Delete media
router.delete('/:id', (req, res) => {
  try {
    const deleted = deleteMedia(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Media not found' });
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting media:', error);
    res.status(500).json({ error: 'Failed to delete media' });
  }
});

export default router;
