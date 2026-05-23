import { NextResponse } from 'next/server';
import { db, initDb } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

// Helper to check if caller is platform superadmin
async function isSuperAdmin(req: Request) {
  const { user } = await verifyAuth(req);
  if (!user || user.role !== 'superadmin') {
    return false;
  }
  return true;
}

export async function GET(req: Request) {
  if (!(await isSuperAdmin(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await initDb();
    const companies = await db.query('SELECT * FROM companies ORDER BY name');
    
    // Get all users for all companies
    const users = await db.query('SELECT id, company_id, name, email, role, status FROM users');

    // Get all activity/billing logs
    const logs = await db.query(`
      SELECT a.*, c.name as company_name, u.name as user_name 
      FROM activity_logs a 
      LEFT JOIN companies c ON a.company_id = c.id
      LEFT JOIN users u ON a.user_id = u.id
      ORDER BY a.created_at DESC 
      LIMIT 100
    `);
    
    return NextResponse.json({ 
      companies: companies.rows,
      users: users.rows,
      logs: logs.rows
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  if (!(await isSuperAdmin(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await initDb();
    const { action, targetId, status } = await req.json();

    if (action === 'suspend_company') {
      await db.query('UPDATE companies SET status = $1 WHERE id = $2', [status, targetId]);
    } else if (action === 'suspend_user') {
      await db.query('UPDATE users SET status = $1 WHERE id = $2', [status, targetId]);
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
