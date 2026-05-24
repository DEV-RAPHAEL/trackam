import { NextResponse } from 'next/server';
import { db, initDb } from '@/lib/db';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-prod';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');
  
  if (!token) {
    return NextResponse.json({ error: 'Token is required' }, { status: 400 });
  }

  try {
    await initDb();
    const decoded: any = jwt.verify(token, JWT_SECRET);
    const userResult = await db.query('SELECT * FROM users WHERE email = $1 AND company_id = $2', [decoded.email, decoded.company_id]);
    
    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    const user = userResult.rows[0] as any;
    const companyResult = await db.query('SELECT * FROM companies WHERE id = $1', [user.company_id]);

    const newToken = jwt.sign({ id: user.id, company_id: user.company_id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    
    return NextResponse.json({ user, company: companyResult.rows[0], token: newToken });
  } catch (e) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
  }
}
