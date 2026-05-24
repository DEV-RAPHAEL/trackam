import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { db } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-prod';

export interface AuthUser {
  id: string;
  company_id: string;
  email: string;
  role: string;
}

export async function verifyAuth(req: Request): Promise<{ user: AuthUser | null; errorResponse: NextResponse | null }> {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.split(' ')[1];

  if (!token) {
    return { 
      user: null, 
      errorResponse: NextResponse.json({ error: 'Unauthorized: No token provided' }, { status: 401 }) 
    };
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    return { user: decoded, errorResponse: null };
  } catch (e: any) {
    const status = (e?.name === 'JsonWebTokenError' || e?.name === 'TokenExpiredError') ? 401 : 500;
    return { 
      user: null, 
      errorResponse: NextResponse.json({ error: `Unauthorized: ${e.message}` }, { status }) 
    };
  }
}

export async function verifyOwnership(table: string, id: string, companyId: string): Promise<boolean> {
  try {
    const result = await db.query(`SELECT company_id FROM ${table} WHERE id = $1`, [id]);
    return result.rows.length > 0 && (result.rows[0] as any).company_id === companyId;
  } catch (e) {
    console.error(`Ownership check failed for ${table}:${id}`, e);
    return false;
  }
}

