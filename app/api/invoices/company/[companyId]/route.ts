import { NextResponse } from 'next/server';
import { db, initDb } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

export async function GET(req: Request, { params }: { params: Promise<{ companyId: string }> }) {
  const { companyId } = await params;
  const { user, errorResponse } = await verifyAuth(req);
  if (errorResponse) return errorResponse;

  // Security: Ensure user can only access their own company's invoices
  if (user?.company_id !== companyId && user?.role !== 'superadmin') {
    return NextResponse.json({ error: 'Unauthorized: Company mismatch' }, { status: 403 });
  }

  try {
    await initDb();
    
    let result;
    if (user?.role === 'user') {
      result = await db.query(
        'SELECT * FROM invoices WHERE company_id = $1 AND created_by = $2 ORDER BY created_at DESC',
        [companyId, user.id]
      );
    } else {
      result = await db.query(
        'SELECT * FROM invoices WHERE company_id = $1 ORDER BY created_at DESC',
        [companyId]
      );
    }
    return NextResponse.json(result.rows);
  } catch (e: any) {
    console.error(`API Error [invoices/company/${companyId}]:`, e);
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
  }
}

