import { NextResponse } from 'next/server';
import { db, initDb } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

export async function GET(req: Request) {
  const { user, errorResponse } = await verifyAuth(req);
  if (errorResponse) return errorResponse;

  try {
    await initDb();
    
    // Fixed table name from 'modules' to 'system_modules' as defined in lib/db.ts
    const result = await db.query('SELECT * FROM system_modules ORDER BY id ASC');
    return NextResponse.json(result.rows);
  } catch (e: any) {
    console.error('API Error [modules]:', e);
    return NextResponse.json({ error: 'Failed to fetch modules' }, { status: 500 });
  }
}
