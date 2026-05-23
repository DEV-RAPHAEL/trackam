import { NextResponse } from 'next/server';
import { db, initDb } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

const ALLOWED_COLUMNS = ['id', 'company_id', 'name', 'email', 'phone', 'company', 'status', 'created_at'];

export async function POST(req: Request) {
  const { user, errorResponse } = await verifyAuth(req);
  if (errorResponse) return errorResponse;

  try {
    await initDb();
    const body = await req.json();
    // Security: Enforce company_id from token, never trust client
    body.company_id = user!.company_id;
    // Security: Only allow known columns — prevent column injection
    const filtered = Object.fromEntries(
      Object.entries(body).filter(([k]) => ALLOWED_COLUMNS.includes(k))
    );
    const keys = Object.keys(filtered);
    const values = Object.values(filtered);
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
    await db.query(`INSERT INTO clients (${keys.join(', ')}) VALUES (${placeholders})`, values);
    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error('API Error [POST clients]:', e);
    return NextResponse.json({ error: 'Failed to create client' }, { status: 500 });
  }
}
