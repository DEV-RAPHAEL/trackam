import { NextResponse } from 'next/server';
import { db, initDb } from '@/lib/db';

export async function GET(req: Request, { params }: { params: { subdomain: string } }) {
  try {
    await initDb();
    // Resolve the promise if using Next.js 15+ dynamic params
    const { subdomain } = await Promise.resolve(params);

    if (!subdomain) {
      return NextResponse.json({ error: 'Subdomain required' }, { status: 400 });
    }

    const r = await db.query(
      'SELECT name, brand_color, logo FROM companies WHERE subdomain = $1 LIMIT 1',
      [subdomain]
    );

    if (r.rows.length === 0) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    return NextResponse.json(r.rows[0]);
  } catch (e: any) {
    console.error('Tenant API error:', e);
    return NextResponse.json({ error: 'Failed to load tenant' }, { status: 500 });
  }
}
