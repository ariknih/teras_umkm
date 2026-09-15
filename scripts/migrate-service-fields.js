const { Pool } = require('pg');

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL or DIRECT_URL not set');
  process.exit(1);
}

const pool = new Pool({ connectionString });

async function run() {
  try {
    console.log('Altering Service table to add missing columns...');
    await pool.query(`
      ALTER TABLE "Service" 
        ADD COLUMN IF NOT EXISTS "sessionDurationMinutes" INTEGER DEFAULT 60,
        ADD COLUMN IF NOT EXISTS "maxWorkHoursPerDay" INTEGER DEFAULT 8,
        ADD COLUMN IF NOT EXISTS "location" TEXT DEFAULT 'Indonesia',
        ADD COLUMN IF NOT EXISTS "images" TEXT[] DEFAULT '{}';
    `);
    console.log('Columns added successfully!');

    const res = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'Service' 
      ORDER BY ordinal_position;
    `);
    console.table(res.rows);
  } catch (err) {
    console.error('Migration error:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

run();
