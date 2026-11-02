const fs = require('fs');
const path = require('path');
const { query, ready, isDbAvailable } = require('../config/database');

async function migrate() {
  await ready;

  if (!isDbAvailable()) {
    console.error(
      '\nMigration aborted: no PostgreSQL connection.\n' +
      'Set DATABASE_URL (or the DB_* variables) to the database you want to migrate.\n'
    );
    process.exit(1);
  }

  const migrations = [
    '001_create_schema.sql',
    '002_personal_tracking.sql',
  ];

  for (const file of migrations) {
    const sqlPath = path.join(__dirname, file);
    if (!fs.existsSync(sqlPath)) {
      console.log(`Skipping ${file} (not found)`);
      continue;
    }
    const schema = fs.readFileSync(sqlPath, 'utf8');
    try {
      await query(schema);
      console.log(`Migration ${file} completed successfully`);
    } catch (err) {
      console.error(`Migration ${file} failed:`, err.message);
      process.exit(1);
    }
  }

  process.exit(0);
}

migrate();
