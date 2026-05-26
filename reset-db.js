const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Parse .env manually
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  console.error('❌ .env file not found at', envPath);
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const databaseUrlLine = envContent.split('\n').find(line => line.trim().startsWith('DATABASE_URL='));

if (!databaseUrlLine) {
  console.error('❌ DATABASE_URL not defined in .env');
  process.exit(1);
}

const databaseUrl = databaseUrlLine.split('DATABASE_URL=')[1].trim().replace(/['"]/g, '');

const tables = [
  'companies',
  'users',
  'clients',
  'leads',
  'deals',
  'tasks',
  'invoices',
  'activity_logs',
  'lead_activities',
  'modules',
  'site_settings',
  'otps',
  'login_attempts'
];

async function resetDb() {
  console.log('🔄 Connecting to Neon PostgreSQL...');
  console.log('🔗 URL:', databaseUrl.split('@')[1] ? '***@' + databaseUrl.split('@')[1] : databaseUrl);

  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🧹 Dropping all tables...');
    for (const table of tables) {
      console.log(`   - Dropping table "${table}" (if exists)...`);
      await pool.query(`DROP TABLE IF EXISTS ${table} CASCADE;`);
    }
    console.log('✅ All tables dropped successfully!');
    console.log('💡 Note: The next time you visit or interact with the Trackam app, the schema will be automatically recreated and seeded.');
  } catch (error) {
    console.error('❌ Error resetting database:', error);
  } finally {
    await pool.end();
  }
}

resetDb();
