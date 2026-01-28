import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, 'data', 'synergo.db');
const db = new Database(dbPath);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');

/**
 * Safe JSON parse with fallback
 * Prevents crashes from corrupted JSON data
 */
function safeJsonParse(str, fallback = []) {
  if (!str) return fallback;
  try {
    return JSON.parse(str);
  } catch (e) {
    console.error('JSON parse error:', e.message, 'Input:', str?.substring(0, 100));
    return fallback;
  }
}

/**
 * Parse media row from database
 */
function parseMediaRow(row) {
  if (!row) return null;
  return {
    ...row,
    tags: safeJsonParse(row.tags, []),
    annotations: safeJsonParse(row.annotations, []),
    source: row.source || '',
    publicationDate: row.publication_date || row.publicationDate || ''
  };
}

/**
 * Initialize the database schema using migrations
 */
export function initDatabase() {
  // Import and run migrations
  import('./migrations/index.js').then(({ runMigrations }) => {
    try {
      runMigrations(db);
    } catch (error) {
      console.error('Migration failed, falling back to basic init:', error.message);
      // Fallback to basic schema creation
      db.exec(`
        CREATE TABLE IF NOT EXISTS media (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT DEFAULT '',
          src TEXT NOT NULL,
          type TEXT CHECK(type IN ('video', 'photo')) NOT NULL,
          tags TEXT DEFAULT '[]',
          annotations TEXT DEFAULT '[]',
          fps INTEGER DEFAULT 30,
          added_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS nomenclatures (
          id TEXT PRIMARY KEY,
          label TEXT NOT NULL,
          description TEXT DEFAULT '',
          interpretation TEXT DEFAULT ''
        );

        CREATE TABLE IF NOT EXISTS review_list (
          media_id TEXT PRIMARY KEY,
          added_at INTEGER NOT NULL,
          FOREIGN KEY (media_id) REFERENCES media(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS quiz_list (
          media_id TEXT PRIMARY KEY,
          added_at INTEGER NOT NULL,
          FOREIGN KEY (media_id) REFERENCES media(id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_media_type ON media(type);
        CREATE INDEX IF NOT EXISTS idx_media_added_at ON media(added_at);
        CREATE INDEX IF NOT EXISTS idx_nomenclatures_label ON nomenclatures(label);
      `);
    }
  }).catch((error) => {
    // If migrations module fails to load, use inline schema
    console.error('Could not load migrations module:', error.message);
    db.exec(`
      CREATE TABLE IF NOT EXISTS media (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT DEFAULT '',
        src TEXT NOT NULL,
        type TEXT CHECK(type IN ('video', 'photo')) NOT NULL,
        tags TEXT DEFAULT '[]',
        annotations TEXT DEFAULT '[]',
        fps INTEGER DEFAULT 30,
        added_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS nomenclatures (
        id TEXT PRIMARY KEY,
        label TEXT NOT NULL,
        description TEXT DEFAULT '',
        interpretation TEXT DEFAULT ''
      );

      CREATE TABLE IF NOT EXISTS review_list (
        media_id TEXT PRIMARY KEY,
        added_at INTEGER NOT NULL,
        FOREIGN KEY (media_id) REFERENCES media(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS quiz_list (
        media_id TEXT PRIMARY KEY,
        added_at INTEGER NOT NULL,
        FOREIGN KEY (media_id) REFERENCES media(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_media_type ON media(type);
      CREATE INDEX IF NOT EXISTS idx_media_added_at ON media(added_at);
      CREATE INDEX IF NOT EXISTS idx_nomenclatures_label ON nomenclatures(label);
    `);
  });
}

// ============ MEDIA OPERATIONS ============

export function getAllMedia() {
  const stmt = db.prepare(`
    SELECT id, title, description, src, type, tags, annotations, fps,
           added_at as addedAt, updated_at as updatedAt,
           source, publication_date as publicationDate
    FROM media
    ORDER BY updated_at DESC
  `);
  return stmt.all().map(parseMediaRow);
}

/**
 * Get media with pagination support
 */
export function getMediaPaginated(limit = 50, offset = 0) {
  const countStmt = db.prepare('SELECT COUNT(*) as total FROM media');
  const { total } = countStmt.get();

  const stmt = db.prepare(`
    SELECT id, title, description, src, type, tags, annotations, fps,
           added_at as addedAt, updated_at as updatedAt,
           source, publication_date as publicationDate
    FROM media
    ORDER BY updated_at DESC
    LIMIT ? OFFSET ?
  `);

  const items = stmt.all(limit, offset).map(parseMediaRow);

  return {
    items,
    total,
    limit,
    offset,
    hasMore: offset + items.length < total
  };
}

export function getMediaById(id) {
  const stmt = db.prepare(`
    SELECT id, title, description, src, type, tags, annotations, fps,
           added_at as addedAt, updated_at as updatedAt,
           source, publication_date as publicationDate
    FROM media WHERE id = ?
  `);
  return parseMediaRow(stmt.get(id));
}

export function createMedia(media) {
  const stmt = db.prepare(`
    INSERT INTO media (id, title, description, src, type, tags, annotations, fps, added_at, updated_at, source, publication_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    media.id,
    media.title,
    media.description || '',
    media.src,
    media.type,
    JSON.stringify(media.tags || []),
    JSON.stringify(media.annotations || []),
    media.fps || 30,
    media.addedAt,
    media.updatedAt,
    media.source || '',
    media.publicationDate || ''
  );
  return getMediaById(media.id);
}

export function updateMedia(id, updates) {
  const current = getMediaById(id);
  if (!current) return null;

  const updatedAt = Date.now();
  const stmt = db.prepare(`
    UPDATE media SET
      title = ?, description = ?, src = ?, type = ?,
      tags = ?, annotations = ?, fps = ?, updated_at = ?,
      source = ?, publication_date = ?
    WHERE id = ?
  `);
  stmt.run(
    updates.title ?? current.title,
    updates.description ?? current.description,
    updates.src ?? current.src,
    updates.type ?? current.type,
    JSON.stringify(updates.tags ?? current.tags),
    JSON.stringify(updates.annotations ?? current.annotations),
    updates.fps ?? current.fps,
    updatedAt,
    updates.source ?? current.source ?? '',
    updates.publicationDate ?? current.publicationDate ?? '',
    id
  );
  return getMediaById(id);
}

export function deleteMedia(id) {
  const stmt = db.prepare('DELETE FROM media WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
}

/**
 * Get the next available resource number for a given date, source and subject prefix
 * Returns the next 3-digit ID (e.g., "001", "002", etc.)
 */
export function getNextResourceNumber(datePrefix, sourcePrefix, subjectPrefix) {
  // Pattern: YYYYMMDD_source_subject_NNN
  const pattern = `${datePrefix}_${sourcePrefix}_${subjectPrefix}_%`;
  const stmt = db.prepare(`
    SELECT src FROM media
    WHERE src LIKE ?
    ORDER BY src DESC
  `);
  const results = stmt.all(pattern);

  if (results.length === 0) {
    return '001';
  }

  // Extract the highest number
  let maxNum = 0;
  for (const row of results) {
    const match = row.src.match(/_(\d{3})\.[^.]+$/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNum) maxNum = num;
    }
  }

  return String(maxNum + 1).padStart(3, '0');
}

// ============ NOMENCLATURES OPERATIONS ============

export function getAllNomenclatures() {
  const stmt = db.prepare('SELECT * FROM nomenclatures ORDER BY label');
  return stmt.all();
}

export function getNomenclatureById(id) {
  const stmt = db.prepare('SELECT * FROM nomenclatures WHERE id = ?');
  return stmt.get(id);
}

export function createNomenclature(nomenclature) {
  const stmt = db.prepare(`
    INSERT INTO nomenclatures (id, label, description, interpretation)
    VALUES (?, ?, ?, ?)
  `);
  stmt.run(
    nomenclature.id,
    nomenclature.label,
    nomenclature.description || '',
    nomenclature.interpretation || ''
  );
  return getNomenclatureById(nomenclature.id);
}

export function updateNomenclature(id, updates) {
  const current = getNomenclatureById(id);
  if (!current) return null;

  const stmt = db.prepare(`
    UPDATE nomenclatures SET label = ?, description = ?, interpretation = ?
    WHERE id = ?
  `);
  stmt.run(
    updates.label ?? current.label,
    updates.description ?? current.description,
    updates.interpretation ?? current.interpretation,
    id
  );
  return getNomenclatureById(id);
}

export function deleteNomenclature(id) {
  const stmt = db.prepare('DELETE FROM nomenclatures WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
}

export function upsertNomenclature(nomenclature) {
  // First, check if a nomenclature with this label already exists (case-insensitive)
  const stmtByLabel = db.prepare('SELECT * FROM nomenclatures WHERE LOWER(label) = LOWER(?)');
  const existingByLabel = stmtByLabel.get(nomenclature.label);
  if (existingByLabel) {
    return existingByLabel; // Use existing nomenclature with this label
  }

  // Also check by ID for backward compatibility
  const existing = getNomenclatureById(nomenclature.id);
  if (existing) {
    return existing; // Don't overwrite existing nomenclatures
  }

  return createNomenclature(nomenclature);
}

// ============ REVIEW LIST OPERATIONS ============

export function getReviewList() {
  const stmt = db.prepare(`
    SELECT m.id, m.title, m.description, m.src, m.type, m.tags, m.annotations, m.fps,
           m.added_at as addedAt, m.updated_at as updatedAt,
           m.source, m.publication_date as publicationDate
    FROM review_list r
    JOIN media m ON r.media_id = m.id
    ORDER BY r.added_at DESC
  `);
  return stmt.all().map(parseMediaRow);
}

export function addToReviewList(mediaId) {
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO review_list (media_id, added_at) VALUES (?, ?)
  `);
  stmt.run(mediaId, Date.now());
  return true;
}

export function removeFromReviewList(mediaId) {
  const stmt = db.prepare('DELETE FROM review_list WHERE media_id = ?');
  const result = stmt.run(mediaId);
  return result.changes > 0;
}

export function clearReviewList() {
  const stmt = db.prepare('DELETE FROM review_list');
  stmt.run();
  return true;
}

// ============ QUIZ LIST OPERATIONS ============

export function getQuizList() {
  const stmt = db.prepare(`
    SELECT m.id, m.title, m.description, m.src, m.type, m.tags, m.annotations, m.fps,
           m.added_at as addedAt, m.updated_at as updatedAt,
           m.source, m.publication_date as publicationDate
    FROM quiz_list q
    JOIN media m ON q.media_id = m.id
    ORDER BY q.added_at DESC
  `);
  return stmt.all().map(parseMediaRow);
}

export function addToQuizList(mediaId) {
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO quiz_list (media_id, added_at) VALUES (?, ?)
  `);
  stmt.run(mediaId, Date.now());
  return true;
}

export function removeFromQuizList(mediaId) {
  const stmt = db.prepare('DELETE FROM quiz_list WHERE media_id = ?');
  const result = stmt.run(mediaId);
  return result.changes > 0;
}

export function clearQuizList() {
  const stmt = db.prepare('DELETE FROM quiz_list');
  stmt.run();
  return true;
}

// ============ BULK OPERATIONS ============

export function getFullDatabase() {
  return {
    media: getAllMedia(),
    nomenclatures: getAllNomenclatures(),
    reviewList: getReviewList(),
    quizzList: getQuizList()
  };
}

export function importDatabase(data) {
  const transaction = db.transaction(() => {
    // Clear existing data
    db.exec('DELETE FROM quiz_list');
    db.exec('DELETE FROM review_list');
    db.exec('DELETE FROM nomenclatures');
    db.exec('DELETE FROM media');

    // Import media
    const mediaStmt = db.prepare(`
      INSERT INTO media (id, title, description, src, type, tags, annotations, fps, added_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const m of data.media || []) {
      mediaStmt.run(
        m.id,
        m.title,
        m.description || '',
        m.src,
        m.type,
        JSON.stringify(m.tags || []),
        JSON.stringify(m.annotations || []),
        m.fps || 30,
        m.addedAt || Date.now(),
        m.updatedAt || Date.now()
      );
    }

    // Import nomenclatures
    const nomStmt = db.prepare(`
      INSERT INTO nomenclatures (id, label, description, interpretation)
      VALUES (?, ?, ?, ?)
    `);
    for (const n of data.nomenclatures || []) {
      nomStmt.run(n.id, n.label, n.description || '', n.interpretation || '');
    }

    // Import review list
    const reviewStmt = db.prepare('INSERT OR IGNORE INTO review_list (media_id, added_at) VALUES (?, ?)');
    for (const item of data.reviewList || []) {
      const mediaId = typeof item === 'string' ? item : item.id;
      reviewStmt.run(mediaId, Date.now());
    }

    // Import quiz list
    const quizStmt = db.prepare('INSERT OR IGNORE INTO quiz_list (media_id, added_at) VALUES (?, ?)');
    for (const item of data.quizzList || []) {
      const mediaId = typeof item === 'string' ? item : item.id;
      quizStmt.run(mediaId, Date.now());
    }
  });

  transaction();
  return getFullDatabase();
}

export function resetDatabase() {
  const transaction = db.transaction(() => {
    db.exec('DELETE FROM quiz_list');
    db.exec('DELETE FROM review_list');
    db.exec('DELETE FROM nomenclatures');
    db.exec('DELETE FROM media');
  });
  transaction();
  return getFullDatabase();
}

// Initialize database on module load
initDatabase();

export default db;
