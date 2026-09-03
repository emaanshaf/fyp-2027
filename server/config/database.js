const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const { isProduction } = require('./env');

function genId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

let pool = null;
let dbAvailable = false;

// Every managed Postgres (Neon, Supabase, Render, Railway) hands out a single
// DATABASE_URL connection string, and .env.example has told people to use one
// since it was written — but only the discrete DB_* vars were ever read, so a
// correctly configured deployment connected to nothing and silently fell back
// to the file store. Prefer the URL when it is set.
function poolConfig() {
  const url = (process.env.DATABASE_URL || '').trim();
  const shared = {
    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 3000,
  };

  if (!url) {
    return {
      ...shared,
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'qitabe_noor',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '',
    };
  }

  return {
    ...shared,
    connectionString: url,
    // Hosted Postgres requires TLS but presents a chain Node has no root for,
    // so verification has to be relaxed or the connection is refused outright.
    // PGSSLMODE=disable opts out for a local or sidecar database.
    ssl: process.env.PGSSLMODE === 'disable' ? false : { rejectUnauthorized: false },
  };
}

async function tryConnect() {
  const usingUrl = Boolean((process.env.DATABASE_URL || '').trim());

  try {
    pool = new Pool(poolConfig());
    await pool.query('SELECT 1');
    dbAvailable = true;
    console.log(`PostgreSQL connected (via ${usingUrl ? 'DATABASE_URL' : 'DB_* variables'})`);
  } catch (err) {
    dbAvailable = false;

    // The file-backed store is a development convenience. In production it is
    // silent data loss: containers have ephemeral disks, so every redeploy
    // would wipe the accounts and bookmarks written to it while nothing in the
    // app or the logs said anything was wrong. Refuse to serve instead.
    if (isProduction) {
      console.error(
        `\nFATAL: PostgreSQL is unreachable (${err.message}).\n` +
        'Refusing to start in production on the file-backed fallback store, ' +
        'which is wiped on every redeploy.\n' +
        'Set DATABASE_URL to your database connection string.\n'
      );
      process.exit(1);
    }

    console.log('PostgreSQL not available — using file-backed local storage (server/.data)');
  }
}

// When PostgreSQL is unavailable the server falls back to an in-memory store.
// That fallback used to be volatile, so every restart silently wiped accounts
// and bookmarks. It is now written through to disk: still a development
// convenience rather than a production database, but no longer lossy.
const MEM_FILE = path.join(__dirname, '..', '.data', 'memstore.json');

function loadMemStore() {
  try {
    return JSON.parse(fs.readFileSync(MEM_FILE, 'utf8'));
  } catch {
    return {};
  }
}

const memStore = loadMemStore();

let flushTimer = null;
/** Debounced so a burst of writes costs one file write, not dozens. */
function persistMemStore() {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    try {
      fs.mkdirSync(path.dirname(MEM_FILE), { recursive: true });
      fs.writeFileSync(MEM_FILE, JSON.stringify(memStore));
    } catch (err) {
      console.error('Failed to persist in-memory store:', err.message);
    }
  }, 150);
}

function memQuery(text, params = []) {
  const sqlUpper = text.trim().toUpperCase();

  if (sqlUpper.startsWith('SELECT 1')) {
    return { rows: [{ '?column?': 1 }] };
  }

  const tableMatch = text.match(/(?:FROM|INTO|UPDATE)\s+(\w+)/i);
  const table = tableMatch ? tableMatch[1].toLowerCase() : 'unknown';
  if (!memStore[table]) memStore[table] = [];

  // INSERT with ON CONFLICT (upsert)
  if (sqlUpper.startsWith('INSERT') && sqlUpper.includes('ON CONFLICT')) {
    const cols = text.match(/\(([^)]+)\)/)?.[1]?.split(',').map(c => c.trim()) || [];
    const conflictCol = text.match(/ON CONFLICT\s*\((\w+)\)/i)?.[1]?.toLowerCase() || 'id';
    const hasUpdate = sqlUpper.includes('DO UPDATE SET');

    // Build the row from params
    const rowData = {};
    cols.forEach((col, i) => {
      if (i < params.length && params[i] !== undefined && params[i] !== null) {
        rowData[col] = params[i];
      }
    });

    // Find existing row by conflict column
    const conflictVal = rowData[conflictCol];
    const existingIdx = memStore[table].findIndex(r => r[conflictCol] === conflictVal);

    if (hasUpdate && existingIdx !== -1) {
      // UPDATE existing — parse COALESCE($N, table.col) patterns
      const updateSection = text.match(/DO UPDATE SET\s+(.+?)(?:\s+WHERE|\s+RETURNING|$)/is)?.[1] || '';
      const pairs = updateSection.split(',').map(s => s.trim());

      pairs.forEach(pair => {
        const m = pair.match(/(\w+)\s*=\s*COALESCE\(\$(\d+),/i);
        if (m) {
          const col = m[1].toLowerCase();
          const val = params[parseInt(m[2]) - 1];
          if (val !== undefined && val !== null) memStore[table][existingIdx][col] = val;
        }
        if (pair.includes('NOW()')) {
          const col = pair.split('=')[0].trim().toLowerCase();
          memStore[table][existingIdx][col] = new Date().toISOString();
        }
      });
      memStore[table][existingIdx].updated_at = new Date().toISOString();
      persistMemStore();
      return { rows: [memStore[table][existingIdx]] };
    }

    // INSERT new row
    const id = genId();
    const row = { id, ...rowData, created_at: new Date().toISOString() };
    memStore[table].push(row);
    persistMemStore();
    return { rows: [row] };
  }

  // Simple INSERT
  if (sqlUpper.startsWith('INSERT')) {
    const cols = text.match(/\(([^)]+)\)/)?.[1]?.split(',').map(c => c.trim()) || [];
    const row = { id: genId(), created_at: new Date().toISOString() };
    cols.forEach((col, i) => {
      if (i < params.length && params[i] !== undefined && params[i] !== null) row[col] = params[i];
    });
    memStore[table].push(row);
    persistMemStore();
    return { rows: [row] };
  }

  // SELECT
  if (sqlUpper.startsWith('SELECT')) {
    let rows = [...memStore[table]];

    // Extract selected columns (e.g., "SELECT id, email, name FROM...")
    const colMatch = text.match(/SELECT\s+(.+?)\s+FROM/i);
    const selectCols = colMatch && colMatch[1].trim() !== '*'
      ? colMatch[1].split(',').map(c => c.trim().toLowerCase())
      : null;

    if (sqlUpper.includes('WHERE')) {
      const wheres = text.match(/(\w+)\s*=\s*\$(\d+)/gi) || [];
      wheres.forEach(w => {
        const [, col, idx] = w.match(/(\w+)\s*=\s*\$(\d+)/i) || [];
        if (col && idx) rows = rows.filter(r => r[col.toLowerCase()] === params[parseInt(idx) - 1]);
      });
    }

    if (sqlUpper.includes('COUNT(*)')) {
      if (sqlUpper.includes('SUM(')) {
        return { rows: [{ total_sessions: rows.length, total_count: rows.reduce((s, r) => s + (r.count || 0), 0), completed_sessions: rows.filter(r => r.completed).length }] };
      }
      return { rows: [{ count: rows.length.toString() }] };
    }

    // Apply column selection
    if (selectCols) {
      rows = rows.map(row => {
        const filtered = {};
        selectCols.forEach(col => {
          if (row[col] !== undefined) filtered[col] = row[col];
        });
        return filtered;
      });
    }

    if (sqlUpper.includes('ORDER BY')) {
      const desc = sqlUpper.includes('DESC');
      rows.sort((a, b) => {
        const va = a.created_at || '';
        const vb = b.created_at || '';
        return desc ? (vb > va ? 1 : -1) : (va > vb ? 1 : -1);
      });
    }

    if (sqlUpper.includes('LIMIT')) {
      const lim = parseInt(sqlUpper.match(/LIMIT\s+(\d+)/)?.[1] || '100');
      rows = rows.slice(0, lim);
    }

    return { rows };
  }

  // UPDATE
  if (sqlUpper.startsWith('UPDATE')) {
    const setMatch = text.match(/SET\s+(.+?)\s+WHERE/i);
    const setParts = setMatch?.[1]?.split(',').map(s => s.trim()) || [];
    const allWheres = text.match(/(\w+)\s*=\s*\$(\d+)/gi) || [];
    const lastWhere = allWheres[allWheres.length - 1];
    const [, , lastIdx] = lastWhere?.match(/(\w+)\s*=\s*\$(\d+)/i) || [];
    const idParam = lastIdx ? params[parseInt(lastIdx) - 1] : params[params.length - 1];
    const idx = memStore[table].findIndex(r => r.id === idParam);
    if (idx === -1) return { rows: [] };

    setParts.forEach((part, i) => {
      const col = part.split('=')[0].trim().replace(/"/g, '').toLowerCase();
      if (i < params.length && params[i] !== undefined && params[i] !== null) {
        memStore[table][idx][col] = params[i];
      }
    });
    memStore[table][idx].updated_at = new Date().toISOString();
    persistMemStore();
    return { rows: [memStore[table][idx]] };
  }

  // DELETE
  if (sqlUpper.startsWith('DELETE')) {
    const wheres = text.match(/(\w+)\s*=\s*\$(\d+)/gi) || [];
    let before = memStore[table].length;

    // Filter out rows matching ALL where conditions
    memStore[table] = memStore[table].filter(row => {
      return !wheres.every(w => {
        const [, col, idx] = w.match(/(\w+)\s*=\s*\$(\d+)/i) || [];
        return col && row[col.toLowerCase()] === params[parseInt(idx) - 1];
      });
    });

    persistMemStore();
    return { rows: before > memStore[table].length ? [{ id: params[0] }] : [] };
  }

  return { rows: [] };
}

async function query(text, params) {
  if (dbAvailable) {
    try {
      return await pool.query(text, params);
    } catch (err) {
      console.error('DB query error:', err.message);
      // Falling back to the memory store here would write the row to a
      // different database than the one that just failed, so the data is
      // there on one read and gone on the next. In development that is a
      // usable trade; in production it is corruption, so surface the error.
      if (isProduction) throw err;
      console.error('  falling back to the local memory store (development only)');
      return memQuery(text, params);
    }
  }
  return memQuery(text, params);
}

async function connect() {
  if (dbAvailable) return pool.connect();
  return { query, release: () => {} };
}

// Exported so the server can wait for the connection attempt before it starts
// listening. Without that, production briefly accepts requests on the fallback
// store before the guard in tryConnect() gets to exit.
const ready = tryConnect();

module.exports = { query, connect, ready, isDbAvailable: () => dbAvailable };
