import { NextResponse } from 'next/server';
import { db, initDb } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-trackam-crm';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await initDb();
    const { id } = await params;
    const authHeader = request.headers.get('authorization');
    if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const token = authHeader.split(' ')[1];
    jwt.verify(token, JWT_SECRET);
    // You could optionally verify if the user's company owns the lead

    const result = await db.query('SELECT * FROM lead_activities WHERE lead_id = $1 ORDER BY created_at DESC', [id]);
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await initDb();
    const { id } = await params;
    const authHeader = request.headers.get('authorization');
    if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const token = authHeader.split(' ')[1];
    const payload = jwt.verify(token, JWT_SECRET) as any;

    const userResult = await db.query('SELECT name FROM users WHERE id = $1', [payload.id]);
    const user = userResult.rows[0] as { name: string } | undefined;
    const userName = user ? user.name : 'Unknown User';

    const body = await request.json();
    if (!body.content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    const activity = {
      id: uuidv4(),
      lead_id: id,
      user_id: payload.id as string,
      user_name: userName,
      content: body.content,
      created_at: new Date().toISOString()
    };

    await db.query(`
      INSERT INTO lead_activities (id, lead_id, user_id, user_name, content, created_at)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [activity.id, activity.lead_id, activity.user_id, activity.user_name, activity.content, activity.created_at]);

    return NextResponse.json(activity, { status: 201 });
  } catch (error: any) {
    console.error("POST activity error:", error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}

