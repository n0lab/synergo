import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import config from './config.js';
import { errorHandler } from './middleware/errorHandler.js';
import mediaRoutes from './routes/media.js';
import nomenclaturesRoutes from './routes/nomenclatures.js';
import listsRoutes from './routes/lists.js';
import uploadRoutes from './routes/upload.js';
import {
  getFullDatabase,
  importDatabase,
  resetDatabase
} from './db.js';
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// Helper to check if origin is a private/local IP address
const isPrivateOrigin = (origin) => {
  try {
    const url = new URL(origin);
    const hostname = url.hostname;
    // Check for localhost variants
    if (hostname === 'localhost' || hostname === '127.0.0.1') return true;
    // Check for private IP ranges (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
    const ipMatch = hostname.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
    if (ipMatch) {
      const [, a, b] = ipMatch.map(Number);
      if (a === 10) return true; // 10.0.0.0/8
      if (a === 192 && b === 168) return true; // 192.168.0.0/16
      if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
    }
    return false;
  } catch {
    return false;
  }
};

// Security: CORS with whitelist
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);

    // Allow configured origins
    if (config.cors.origins.includes(origin)) {
      return callback(null, true);
    }

    // In development, allow private/local IP addresses
    if (process.env.NODE_ENV !== 'production' && isPrivateOrigin(origin)) {
      return callback(null, true);
    }

    // In production, block unauthorized origins
    if (process.env.NODE_ENV === 'production') {
      console.warn(`CORS blocked request from: ${origin}`);
      return callback(new Error('CORS not allowed'), false);
    }

    // In development, warn but allow
    console.warn(`CORS blocked request from: ${origin}`);
    callback(null, true);
  },
  credentials: config.cors.credentials
}));

// Security: Request size limit
app.use(express.json({ limit: config.bodyLimit }));

// Security: Basic rate limiting (in-memory, use redis in production)
const requestCounts = new Map();
const rateLimitMiddleware = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  const windowStart = now - config.rateLimit.windowMs;

  // Clean old entries
  const requests = (requestCounts.get(ip) || []).filter(time => time > windowStart);

  if (requests.length >= config.rateLimit.max) {
    return res.status(429).json(config.rateLimit.message);
  }

  requests.push(now);
  requestCounts.set(ip, requests);
  next();
};
app.use('/api', rateLimitMiddleware);

// Security: Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('API-Version', config.apiVersion);
  next();
});

// Serve static files from public/resources
app.use('/resources', express.static(join(__dirname, '..', 'public', 'resources')));

// API Routes
app.use('/api/media', mediaRoutes);
app.use('/api/nomenclatures', nomenclaturesRoutes);
app.use('/api/lists', listsRoutes);
app.use('/api/upload', uploadRoutes);

// GET /api/database - Get full database (for initial load)
app.get('/api/database', (req, res, next) => {
  try {
    const db = getFullDatabase();
    res.json(db);
  } catch (error) {
    next(error);
  }
});

// POST /api/database/import - Import full database
app.post('/api/database/import', (req, res, next) => {
  try {
    const data = req.body;
    if (!data || !Array.isArray(data.media)) {
      return res.status(400).json({
        error: 'Invalid database format',
        code: 'VALIDATION_ERROR'
      });
    }
    const result = importDatabase(data);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// POST /api/database/reset - Reset database
app.post('/api/database/reset', (req, res, next) => {
  try {
    const result = resetDatabase();
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: Date.now(),
    version: config.apiVersion
  });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    code: 'NOT_FOUND'
  });
});

// Global error handler
app.use(errorHandler);

// Vite frontend (dist/)
app.use(express.static(path.join(__dirname, "..", "dist")));

// Fallback SPA
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "dist", "index.html"));
});

// Start server
app.listen(config.port, () => {
  console.log(`Synergo API server running on http://localhost:${config.port}`);
  console.log(`Database location: ${join(__dirname, 'data', 'synergo.db')}`);
  console.log(`API Version: ${config.apiVersion}`);
});
