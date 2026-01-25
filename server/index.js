import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import mediaRoutes from './routes/media.js';
import nomenclaturesRoutes from './routes/nomenclatures.js';
import listsRoutes from './routes/lists.js';
import {
  getFullDatabase,
  importDatabase,
  resetDatabase
} from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Serve static files from public/resources
app.use('/resources', express.static(join(__dirname, '..', 'public', 'resources')));

// API Routes
app.use('/api/media', mediaRoutes);
app.use('/api/nomenclatures', nomenclaturesRoutes);
app.use('/api/lists', listsRoutes);

// GET /api/database - Get full database (for initial load)
app.get('/api/database', (req, res) => {
  try {
    const db = getFullDatabase();
    res.json(db);
  } catch (error) {
    console.error('Error fetching database:', error);
    res.status(500).json({ error: 'Failed to fetch database' });
  }
});

// POST /api/database/import - Import full database
app.post('/api/database/import', (req, res) => {
  try {
    const data = req.body;
    if (!data || !Array.isArray(data.media)) {
      return res.status(400).json({ error: 'Invalid database format' });
    }
    const result = importDatabase(data);
    res.json(result);
  } catch (error) {
    console.error('Error importing database:', error);
    res.status(500).json({ error: 'Failed to import database' });
  }
});

// POST /api/database/reset - Reset database
app.post('/api/database/reset', (req, res) => {
  try {
    const result = resetDatabase();
    res.json(result);
  } catch (error) {
    console.error('Error resetting database:', error);
    res.status(500).json({ error: 'Failed to reset database' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// Start server
app.listen(PORT, () => {
  console.log(`Synergo API server running on http://localhost:${PORT}`);
  console.log(`Database location: ${join(__dirname, 'data', 'synergo.db')}`);
});
