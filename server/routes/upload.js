import { Router } from 'express';
import multer from 'multer';
import { fileURLToPath } from 'url';
import { dirname, join, extname } from 'path';
import { existsSync, mkdirSync, readdirSync } from 'fs';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = Router();

// Ensure resources directory exists
const resourcesDir = join(__dirname, '..', '..', 'public', 'resources');
if (!existsSync(resourcesDir)) {
  mkdirSync(resourcesDir, { recursive: true });
}

// Allowed file types
const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
const allowedTypes = [...allowedImageTypes, ...allowedVideoTypes];

// File filter to validate file types
const fileFilter = (req, file, cb) => {
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new ApiError(400, `File type not allowed: ${file.mimetype}`, 'INVALID_FILE_TYPE'), false);
  }
};

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, resourcesDir);
  },
  filename: (req, file, cb) => {
    // Use the filename from the request body if provided, otherwise generate one
    const providedFilename = req.body?.filename;
    if (providedFilename) {
      // Sanitize the provided filename
      const sanitized = sanitizeFilename(providedFilename);
      cb(null, sanitized);
    } else {
      // Generate a unique filename
      const ext = extname(file.originalname).toLowerCase();
      const baseName = file.originalname.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9-_]/g, '_');
      const uniqueSuffix = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      cb(null, `${baseName}_${uniqueSuffix}${ext}`);
    }
  }
});

// Sanitize filename to prevent path traversal and other issues
function sanitizeFilename(filename) {
  return filename
    .replace(/\.\./g, '')
    .replace(/[\/\\]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '_');
}

// Configure multer
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max
    files: 1
  }
});

// GET /api/upload/files - List all files in /public/resources/
router.get('/files', asyncHandler(async (req, res) => {
  try {
    const files = readdirSync(resourcesDir);
    // Filter out hidden files and directories
    const filteredFiles = files.filter(f => !f.startsWith('.'));
    res.json({ files: filteredFiles });
  } catch (error) {
    res.json({ files: [] });
  }
}));

// POST /api/upload - Upload a file to /public/resources/
router.post('/', upload.single('file'), asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, 'No file uploaded', 'NO_FILE');
  }

  res.status(201).json({
    success: true,
    filename: req.file.filename,
    originalName: req.file.originalname,
    size: req.file.size,
    mimetype: req.file.mimetype
  });
}));

// Error handling for multer errors
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'File too large. Maximum size is 100MB.',
        code: 'FILE_TOO_LARGE'
      });
    }
    return res.status(400).json({
      error: err.message,
      code: err.code
    });
  }
  next(err);
});

export default router;
