const fs = require('fs');
const path = require('path');
const pool = require('./pool');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function migrate() {
  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf-8');
    await pool.query(sql);
    console.log('✅ Database migration completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  }
}

migrate();
