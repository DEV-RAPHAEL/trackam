import { NextResponse } from 'next/server';
import { db, initDb } from '@/lib/db';
import bcrypt from 'bcryptjs';

const DEMO_COMPANY_ID = 'demo-company-001';

const DEMO_USERS = [
  {
    id: 'demo-owner-001',
    name: 'Sarah Okonkwo',
    email: 'owner@demo.trackam.com',
    password: 'demo1234',
    role: 'owner',
  },
  {
    id: 'demo-admin-001',
    name: 'James Adeyemi',
    email: 'admin@demo.trackam.com',
    password: 'demo1234',
    role: 'admin',
  },
  {
    id: 'demo-staff-001',
    name: 'Amaka Eze',
    email: 'staff@demo.trackam.com',
    password: 'demo1234',
    role: 'user',
  },
];

export async function POST() {
  try {
    await initDb();

    // Check if demo company already exists
    const existing = await db.query('SELECT id FROM companies WHERE id = $1', [DEMO_COMPANY_ID]);
    if ((existing.rows as any[]).length > 0) {
      return NextResponse.json({ success: true, alreadySeeded: true });
    }

    // Create demo company
    await db.query(
      `INSERT INTO companies (id, name, status, onboarding_step, brand_color, email, phone, website, address, trial_ends_at, subscription_status, subdomain)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
      [
        DEMO_COMPANY_ID,
        'Trackam Demo Co.',
        'active',
        'done',
        '#4f46e5',
        'hello@democompany.com',
        '+234 801 000 0000',
        'www.democompany.com',
        '12 Marina Street, Lagos Island, Lagos',
        new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        'trialing',
        'democo'
      ]
    );

    // Create demo users
    for (const u of DEMO_USERS) {
      const hashed = await bcrypt.hash(u.password, 10);
      await db.query(
        `INSERT INTO users (id, company_id, name, email, password, role) VALUES ($1,$2,$3,$4,$5,$6)`,
        [u.id, DEMO_COMPANY_ID, u.name, u.email, hashed, u.role]
      );
    }

    const now = new Date().toISOString();
    const d = (days: number) => new Date(Date.now() + days * 86400000).toISOString();

    // Clients
    const clients = [
      ['client-d-001', 'Chidi Obi', 'chidi@obi.com', '0803 111 2222', 'Obi Ventures', 'active'],
      ['client-d-002', 'Ngozi Bello', 'ngozi@bello.ng', '0807 333 4444', 'Bello Group', 'active'],
      ['client-d-003', 'Emeka Nwosu', 'emeka@nwosu.io', '0809 555 6666', 'Nwosu Tech', 'inactive'],
      ['client-d-004', 'Aisha Mohammed', 'aisha@mohammed.biz', '0802 222 3333', 'Aisha Logistics', 'active'],
      ['client-d-005', 'Tunde Bakare', 'tunde@bakare.net', '0804 444 5555', 'Bakare Holdings', 'active'],
      ['client-d-006', 'Funke Akindele', 'funke@akindele.com', '0808 888 9999', 'SceneOne Prod', 'active'],
      ['client-d-007', 'Ibrahim Musa', 'ibrahim@musa.co', '0801 111 2222', 'Musa Agro', 'inactive'],
      ['client-d-008', 'Grace Johnson', 'grace@johnson.io', '0805 555 6666', 'Johnson Consulting', 'active'],
      ['client-d-009', 'Oluwaseun Ade', 'oluwaseun@ade.ng', '0810 000 1111', 'Ade Designs', 'active'],
      ['client-d-010', 'Zainab Ali', 'zainab@ali.biz', '0812 222 3333', 'Zainab Fashion', 'active']
    ];
    for (const [id, name, email, phone, company, status] of clients) {
      await db.query(
        `INSERT INTO clients (id, company_id, name, email, phone, company, status, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [id, DEMO_COMPANY_ID, name, email, phone, company, status, now]
      );
    }

    // Leads
    const leads = [
      ['lead-d-001', 'Tunde Fashola', 'tunde@fashola.com', '0805 777 8888', 'Fashola Ltd', 'Qualified'],
      ['lead-d-002', 'Bisi Alabi', 'bisi@alabi.ng', '0804 999 0000', 'Alabi Corp', 'New'],
      ['lead-d-003', 'Kola Martins', 'kola@martins.io', '0806 111 2222', 'Martins Global', 'Contacted'],
      ['lead-d-004', 'David Ojo', 'david@ojo.co', '0813 333 4444', 'Ojo Properties', 'Proposal'],
      ['lead-d-005', 'Mary Abiola', 'mary@abiola.com', '0814 444 5555', 'Abiola Ventures', 'New'],
      ['lead-d-006', 'Samuel Peters', 'samuel@peters.net', '0815 555 6666', 'Peters Logistics', 'Converted'],
      ['lead-d-007', 'Bola Ahmed', 'bola@ahmed.io', '0816 666 7777', 'Ahmed Holdings', 'Qualified'],
      ['lead-d-008', 'Nnamdi Kalu', 'nnamdi@kalu.biz', '0817 777 8888', 'Kalu Tech', 'Contacted'],
      ['lead-d-009', 'Ruth Emmanuel', 'ruth@emmanuel.ng', '0818 888 9999', 'Emmanuel Foods', 'New'],
      ['lead-d-010', 'Peter Obi', 'peter@obi.com', '0819 999 0000', 'Obi Traders', 'Proposal']
    ];
    for (const [id, name, email, phone, company, stage] of leads) {
      await db.query(
        `INSERT INTO leads (id, company_id, name, email, phone, company, stage, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [id, DEMO_COMPANY_ID, name, email, phone, company, stage, now]
      );
    }

    // Deals
    const deals = [
      ['deal-d-001', 'client-d-001', 'Annual CRM License', 1200000, 'Negotiation'],
      ['deal-d-002', 'client-d-002', 'E-commerce Platform Build', 850000, 'Prospect'],
      ['deal-d-003', 'client-d-003', 'Mobile App MVP', 600000, 'Won'],
      ['deal-d-004', 'client-d-004', 'Logistics Dashboard', 1500000, 'Proposal'],
      ['deal-d-005', 'client-d-005', 'Corporate Website', 450000, 'Won'],
      ['deal-d-006', 'client-d-006', 'Digital Marketing Retainer', 300000, 'Lost'],
      ['deal-d-007', 'client-d-008', 'IT Audit Services', 750000, 'Negotiation'],
      ['deal-d-008', 'client-d-009', 'Brand Identity Design', 200000, 'Prospect'],
      ['deal-d-009', 'client-d-010', 'Inventory System', 900000, 'Won'],
      ['deal-d-010', 'client-d-001', 'Server Maintenance (Q3)', 150000, 'Proposal']
    ];
    for (const [id, client_id, title, value, stage] of deals) {
      await db.query(
        `INSERT INTO deals (id, company_id, client_id, title, value, stage, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [id, DEMO_COMPANY_ID, client_id, title, value, stage, now]
      );
    }

    // Tasks
    const tasks = [
      ['task-d-001', 'demo-admin-001', 'Send proposal to Chidi Obi', 'todo', 'high', d(2)],
      ['task-d-002', 'demo-staff-001', 'Follow up on Fashola lead', 'in_progress', 'medium', d(1)],
      ['task-d-003', 'demo-owner-001', 'Review Q2 revenue report', 'todo', 'high', d(3)],
      ['task-d-004', 'demo-staff-001', 'Update Nwosu Tech profile', 'done', 'low', d(-1)],
      ['task-d-005', 'demo-admin-001', 'Draft contract for Aisha', 'todo', 'high', d(1)],
      ['task-d-006', 'demo-owner-001', 'Prepare presentation for Bakare', 'in_progress', 'medium', d(4)],
      ['task-d-007', 'demo-staff-001', 'Call Zainab regarding invoice', 'todo', 'medium', d(0)],
      ['task-d-008', 'demo-admin-001', 'Renew domain names', 'done', 'low', d(-3)],
      ['task-d-009', 'demo-owner-001', 'Onboard new developer', 'todo', 'high', d(5)],
      ['task-d-010', 'demo-staff-001', 'Send weekly update to clients', 'in_progress', 'medium', d(2)]
    ];
    for (const [id, assigned_to, title, status, priority, due_date] of tasks) {
      await db.query(
        `INSERT INTO tasks (id, company_id, title, description, due_date, status, priority, assigned_to, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [id, DEMO_COMPANY_ID, title, '', due_date, status, priority, assigned_to, now]
      );
    }

    // Invoices
    const invoices = [
      ['inv-d-001', 'client-d-001', 1200000, 'paid', d(30), JSON.stringify([{ description: 'CRM License', qty: 1, price: 1200000 }])],
      ['inv-d-002', 'client-d-002', 850000, 'unpaid', d(14), JSON.stringify([{ description: 'E-commerce Platform', qty: 1, price: 850000 }])],
      ['inv-d-003', 'client-d-003', 300000, 'unpaid', d(7), JSON.stringify([{ description: 'MVP Phase 1', qty: 1, price: 300000 }])],
      ['inv-d-004', 'client-d-004', 1500000, 'overdue', d(-5), JSON.stringify([{ description: 'Logistics Dashboard', qty: 1, price: 1500000 }])],
      ['inv-d-005', 'client-d-005', 450000, 'paid', d(-20), JSON.stringify([{ description: 'Corporate Website', qty: 1, price: 450000 }])],
      ['inv-d-006', 'client-d-008', 750000, 'unpaid', d(21), JSON.stringify([{ description: 'IT Audit Services', qty: 1, price: 750000 }])],
      ['inv-d-007', 'client-d-009', 200000, 'paid', d(-10), JSON.stringify([{ description: 'Brand Identity Design', qty: 1, price: 200000 }])],
      ['inv-d-008', 'client-d-010', 900000, 'unpaid', d(15), JSON.stringify([{ description: 'Inventory System', qty: 1, price: 900000 }])],
      ['inv-d-009', 'client-d-001', 150000, 'draft', d(45), JSON.stringify([{ description: 'Server Maintenance', qty: 1, price: 150000 }])],
      ['inv-d-010', 'client-d-002', 250000, 'overdue', d(-2), JSON.stringify([{ description: 'SEO Optimization', qty: 1, price: 250000 }])]
    ];
    for (const [id, client_id, amount, status, due_date, items] of invoices) {
      await db.query(
        `INSERT INTO invoices (id, company_id, client_id, amount, status, due_date, items, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [id, DEMO_COMPANY_ID, client_id, amount, status, due_date, items, now]
      );
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error('Demo seed error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
