import { NextResponse } from 'next/server';
import { db, initDb } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

export async function GET(req: Request, { params }: { params: Promise<{ companyId: string }> }) {
  const { companyId } = await params;
  const { user, errorResponse } = await verifyAuth(req);
  if (errorResponse) return errorResponse;

  if (user?.company_id !== companyId && user?.role !== 'superadmin') {
    return NextResponse.json({ error: 'Unauthorized: Company mismatch' }, { status: 403 });
  }

  try {
    await initDb();
    const result = await db.query('SELECT * FROM tasks WHERE company_id = $1 ORDER BY created_at DESC', [companyId]);
    return NextResponse.json(result.rows);
  } catch (e: any) {
    console.error(`API Error [tasks/company/${companyId}]:`, e);
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

