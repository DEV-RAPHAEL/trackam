
import { Resend } from 'resend';
import nodemailer from 'nodemailer';

// Lazily initialized — reads env at call-time so hot-reloads pick up .env changes
let _transporter: any = null;
let _resend: Resend | null = null;
let _mailMode: 'smtp' | 'resend' | 'mock' | null = null;

function getMailer() {
  if (_mailMode) return; // already initialized

  const hasSmtp = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

  if (hasSmtp) {
    const isSecure = process.env.SMTP_SECURE === 'true' || process.env.SMTP_PORT === '465';
    _transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: isSecure,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
    _mailMode = 'smtp';
    console.log('✅ Mailer: Using SMTP');
    return;
  }

  if (process.env.RESEND_API_KEY) {
    _resend = new Resend(process.env.RESEND_API_KEY);
    _mailMode = 'resend';
    console.log('✅ Mailer: Using Resend API');
    return;
  }

  _mailMode = 'mock';
  console.log('⚠️  Mailer: MOCK mode (no SMTP or Resend key found)');
}

export interface EmailAttachment {
  filename: string;
  content: Buffer | string;
  contentType?: string;
}

export async function sendEmail({ 
  to, 
  subject, 
  html,
  attachments 
}: { 
  to: string; 
  subject: string; 
  html: string;
  attachments?: EmailAttachment[];
}) {
  getMailer(); // ensure initialized

  if (_mailMode === 'smtp' && _transporter) {
    try {
      const from = process.env.SMTP_FROM || `Trackam <${process.env.SMTP_USER}>`;
      console.log(`📧 SMTP → ${to}`);
      const info = await _transporter.sendMail({ 
        from, 
        to, 
        subject, 
        html,
        attachments: attachments?.map(att => ({
          filename: att.filename,
          content: att.content,
          contentType: att.contentType
        }))
      });
      console.log('✅ SMTP sent:', info.messageId);
      return { success: true, data: info };
    } catch (err) {
      console.error('❌ SMTP Error:', err);
      return { success: false, error: err };
    }
  }

  if (_mailMode === 'resend' && _resend) {
    try {
      const from = process.env.MAIL_FROM || 'Trackam <onboarding@resend.dev>';
      console.log(`📧 Resend → ${to}`);
      const { data, error } = await _resend.emails.send({ 
        from, 
        to: [to], 
        subject, 
        html,
        attachments: attachments?.map(att => ({
          filename: att.filename,
          content: typeof att.content === 'string' ? Buffer.from(att.content) : att.content
        }))
      });
      if (error) {
        console.error('❌ Resend Error:', error);
        return { success: false, error };
      }
      console.log('✅ Resend sent:', data?.id);
      return { success: true, data };
    } catch (err) {
      console.error('❌ Resend Exception:', err);
      return { success: false, error: err };
    }
  }

  // Mock mode
  console.log('--- MOCK EMAIL ---');
  console.log(`To: ${to}\nSubject: ${subject}`);
  if (attachments && attachments.length > 0) {
    console.log(`Attachments: ${attachments.map(a => a.filename).join(', ')}`);
  }
  console.log('-----------------');
  return { success: true, mock: true };
}
