const fs = require('fs');
const path = require('path');
const { query, connect } = require('../config/database');

async function migrate() {
  try {
    const schema = fs.readFileSync(
      path.join(__dirname, '001_create_schema.sql'),
      'utf8'
    );
    await query(schema);
    console.log('Database migration completed successfully');
  } catch (err) {
    console.error('Migration failed:', err.message);
  }
}

migrate();
