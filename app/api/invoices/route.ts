import { NextResponse } from 'next/server';
import { db, initDb } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

const table_name = 'invoices';

export async function POST(req: Request) {
  const { user, errorResponse } = await verifyAuth(req);
  if (errorResponse) return errorResponse;

  try {
    await initDb();
    const rawBody = await req.json();
    
    // Whitelist valid DB columns
    const ALLOWED_COLUMNS = ['id', 'company_id', 'client_id', 'amount', 'status', 'due_date', 'items', 'created_at'];
    const body: Record<string, any> = {};
    
    for (const key of ALLOWED_COLUMNS) {
      if (rawBody[key] !== undefined) {
        body[key] = rawBody[key];
      }
    }

    // Security: Enforce user's company_id
    body.company_id = user!.company_id;
    
    // Format items as string for SQLite compatibility
    if (body.items && typeof body.items !== 'string') {
      body.items = JSON.stringify(body.items);
    }

    
    // SECURITY PATCH: Prevent Mass Assignment & IDOR payload injection
    delete body.id;
    delete body.company_id;
    delete body.created_at;

    const keys = Object.keys(body);
    const values = Object.values(body);
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
    
    await db.query(`INSERT INTO ${table_name} (${keys.join(', ')}) VALUES (${placeholders})`, values);
    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error(`API Error [POST ${table_name}]:`, e);
    return NextResponse.json({ error: `Failed to create ${table_name}` }, { status: 500 });
  }
}

