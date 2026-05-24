import { NextResponse } from 'next/server';
import { db, initDb } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

export async function GET() {
  try {
    await initDb();
    const result = await db.query('SELECT * FROM site_settings');
    const settings: Record<string, string> = {};
    result.rows.forEach((row: any) => {
      settings[row.key] = row.value;
    });

    return NextResponse.json(settings);
  } catch (e: any) {
    console.error('Failed to load site settings:', e);
    return NextResponse.json({ error: 'Failed to load site settings' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const { user, errorResponse } = await verifyAuth(req);
  if (errorResponse) return errorResponse;

  if (user?.role !== 'superadmin') {
    return NextResponse.json({ error: 'Unauthorized: Restricted Administration Control' }, { status: 403 });
  }

  try {
    await initDb();
    const body = await req.json();

    // Iterate through key-values and upsert
    for (const [key, value] of Object.entries(body)) {
      if (typeof key !== 'string' || typeof value !== 'string') continue;
      await db.query(`
        INSERT INTO site_settings (key, value)
        VALUES ($1, $2)
        ON CONFLICT(key) DO UPDATE SET value = $2
      `, [key, value]);
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error('Failed to save site settings:', e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
