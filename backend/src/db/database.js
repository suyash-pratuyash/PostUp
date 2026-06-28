import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, '..', '..', 'postup.db');

let db = null;
let saveTimeout = null;

export async function initDb() {
  const SQL = await initSqlJs();

  // Load existing database or create new one
  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
    console.log('📂 Loaded existing database');
  } else {
    db = new SQL.Database();
    console.log('🆕 Created new database');
  }

  // Enable foreign keys
  db.run('PRAGMA foreign_keys = ON');

  // Create schema
  initializeSchema();

  return db;
}

function initializeSchema() {
  db.run(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'completed', 'paused')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS daily_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER,
      day_number INTEGER,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      tags TEXT DEFAULT '[]',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS generated_posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      daily_log_id INTEGER,
      project_id INTEGER,
      raw_input TEXT NOT NULL,
      generated_content TEXT NOT NULL,
      tone TEXT DEFAULT 'professional',
      is_favorite INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (daily_log_id) REFERENCES daily_logs(id) ON DELETE SET NULL,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
    )
  `);

  // Create indexes (IF NOT EXISTS not supported for indexes in some SQLite versions, so we try/catch)
  try { db.run('CREATE INDEX idx_daily_logs_project ON daily_logs(project_id)'); } catch (e) { /* already exists */ }
  try { db.run('CREATE INDEX idx_generated_posts_log ON generated_posts(daily_log_id)'); } catch (e) { /* already exists */ }
  try { db.run('CREATE INDEX idx_generated_posts_project ON generated_posts(project_id)'); } catch (e) { /* already exists */ }

  saveDatabase();
  console.log('✅ Database schema initialized');
}

export function getDb() {
  if (!db) {
    throw new Error('Database not initialized. Call initDb() first.');
  }
  return db;
}

// Helper: Run a query and return all results as objects
export function queryAll(sql, params = []) {
  const stmt = db.prepare(sql);
  if (params.length > 0) stmt.bind(params);

  const results = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

// Helper: Run a query and return the first result as object
export function queryOne(sql, params = []) {
  const stmt = db.prepare(sql);
  if (params.length > 0) stmt.bind(params);

  let result = null;
  if (stmt.step()) {
    result = stmt.getAsObject();
  }
  stmt.free();
  return result;
}

// Helper: Run a modification query (INSERT/UPDATE/DELETE)
export function runQuery(sql, params = []) {
  db.run(sql, params);
  const lastId = db.exec('SELECT last_insert_rowid() as id')[0]?.values[0][0];
  const changes = db.getRowsModified();
  scheduleSave();
  return { lastInsertRowid: lastId, changes };
}

// Debounced save to disk (avoids excessive writes)
function scheduleSave() {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    saveDatabase();
  }, 500);
}

export function saveDatabase() {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  }
}

export function closeDb() {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }
  if (db) {
    saveDatabase();
    db.close();
    db = null;
    console.log('📁 Database closed and saved');
  }
}
