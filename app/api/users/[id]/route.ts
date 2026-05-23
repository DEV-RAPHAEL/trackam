import { NextResponse } from 'next/server';
import { db, initDb } from '@/lib/db';
import { verifyAuth, verifyOwnership } from '@/lib/auth';

const table_name = 'users';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user, errorResponse } = await verifyAuth(req);
  if (errorResponse) return errorResponse;

  try {
    await initDb();
    
    // Ownership check: users are tied to companies. 
    // Usually only admins or the user themselves can update their profile.
    const isOwner = await verifyOwnership(table_name, id, user!.company_id);
    if (!isOwner && user?.role !== 'superadmin') {
      return NextResponse.json({ error: 'Unauthorized: User mismatch' }, { status: 403 });
    }

    const body = await req.json();
    // Prevent role escalation if not admin
    if (body.role && user?.role !== 'superadmin' && user?.role !== 'owner') {
      delete body.role;
    }
    // Never update password through this generic endpoint
    delete body.password;

    
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
    console.error(`API Error [PUT users/${id}]:`, e);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user, errorResponse } = await verifyAuth(req);
  if (errorResponse) return errorResponse;

  try {
    await initDb();
    
    // Only admins/owners can delete users
    if (user?.role !== 'superadmin' && user?.role !== 'owner') {
       return NextResponse.json({ error: 'Unauthorized: Insufficient permissions' }, { status: 403 });
    }

    const isOwner = await verifyOwnership(table_name, id, user!.company_id);
    if (!isOwner) {
      return NextResponse.json({ error: 'Unauthorized: User mismatch' }, { status: 403 });
    }

    await db.query(`DELETE FROM ${table_name} WHERE id = $1`, [id]);
    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error(`API Error [DELETE users/${id}]:`, e);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}

