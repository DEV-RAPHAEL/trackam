import { NextResponse } from 'next/server';
import { db, initDb } from '@/lib/db';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-prod';

export async function POST(req: Request, { params }: { params: Promise<{ companyId: string }> }) {
  const { companyId } = await params;
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.split(' ')[1];
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    jwt.verify(token, JWT_SECRET);
    await initDb();

    // Seed some initial data
    const now = new Date().toISOString();

    // 1. Clients
    const clients = [
      { id: uuidv4(), name: 'Dangote Group', email: 'procurement@dangote.com', status: 'active' },
      { id: uuidv4(), name: 'Globacom Limited', email: 'info@gloworld.com', status: 'active' },
      { id: uuidv4(), name: 'Interswitch', email: 'sales@interswitch.com', status: 'inactive' }
    ];

    for (const c of clients) {
      await db.query(
        'INSERT INTO clients (id, company_id, name, email, phone, company, status, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
        [c.id, companyId, c.name, c.email, '+234 1 000 0000', c.name, c.status, now]
      );
    }

    // 2. Leads
    const leads = [
      { id: uuidv4(), name: 'Tony Elumelu', email: 'tony@heirsholdings.com', status: 'New', source: 'Website', value: 1500000 },
      { id: uuidv4(), name: 'Femi Otedola', email: 'femi@gereregu.com', status: 'Contacted', source: 'Referral', value: 2500000 }
    ];

    for (const l of leads) {
      await db.query(
        'INSERT INTO leads (id, company_id, name, email, phone, status, source, value, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
        [l.id, companyId, l.name, l.email, '+234 800 000 0000', l.status, l.source, l.value, now]
      );
    }

    // 3. Deals
    await db.query(
      'INSERT INTO deals (id, company_id, client_id, title, value, stage, probability, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
      [uuidv4(), companyId, clients[0].id, 'Enterprise CRM Suite', 1200000, 'Prospecting', 60, now]
    );

    // 4. Tasks
    await db.query(
      'INSERT INTO tasks (id, company_id, title, description, status, priority, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [uuidv4(), companyId, 'Follow up with Dangote', 'Send the final proposal for the CRM suite.', 'pending', 'high', now]
    );

    return NextResponse.json({ success: true });
  } catch (e: any) {
    if (e?.name === 'JsonWebTokenError' || e?.name === 'TokenExpiredError') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
