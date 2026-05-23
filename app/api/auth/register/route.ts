import { NextResponse } from 'next/server';
import { db, initDb } from '@/lib/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-prod';

export async function POST(req: Request) {
  try {
    await initDb();
    const { company_id, user_id, company_name, user_name, email, password, role } = await req.json();
    
    // Uniqueness Checks
    const emailCheck = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (emailCheck.rows.length > 0) {
      return NextResponse.json({ error: 'This email is already in use.' }, { status: 400 });
    }

    const usernameCheck = await db.query('SELECT id FROM users WHERE name = $1', [user_name]);
    if (usernameCheck.rows.length > 0) {
      return NextResponse.json({ error: 'This username is already taken.' }, { status: 400 });
    }

    const companyCheck = await db.query('SELECT id FROM companies WHERE name = $1', [company_name]);
    if (companyCheck.rows.length > 0) {
      return NextResponse.json({ error: 'A company with this name already exists.' }, { status: 400 });
    }

    const subdomain = company_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const subdomainCheck = await db.query('SELECT id FROM companies WHERE subdomain = $1', [subdomain]);
    if (subdomainCheck.rows.length > 0) {
      return NextResponse.json({ error: 'This workspace subdomain is already taken.' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password || 'password123', 10);
    const trialEndsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    
    await db.query('INSERT INTO companies (id, name, status, onboarding_step, trial_ends_at, subscription_status, subdomain) VALUES ($1, $2, $3, $4, $5, $6, $7)', [company_id, company_name, 'inactive', 'payment', trialEndsAt, 'trialing', subdomain]);
    await db.query('INSERT INTO users (id, company_id, name, email, password, role) VALUES ($1, $2, $3, $4, $5, $6)', [user_id, company_id, user_name, email, hashedPassword, role]);
    
    const token = jwt.sign({ id: user_id, company_id, role }, JWT_SECRET, { expiresIn: '24h' });
    
    return NextResponse.json({ success: true, token });
  } catch (e: any) {
    if (e?.name === 'JsonWebTokenError' || e?.name === 'TokenExpiredError') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
