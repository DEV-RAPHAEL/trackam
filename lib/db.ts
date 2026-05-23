/**
 * lib/db.ts
 *
 * Database abstraction layer.
 *
 * - Local dev (no DATABASE_URL): better-sqlite3 — a simple .db file, sync API,
 *   zero config. Stored on globalThis so it survives Next.js HMR reloads.
 * - Production (DATABASE_URL set): real Postgres via the `pg` pool.
 *
 * Both expose the same interface:
 *   db.query(sql, params?) → Promise<{ rows: Record<string,unknown>[] }>
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const g = globalThis as any;

if (!g.__trackamDb) {
  if (process.env.DATABASE_URL) {
    // ── Production: real Postgres ────────────────────────────────────────
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Pool } = require('pg');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });
    g.__trackamDb = {
      query: (sql: string, params?: unknown[]) => pool.query(sql, params),
    };
  } else {
    // ── Local dev: better-sqlite3 (simple file-based SQLite) ────────────
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Database = require('better-sqlite3');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const path = require('path');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require('fs');

    const sqlitePath = process.env.SQLITE_DB_PATH || './trackam-dev.db';
    const dir = path.dirname(sqlitePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const sqlite = new Database(sqlitePath);

    // Enable WAL mode for better concurrent read performance
    sqlite.pragma('journal_mode = WAL');

    /**
     * Adapter: translates Postgres-style $1,$2 placeholders to SQLite ?
     * and returns data in the same shape as pg ({ rows: [...] }).
     */
    g.__trackamDb = {
      query: (sql: string, params: unknown[] = []) => {
        // Convert $1 $2 ... → ?
        const adapted = sql.replace(/\$\d+/g, '?');
        try {
          // Detect statement type
          const trimmed = adapted.trim().toUpperCase();
          if (trimmed.startsWith('SELECT') || trimmed.startsWith('WITH')) {
            const rows = sqlite.prepare(adapted).all(...params);
            return Promise.resolve({ rows });
          } else {
            sqlite.prepare(adapted).run(...params);
            return Promise.resolve({ rows: [] });
          }
        } catch (e) {
          return Promise.reject(e);
        }
      },
    };
  }
}

export const db: {
  query: (sql: string, params?: unknown[]) => Promise<{ rows: unknown[] }>;
} = g.__trackamDb;

// ─── Schema init ─────────────────────────────────────────────────────────────
// Guard on globalThis so CREATE TABLE only runs once per process lifetime.

let _initPromise: Promise<void> | null = g.__trackamInitPromise ?? null;

export async function initDb(): Promise<void> {
  if (g.__trackamInitDone) return;
  if (_initPromise) return _initPromise;

  _initPromise = (async () => {
    try {
      const tables = [
        `CREATE TABLE IF NOT EXISTS companies (
          id TEXT PRIMARY KEY, name TEXT NOT NULL, status TEXT NOT NULL,
          onboarding_step TEXT NOT NULL, brand_color TEXT, logo TEXT,
          address TEXT, phone TEXT, email TEXT, website TEXT,
          trial_ends_at TEXT, subscription_status TEXT, subdomain TEXT
        )`,
        `CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY, company_id TEXT NOT NULL, name TEXT NOT NULL,
          email TEXT NOT NULL, password TEXT, role TEXT NOT NULL, status TEXT DEFAULT 'active'
        )`,
        `CREATE TABLE IF NOT EXISTS clients (
          id TEXT PRIMARY KEY, company_id TEXT NOT NULL, name TEXT NOT NULL,
          email TEXT NOT NULL, phone TEXT, company TEXT, status TEXT,
          created_at TEXT NOT NULL
        )`,
        `CREATE TABLE IF NOT EXISTS leads (
          id TEXT PRIMARY KEY, company_id TEXT NOT NULL, name TEXT NOT NULL,
          email TEXT NOT NULL, phone TEXT, company TEXT, status TEXT,
          source TEXT, value REAL, stage TEXT, created_at TEXT NOT NULL
        )`,
        `CREATE TABLE IF NOT EXISTS deals (
          id TEXT PRIMARY KEY, company_id TEXT NOT NULL, client_id TEXT NOT NULL,
          title TEXT NOT NULL, value REAL NOT NULL, stage TEXT NOT NULL,
          probability INTEGER, expected_close_date TEXT, created_at TEXT NOT NULL
        )`,
        `CREATE TABLE IF NOT EXISTS tasks (
          id TEXT PRIMARY KEY, company_id TEXT NOT NULL, title TEXT NOT NULL,
          description TEXT, due_date TEXT, status TEXT NOT NULL, priority TEXT NOT NULL,
          assigned_to TEXT, related_type TEXT, related_id TEXT,
          comments TEXT, created_at TEXT NOT NULL
        )`,
        `CREATE TABLE IF NOT EXISTS invoices (
          id TEXT PRIMARY KEY, company_id TEXT NOT NULL, client_id TEXT NOT NULL,
          amount REAL NOT NULL, status TEXT NOT NULL, due_date TEXT NOT NULL,
          items TEXT NOT NULL, created_at TEXT NOT NULL, notes TEXT,
          template_id TEXT, is_sent INTEGER DEFAULT 0, last_sent_at TEXT
        )`,
        `CREATE TABLE IF NOT EXISTS activity_logs (
          id TEXT PRIMARY KEY, company_id TEXT NOT NULL, user_id TEXT NOT NULL,
          action TEXT NOT NULL, description TEXT, created_at TEXT NOT NULL
        )`,
        `CREATE TABLE IF NOT EXISTS lead_activities (
          id TEXT PRIMARY KEY, lead_id TEXT NOT NULL, user_id TEXT NOT NULL,
          user_name TEXT NOT NULL, content TEXT NOT NULL, created_at TEXT NOT NULL,
          FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE
        )`,
        `CREATE TABLE IF NOT EXISTS modules (
          id TEXT PRIMARY KEY, name TEXT NOT NULL, slug TEXT NOT NULL,
          description TEXT, status TEXT NOT NULL, price REAL
        )`,
      ];

      for (const sql of tables) await db.query(sql);

      // Migrations for new columns
      const migrations = [
        'ALTER TABLE companies ADD COLUMN bank_name TEXT',
        'ALTER TABLE companies ADD COLUMN account_name TEXT',
        'ALTER TABLE companies ADD COLUMN account_number TEXT',
        'ALTER TABLE leads ADD COLUMN last_contact_date TEXT',
        'ALTER TABLE leads ADD COLUMN next_followup_date TEXT',
        'ALTER TABLE leads ADD COLUMN notes TEXT',
      ];
      for (const migration of migrations) {
        try {
          await db.query(migration);
        } catch (e) {
          // Ignore "duplicate column name" errors
        }
      }

      // Seed modules once if empty
      const r = await db.query('SELECT COUNT(*) as count FROM modules');
      const count = parseInt(String((r.rows[0] as { count: unknown }).count ?? 0));
      if (count === 0) {
        const seeds = [
          `INSERT INTO modules VALUES ('mod-1','POS System','pos','Manage in-store sales and inventory seamlessly.','available',49)`,
          `INSERT INTO modules VALUES ('mod-2','HR Management','hr','Employee records, attendance, and payroll.','locked',99)`,
          `INSERT INTO modules VALUES ('mod-3','Accounting','accounting','Full double-entry accounting ledger.','locked',79)`,
          `INSERT INTO modules VALUES ('mod-4','Projects','projects','Advanced project tracking and time logging.','available',39)`,
          `INSERT INTO modules VALUES ('mod-5','Support Tickets','support','Helpdesk for your customers.','locked',29)`,
        ];
        for (const s of seeds) await db.query(s);
      }

      // Seed default platform superadmin user if not already present
      const adminCheck = await db.query("SELECT id FROM users WHERE role = 'superadmin'");
      if (adminCheck.rows.length === 0) {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const bcrypt = require('bcryptjs');
        const hashed = await bcrypt.hash('admin1234', 10);
        await db.query(
          "INSERT INTO users (id, company_id, name, email, password, role) VALUES ($1, $2, $3, $4, $5, $6)",
          ['superadmin-id', 'platform', 'Platform Administrator', 'superadmin@trackam.ng', hashed, 'superadmin']
        );
      }

      g.__trackamInitDone = true;
      console.log('✅ DB schema ready');
    } catch (e) {
      _initPromise = null;
      g.__trackamInitPromise = null;
      throw e;
    }
  })();

  g.__trackamInitPromise = _initPromise;
  return _initPromise;
}
