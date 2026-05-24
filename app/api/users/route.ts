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
    const table_name = 'users';
    
    
    // SECURITY PATCH: Prevent Mass Assignment & IDOR payload injection
    const providedId = body.id || crypto.randomUUID();
    delete body.id;
    delete body.company_id;
    delete body.created_at;

    if (body.email) {
      const emailCheck = await db.query('SELECT id FROM users WHERE email = $1', [body.email]);
      if (emailCheck.rows.length > 0) {
        return NextResponse.json({ error: 'This email is already in use.' }, { status: 400 });
      }
    }
    
    if (body.name) {
      const nameCheck = await db.query('SELECT id FROM users WHERE name = $1', [body.name]);
      if (nameCheck.rows.length > 0) {
        return NextResponse.json({ error: 'This username is already taken.' }, { status: 400 });
      }
    }

    body.id = providedId;
    body.company_id = user.company_id; // securely force the company_id from JWT
    
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
