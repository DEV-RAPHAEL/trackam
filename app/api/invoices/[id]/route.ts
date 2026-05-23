import { NextResponse } from 'next/server';
import { db, initDb } from '@/lib/db';
import { verifyAuth, verifyOwnership } from '@/lib/auth';

const table_name = 'invoices';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user, errorResponse } = await verifyAuth(req);
  if (errorResponse) return errorResponse;

  try {
    await initDb();
    
    // Ownership check
    const isOwner = await verifyOwnership(table_name, id, user!.company_id);
    if (!isOwner && user?.role !== 'superadmin') {
      return NextResponse.json({ error: 'Unauthorized: Record mismatch' }, { status: 403 });
    }

    const body = await req.json();
    
    // Format items as string for PGlite compatibility if present
    if (body.items && typeof body.items !== 'string') {
      body.items = JSON.stringify(body.items);
    }

    
    // SECURITY PATCH: Prevent Mass Assignment & IDOR payload injection
    delete body.id;
    delete body.company_id;
    delete body.created_at;

    const keys = Object.keys(body);
    const values = Object.values(body);
    
    if (keys.length === 0) return NextResponse.json({ success: true });
    const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
    values.push(id);

    await db.query(`UPDATE ${table_name} SET ${setClause} WHERE id = $${values.length}`, values);
    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error(`API Error [PUT invoices/${id}]:`, e);
    return NextResponse.json({ error: 'Failed to update invoice' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user, errorResponse } = await verifyAuth(req);
  if (errorResponse) return errorResponse;

  try {
    await initDb();
    
    // Ownership check
    const isOwner = await verifyOwnership(table_name, id, user!.company_id);
    if (!isOwner && user?.role !== 'superadmin') {
      return NextResponse.json({ error: 'Unauthorized: Record mismatch' }, { status: 403 });
    }

    await db.query(`DELETE FROM ${table_name} WHERE id = $1`, [id]);
    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error(`API Error [DELETE invoices/${id}]:`, e);
    return NextResponse.json({ error: 'Failed to delete invoice' }, { status: 500 });
  }
}

