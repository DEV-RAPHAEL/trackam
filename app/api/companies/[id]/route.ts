import { NextResponse } from 'next/server';
import { db, initDb } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user, errorResponse } = await verifyAuth(req);
  if (errorResponse) return errorResponse;

  // Security: Ensure user belongs to the company they are trying to update
  if (user?.company_id !== id && user?.role !== 'superadmin') {
    return NextResponse.json({ error: 'Unauthorized: Company mismatch' }, { status: 403 });
  }

  try {
    await initDb();
    const body = await req.json();

    
    // SECURITY PATCH: Prevent Mass Assignment & IDOR payload injection
    delete body.id;
    delete body.company_id;
    delete body.created_at;

    if (body.subdomain !== undefined) {
      const sub = String(body.subdomain).trim().toLowerCase().replace(/[^a-z0-9-]+/g, '').replace(/(^-|-$)/g, '');
      if (!sub) {
        return NextResponse.json({ error: 'Invalid subdomain format' }, { status: 400 });
      }
      
      const restricted = ['www', 'demo', 'platform', 'admin', 'api', 'superadmin', 'mail'];
      if (restricted.includes(sub)) {
        return NextResponse.json({ error: 'This subdomain is reserved.' }, { status: 400 });
      }

      const subCheck = await db.query('SELECT id FROM companies WHERE subdomain = $1 AND id != $2', [sub, id]);
      if (subCheck.rows.length > 0) {
        return NextResponse.json({ error: 'This workspace subdomain is already taken.' }, { status: 400 });
      }
      body.subdomain = sub;
    }

    const keys = Object.keys(body);
    const values: unknown[] = Object.values(body);

    if (keys.length === 0) return NextResponse.json({ success: true });
    const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
    values.push(id);

    await db.query(`UPDATE companies SET ${setClause} WHERE id = $${values.length}`, values);
    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error(`API Error [PUT companies/${id}]:`, e);
    return NextResponse.json({ error: 'Failed to update company' }, { status: 500 });
  }
}

