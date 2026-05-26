const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const envPath = path.join(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const databaseUrlLine = envContent.split('\n').find(line => line.trim().startsWith('DATABASE_URL='));
const databaseUrl = databaseUrlLine.split('DATABASE_URL=')[1].trim().replace(/['"]/g, '');

async function check() {
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const users = await pool.query('SELECT id, company_id, name, email, role FROM users');
    console.log('--- USERS IN NEON DB ---');
    console.log(users.rows);

    const companies = await pool.query('SELECT id, name, subdomain FROM companies');
    console.log('--- COMPANIES IN NEON DB ---');
    console.log(companies.rows);
  } catch (error) {
    console.error('Error querying:', error);
  } finally {
    await pool.end();
  }
}

check();
