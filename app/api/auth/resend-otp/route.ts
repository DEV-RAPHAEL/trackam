import { NextResponse } from 'next/server';
import { db, initDb } from '@/lib/db';
import { createOtp } from '@/lib/otp';
import { sendEmail } from '@/lib/mailer';
import { loginOtpEmail, welcomeEmail } from '@/lib/email-templates';
import { getClientIp } from '@/lib/rate-limit';

export async function POST(req: Request) {
  try {
    await initDb();
    const ip = getClientIp(req);
    const { email, type } = await req.json();

    if (!email || !type) {
      return NextResponse.json({ error: 'Email and type are required' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Find the user by lowercased email
    const userResult = await db.query('SELECT * FROM users WHERE LOWER(email) = $1', [cleanEmail]);
    if (userResult.rows.length === 0) {
      // Return 200 even if email not found to prevent user enumeration
      return NextResponse.json({ success: true, message: 'If an account exists, a new code has been sent.' });
    }

    const user = userResult.rows[0] as any;

    if (type === 'login_otp') {
      const { code } = await createOtp(user.email, 'login_otp', user.id);
      await sendEmail({
        to: user.email,
        subject: '🔐 Your Trackam Login Code (Resend)',
        html: loginOtpEmail({ name: user.name, otpCode: code, ipAddress: ip }),
      });
    } else if (type === 'email_verify') {
      const { code } = await createOtp(user.email, 'email_verify', user.id);
      
      const companyResult = await db.query('SELECT * FROM companies WHERE id = $1', [user.company_id]);
      const company = companyResult.rows[0] as any;
      const workspaceUrl = `https://${company?.subdomain}.trackam.com.ng`;

      await sendEmail({
        to: user.email,
        subject: '🎉 Trackam Verification Code (Resend)',
        html: welcomeEmail({
          name: user.name,
          companyName: company?.name || 'your company',
          workspaceUrl,
          otpCode: code,
        }),
      });
    } else {
      return NextResponse.json({ error: 'Invalid OTP type for resend' }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: 'A new code has been sent to your email.' });
  } catch (e: any) {
    console.error('resend-otp error:', e);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
