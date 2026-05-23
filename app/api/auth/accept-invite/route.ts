import { NextResponse } from 'next/server';
import { db, initDb } from '@/lib/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-prod';

export async function POST(req: Request) {
  try {
    await initDb();
    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json({ error: 'Token and password are required' }, { status: 400 });
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err: any) {
      return NextResponse.json({ error: 'Invalid or expired invite link' }, { status: 401 });
    }
    
    const userResult = await db.query('SELECT * FROM users WHERE email = $1 AND company_id = $2', [decoded.email, decoded.company_id]);
    
    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = userResult.rows[0];
    
    if (user.password) {
      return NextResponse.json({ error: 'Account is already fully set up. Please log in directly.' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, user.id]);

    const companyResult = await db.query('SELECT * FROM companies WHERE id = $1', [user.company_id]);

    const newToken = jwt.sign({ id: user.id, company_id: user.company_id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    
    // Omit returning the password hash back to the client
    const safeUser = { ...user };
    delete safeUser.password;

    return NextResponse.json({ success: true, user: safeUser, company: companyResult.rows[0], token: newToken });
  } catch (e: any) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
