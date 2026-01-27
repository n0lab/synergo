/**
 * Database Migration System
 * Tracks and applies schema changes in order
 */

import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Migration definitions
 * Each migration has an id, description, and up/down functions
 */
const migrations = [
  {
    id: 1,
    description: 'Initial schema',
    up: (db) => {
      db.exec(`
        -- Media table
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

        -- Nomenclatures table
        CREATE TABLE IF NOT EXISTS nomenclatures (
          id TEXT PRIMARY KEY,
          label TEXT NOT NULL,
          description TEXT DEFAULT '',
          interpretation TEXT DEFAULT ''
        );

        -- Review list table
        CREATE TABLE IF NOT EXISTS review_list (
          media_id TEXT PRIMARY KEY,
          added_at INTEGER NOT NULL,
          FOREIGN KEY (media_id) REFERENCES media(id) ON DELETE CASCADE
        );

        -- Quiz list table
        CREATE TABLE IF NOT EXISTS quiz_list (
          media_id TEXT PRIMARY KEY,
          added_at INTEGER NOT NULL,
          FOREIGN KEY (media_id) REFERENCES media(id) ON DELETE CASCADE
        );

        -- Create indexes
        CREATE INDEX IF NOT EXISTS idx_media_type ON media(type);
        CREATE INDEX IF NOT EXISTS idx_media_added_at ON media(added_at);
        CREATE INDEX IF NOT EXISTS idx_nomenclatures_label ON nomenclatures(label);
      `);
    },
    down: (db) => {
      db.exec(`
        DROP TABLE IF EXISTS quiz_list;
        DROP TABLE IF EXISTS review_list;
        DROP TABLE IF EXISTS nomenclatures;
        DROP TABLE IF EXISTS media;
      `);
    }
  },
  {
    id: 2,
    description: 'Add updated_at index for better sort performance',
    up: (db) => {
      db.exec(`
        CREATE INDEX IF NOT EXISTS idx_media_updated_at ON media(updated_at);
      `);
    },
    down: (db) => {
      db.exec(`
        DROP INDEX IF EXISTS idx_media_updated_at;
      `);
    }
  },
  {
    id: 3,
    description: 'Add full-text search support for media',
    up: (db) => {
      // Note: FTS5 requires SQLite to be compiled with FTS5 extension
      // This is a placeholder - uncomment when FTS5 is available
      /*
      db.exec(`
        CREATE VIRTUAL TABLE IF NOT EXISTS media_fts USING fts5(
          title,
          description,
          content='media',
          content_rowid='rowid'
        );

        -- Triggers to keep FTS in sync
        CREATE TRIGGER IF NOT EXISTS media_ai AFTER INSERT ON media BEGIN
          INSERT INTO media_fts(rowid, title, description) VALUES (new.rowid, new.title, new.description);
        END;

        CREATE TRIGGER IF NOT EXISTS media_ad AFTER DELETE ON media BEGIN
          INSERT INTO media_fts(media_fts, rowid, title, description) VALUES('delete', old.rowid, old.title, old.description);
        END;

        CREATE TRIGGER IF NOT EXISTS media_au AFTER UPDATE ON media BEGIN
          INSERT INTO media_fts(media_fts, rowid, title, description) VALUES('delete', old.rowid, old.title, old.description);
          INSERT INTO media_fts(rowid, title, description) VALUES (new.rowid, new.title, new.description);
        END;
      `);
      */
      console.log('Migration 3: FTS5 support placeholder - enable when needed');
    },
    down: (db) => {
      /*
      db.exec(`
        DROP TRIGGER IF EXISTS media_au;
        DROP TRIGGER IF EXISTS media_ad;
        DROP TRIGGER IF EXISTS media_ai;
        DROP TABLE IF EXISTS media_fts;
      `);
      */
    }
  },
  {
    id: 4,
    description: 'Add source and publication_date fields to media',
    up: (db) => {
      db.exec(`
        ALTER TABLE media ADD COLUMN source TEXT DEFAULT '';
        ALTER TABLE media ADD COLUMN publication_date TEXT DEFAULT '';
      `);
    },
    down: (db) => {
      // SQLite doesn't support DROP COLUMN in older versions
      // For rollback, we'd need to recreate the table
      console.log('Migration 4 rollback: source and publication_date columns remain (SQLite limitation)');
    }
  }
];

/**
 * Initialize migrations table
 */
function initMigrationsTable(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id INTEGER PRIMARY KEY,
      description TEXT NOT NULL,
      applied_at INTEGER NOT NULL
    )
  `);
}

/**
 * Get applied migrations
 */
function getAppliedMigrations(db) {
  const stmt = db.prepare('SELECT id FROM _migrations ORDER BY id');
  return new Set(stmt.all().map(row => row.id));
}

/**
 * Run pending migrations
 */
export function runMigrations(db) {
  initMigrationsTable(db);

  const applied = getAppliedMigrations(db);
  const pending = migrations.filter(m => !applied.has(m.id));

  if (pending.length === 0) {
    console.log('Database is up to date');
    return { applied: 0, total: migrations.length };
  }

  console.log(`Running ${pending.length} pending migration(s)...`);

  const insertStmt = db.prepare(
    'INSERT INTO _migrations (id, description, applied_at) VALUES (?, ?, ?)'
  );

  for (const migration of pending) {
    console.log(`  Applying migration ${migration.id}: ${migration.description}`);

    const transaction = db.transaction(() => {
      migration.up(db);
      insertStmt.run(migration.id, migration.description, Date.now());
    });

    try {
      transaction();
      console.log(`  ✓ Migration ${migration.id} applied`);
    } catch (error) {
      console.error(`  ✗ Migration ${migration.id} failed:`, error.message);
      throw error;
    }
  }

  return { applied: pending.length, total: migrations.length };
}

/**
 * Rollback last migration
 */
export function rollbackMigration(db) {
  initMigrationsTable(db);

  const applied = getAppliedMigrations(db);
  if (applied.size === 0) {
    console.log('No migrations to rollback');
    return false;
  }

  const lastApplied = Math.max(...applied);
  const migration = migrations.find(m => m.id === lastApplied);

  if (!migration) {
    console.error(`Migration ${lastApplied} not found in definitions`);
    return false;
  }

  console.log(`Rolling back migration ${migration.id}: ${migration.description}`);

  const deleteStmt = db.prepare('DELETE FROM _migrations WHERE id = ?');

  const transaction = db.transaction(() => {
    migration.down(db);
    deleteStmt.run(migration.id);
  });

  try {
    transaction();
    console.log(`✓ Migration ${migration.id} rolled back`);
    return true;
  } catch (error) {
    console.error(`✗ Rollback failed:`, error.message);
    throw error;
  }
}

/**
 * Get migration status
 */
export function getMigrationStatus(db) {
  initMigrationsTable(db);

  const applied = getAppliedMigrations(db);

  return migrations.map(m => ({
    id: m.id,
    description: m.description,
    applied: applied.has(m.id)
  }));
}

export default { runMigrations, rollbackMigration, getMigrationStatus };
