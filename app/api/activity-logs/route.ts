import { NextResponse } from 'next/server';
import { db, initDb } from '@/lib/db';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-prod';

export async function POST(req: Request) {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.split(' ')[1];
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const user: any = jwt.verify(token, JWT_SECRET);
    await initDb();
    const body = await req.json();
    const table_name = 'activity_logs';
    
    
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
    if (e?.name === 'JsonWebTokenError' || e?.name === 'TokenExpiredError') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
