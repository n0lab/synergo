import { Router } from 'express';
import {
  getAllNomenclatures,
  getNomenclatureById,
  createNomenclature,
  updateNomenclature,
  deleteNomenclature,
  upsertNomenclature
} from '../db.js';
import { ApiError, asyncHandler } from '../middleware/errorHandler.js';
import { validateNomenclature, validateIdParam } from '../middleware/validate.js';

const router = Router();

// GET /api/nomenclatures - Get all nomenclatures
router.get('/', asyncHandler(async (req, res) => {
  const nomenclatures = getAllNomenclatures();
  // Add cache header for nomenclatures (they don't change often)
  res.set('Cache-Control', 'private, max-age=60');
  res.json(nomenclatures);
}));

// GET /api/nomenclatures/:id - Get single nomenclature
router.get('/:id', validateIdParam, asyncHandler(async (req, res) => {
  const nomenclature = getNomenclatureById(req.params.id);
  if (!nomenclature) {
    throw ApiError.notFound('Nomenclature not found');
  }
  res.json(nomenclature);
}));

// POST /api/nomenclatures - Create new nomenclature
router.post('/', validateNomenclature, asyncHandler(async (req, res) => {
  const { label, description, interpretation } = req.body;

  const nomenclature = createNomenclature({
    id: `user-${Date.now()}-${label}`,
    label,
    description: description || '',
    interpretation: interpretation || ''
  });

  res.status(201).json(nomenclature);
}));

// POST /api/nomenclatures/sync - Upsert nomenclature (for auto-sync)
router.post('/sync', validateNomenclature, asyncHandler(async (req, res) => {
  const { id, label, description, interpretation } = req.body;

  const nomenclature = upsertNomenclature({
    id,
    label,
    description: description || '',
    interpretation: interpretation || ''
  });

  res.json(nomenclature);
}));

// PUT /api/nomenclatures/:id - Update nomenclature
router.put('/:id', validateIdParam, validateNomenclature, asyncHandler(async (req, res) => {
  const nomenclature = updateNomenclature(req.params.id, req.body);
  if (!nomenclature) {
    throw ApiError.notFound('Nomenclature not found');
  }
  res.json(nomenclature);
}));

// DELETE /api/nomenclatures/:id - Delete nomenclature
router.delete('/:id', validateIdParam, asyncHandler(async (req, res) => {
  const deleted = deleteNomenclature(req.params.id);
  if (!deleted) {
    throw ApiError.notFound('Nomenclature not found');
  }
  res.json({ success: true });
}));

export default router;
