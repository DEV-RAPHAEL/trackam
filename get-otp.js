const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const envPath = path.join(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const databaseUrlLine = envContent.split('\n').find(line => line.trim().startsWith('DATABASE_URL='));
const databaseUrl = databaseUrlLine.split('DATABASE_URL=')[1].trim().replace(/['"]/g, '');

async function getOtp() {
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const result = await pool.query(
      `SELECT code, type, expires_at, used, created_at 
       FROM otps 
       WHERE LOWER(email) = 'hinovalimited@gmail.com'
       ORDER BY created_at DESC 
       LIMIT 5`
    );
    console.log('--- RECENT OTPS FOR hinovalimited@gmail.com ---');
    console.log(result.rows);
  } catch (error) {
    console.error('Error querying:', error);
  } finally {
    await pool.end();
  }
}

getOtp();
