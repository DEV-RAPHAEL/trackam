import { NextResponse } from 'next/server';
import { db, initDb } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

export async function GET(req: Request, { params }: { params: Promise<{ companyId: string }> }) {
  const { companyId } = await params;
  const { user, errorResponse } = await verifyAuth(req);
  if (errorResponse) return errorResponse;

  if (user?.company_id !== companyId && user?.role !== 'superadmin') {
    return NextResponse.json({ error: 'Unauthorized: Company mismatch' }, { status: 403 });
  }

  try {
    await initDb();
    
    const [clients, leads, deals, tasks, invoices] = await Promise.all([
      db.query('SELECT COUNT(*) FROM clients WHERE company_id = $1', [companyId]),
      db.query('SELECT COUNT(*) FROM leads WHERE company_id = $1', [companyId]),
      db.query('SELECT COUNT(*) FROM deals WHERE company_id = $1', [companyId]),
      db.query('SELECT COUNT(*) FROM tasks WHERE company_id = $1', [companyId]),
      user?.role === 'user'
        ? db.query('SELECT * FROM invoices WHERE company_id = $1 AND created_by = $2', [companyId, user.id])
        : db.query('SELECT * FROM invoices WHERE company_id = $1', [companyId])
    ]);

    const getEffectiveStatus = (i: any) => {
      if (i.type === 'retainer' && i.status === 'unpaid' && i.due_date) {
        const now = new Date();
        const dueDate = new Date(i.due_date);
        const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const dueMonthStart = new Date(dueDate.getFullYear(), dueDate.getMonth(), 1);
        if (dueMonthStart > currentMonthStart) {
          return 'paid';
        }
      }
      return i.status;
    };

    const totalRevenue = invoices.rows.filter((i: any) => getEffectiveStatus(i) === 'paid').reduce((s: number, i: any) => s + (Number(i.amount) || 0), 0);
    const pendingRevenue = invoices.rows.filter((i: any) => getEffectiveStatus(i) === 'unpaid').reduce((s: number, i: any) => s + (Number(i.amount) || 0), 0);

    return NextResponse.json({
      summary: {
        clients: parseInt((clients.rows[0] as any).count),
        leads: parseInt((leads.rows[0] as any).count),
        deals: parseInt((deals.rows[0] as any).count),
        tasks: parseInt((tasks.rows[0] as any).count),
        revenue: totalRevenue,
        pendingRevenue
      }
    });
  } catch (e: any) {
    console.error(`API Error [analytics/${companyId}]:`, e);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}

