import { NextResponse } from 'next/server';
import { db, initDb } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user, errorResponse } = await verifyAuth(req);
  if (errorResponse) return errorResponse;

  // Authorization check — only owner or admin can upgrade/unlock modules
  if (user?.role !== 'owner' && user?.role !== 'admin' && user?.role !== 'superadmin') {
    return NextResponse.json({ error: 'Unauthorized: Only workspace owners and admins can upgrade modules.' }, { status: 403 });
  }

  try {
    await initDb();
    const body = await req.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json({ error: 'status is required' }, { status: 400 });
    }

    await db.query('UPDATE modules SET status = $1 WHERE id = $2', [status, id]);
    
    // Log module upgrade activity
    const logId = 'log-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
    await db.query(
      'INSERT INTO activity_logs (id, company_id, user_id, action, description, created_at) VALUES ($1, $2, $3, $4, $5, $6)',
      [logId, user.company_id, user.id, 'Module Upgraded', `Unlocked module "${id}" to "${status}" status.`, new Date().toISOString()]
    );

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error(`API Error [PUT modules/${id}]:`, e);
    return NextResponse.json({ error: 'Failed to update module status' }, { status: 500 });
  }
}
