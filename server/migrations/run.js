const fs = require('fs');
const path = require('path');
const { query, ready, isDbAvailable } = require('../config/database');

async function migrate() {
  // The connection attempt is started at import time and is not instant. Without
  // waiting for it, query() saw dbAvailable === false and ran the whole schema
  // against the in-memory development store — which reported success and left
  // the real database empty.
  await ready;

  if (!isDbAvailable()) {
    console.error(
      '\nMigration aborted: no PostgreSQL connection.\n' +
      'Set DATABASE_URL (or the DB_* variables) to the database you want to migrate.\n'
    );
    process.exit(1);
  }

  const schema = fs.readFileSync(
    path.join(__dirname, '001_create_schema.sql'),
    'utf8'
  );

  try {
    await query(schema);
    console.log('Database migration completed successfully');
    process.exit(0);
  } catch (err) {
    // This used to be logged and then swallowed, so the process exited 0. A
    // deploy pipeline read that as success and started a server against a
    // database with no tables.
    console.error('Migration failed:', err.message);
    process.exit(1);
  }
}

migrate();
