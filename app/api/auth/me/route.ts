import { NextResponse } from 'next/server';
import { db, initDb } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

export async function GET(req: Request) {
  const { user, errorResponse } = await verifyAuth(req);
  if (errorResponse) return errorResponse;

  try {
    await initDb();
    const companyResult = await db.query('SELECT * FROM companies WHERE id = $1', [user!.company_id]);
    const company = companyResult.rows[0] || null;
    
    // Fetch full user record to ensure it is fresh
    const userResult = await db.query('SELECT * FROM users WHERE id = $1', [user!.id]);
    const freshUser = userResult.rows[0];
    
    if (!freshUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user: freshUser, company });
  } catch (e: any) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
