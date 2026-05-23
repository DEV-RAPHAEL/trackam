import { NextResponse } from 'next/server';
import { db, initDb } from '@/lib/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-prod';

export async function POST(req: Request) {
  try {
    await initDb();
    const { email, password, subdomain } = await req.json();
    
    // ── Superadmin bypass (platform-level user, not tied to any company subdomain) ──
    const superAdminCheck = await db.query(
      `SELECT * FROM users WHERE email = $1 AND role = 'superadmin'`,
      [email]
    );
    if (superAdminCheck.rows.length > 0) {
      const saUser = superAdminCheck.rows[0] as any;
      const valid = await bcrypt.compare(password, saUser.password || '');
      if (!valid) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
      const token = jwt.sign({ id: saUser.id, company_id: saUser.company_id, role: saUser.role }, JWT_SECRET, { expiresIn: '24h' });
      return NextResponse.json({ user: saUser, company: { id: 'platform', name: 'Platform Admin', subdomain: 'platform', status: 'active', onboarding_step: 'done' }, token });
    }

    let user = null;
    let comp = null;
    
    if (subdomain) {
      // Find the user for the specific subdomain
      const r = await db.query(
        `SELECT u.* FROM users u 
         JOIN companies c ON u.company_id = c.id 
         WHERE u.email = $1 AND c.subdomain = $2`, 
        [email, subdomain]
      );
      if (r.rows.length > 0) {
        user = r.rows[0];
        const cr = await db.query('SELECT * FROM companies WHERE id = $1', [(user as any).company_id]);
        comp = cr.rows[0];
      }
    } else {
      // Fallback: just find by email (for non-subdomain login, if ever used)
      const r = await db.query('SELECT * FROM users WHERE email = $1', [email]);
      if (r.rows.length > 0) {
        user = r.rows[0];
        const cr = await db.query('SELECT * FROM companies WHERE id = $1', [(user as any).company_id]);
        comp = cr.rows[0];
      }
    }
    
    if (user && comp) {
      if (!user.password) {
        return NextResponse.json({ error: 'Account not set up. Please use your invite link to set a password.' }, { status: 401 });
      }

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
      }

      // Tenant Isolation Check (should be redundant if subdomain is checked in query, but good to keep)
      if (subdomain) {
        const companySubdomain = comp?.subdomain;
        if (!companySubdomain || companySubdomain !== subdomain) {
          return NextResponse.json({ error: 'Invalid credentials for this workspace.' }, { status: 401 });
        }
      }

      const token = jwt.sign({ id: user.id, company_id: user.company_id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
      
      return NextResponse.json({ user, company: comp, token });
    } else {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }
  } catch (e: any) {
    if (e?.name === 'JsonWebTokenError' || e?.name === 'TokenExpiredError') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
