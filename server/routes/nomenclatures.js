import { Router } from 'express';
import {
  getAllNomenclatures,
  getNomenclatureById,
  createNomenclature,
  updateNomenclature,
  deleteNomenclature,
  upsertNomenclature
} from '../db.js';

const router = Router();

// GET /api/nomenclatures - Get all nomenclatures
router.get('/', (req, res) => {
  try {
    const nomenclatures = getAllNomenclatures();
    res.json(nomenclatures);
  } catch (error) {
    console.error('Error fetching nomenclatures:', error);
    res.status(500).json({ error: 'Failed to fetch nomenclatures' });
  }
});

// GET /api/nomenclatures/:id - Get single nomenclature
router.get('/:id', (req, res) => {
  try {
    const nomenclature = getNomenclatureById(req.params.id);
    if (!nomenclature) {
      return res.status(404).json({ error: 'Nomenclature not found' });
    }
    res.json(nomenclature);
  } catch (error) {
    console.error('Error fetching nomenclature:', error);
    res.status(500).json({ error: 'Failed to fetch nomenclature' });
  }
});

// POST /api/nomenclatures - Create new nomenclature
router.post('/', (req, res) => {
  try {
    const { label, description, interpretation } = req.body;

    if (!label) {
      return res.status(400).json({ error: 'Label is required' });
    }

    const nomenclature = createNomenclature({
      id: `user-${Date.now()}-${label}`,
      label,
      description: description || '',
      interpretation: interpretation || ''
    });

    res.status(201).json(nomenclature);
  } catch (error) {
    console.error('Error creating nomenclature:', error);
    res.status(500).json({ error: 'Failed to create nomenclature' });
  }
});

// POST /api/nomenclatures/sync - Upsert nomenclature (for auto-sync)
router.post('/sync', (req, res) => {
  try {
    const { id, label, description, interpretation } = req.body;

    if (!id || !label) {
      return res.status(400).json({ error: 'Id and label are required' });
    }

    const nomenclature = upsertNomenclature({
      id,
      label,
      description: description || '',
      interpretation: interpretation || ''
    });

    res.json(nomenclature);
  } catch (error) {
    console.error('Error syncing nomenclature:', error);
    res.status(500).json({ error: 'Failed to sync nomenclature' });
  }
});

// PUT /api/nomenclatures/:id - Update nomenclature
router.put('/:id', (req, res) => {
  try {
    const nomenclature = updateNomenclature(req.params.id, req.body);
    if (!nomenclature) {
      return res.status(404).json({ error: 'Nomenclature not found' });
    }
    res.json(nomenclature);
  } catch (error) {
    console.error('Error updating nomenclature:', error);
    res.status(500).json({ error: 'Failed to update nomenclature' });
  }
});

// DELETE /api/nomenclatures/:id - Delete nomenclature
router.delete('/:id', (req, res) => {
  try {
    const deleted = deleteNomenclature(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Nomenclature not found' });
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting nomenclature:', error);
    res.status(500).json({ error: 'Failed to delete nomenclature' });
  }
});

export default router;
