/**
 * lib/email-templates.ts
 *
 * Branded HTML email templates for all Trackam CRM transactional emails.
 * All templates are mobile-responsive and feature the Trackam purple palette.
 */

const BRAND_COLOR = '#7C3AED';
const BRAND_LIGHT = '#EDE9FE';
const TEXT_DARK = '#0F172A';
const TEXT_MUTED = '#64748B';
const BORDER = '#E2E8F0';

function baseTemplate(content: string, previewText: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${previewText}</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
</head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <!-- Preview text (hidden) -->
  <span style="display:none;font-size:1px;color:#F8FAFC;max-height:0;max-width:0;opacity:0;overflow:hidden;">${previewText}</span>

  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#F8FAFC;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#7C3AED 0%,#5B21B6 100%);border-radius:16px 16px 0 0;padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#FFFFFF;font-size:28px;font-weight:800;letter-spacing:-0.5px;">
                Track<span style="color:#C4B5FD;">am</span>
              </h1>
              <p style="margin:4px 0 0;color:#DDD6FE;font-size:13px;letter-spacing:1px;text-transform:uppercase;">Nigeria's Premier CRM Platform</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:#FFFFFF;padding:40px;border-left:1px solid ${BORDER};border-right:1px solid ${BORDER};">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#F1F5F9;border-radius:0 0 16px 16px;border:1px solid ${BORDER};border-top:none;padding:24px 40px;text-align:center;">
              <p style="margin:0 0 8px;color:${TEXT_MUTED};font-size:12px;">© ${new Date().getFullYear()} Trackam CRM. All rights reserved.</p>
              <p style="margin:0;color:${TEXT_MUTED};font-size:12px;">32, Admiralty Way, Lekki Phase 1, Lagos, Nigeria</p>
              <p style="margin:12px 0 0;color:#94A3B8;font-size:11px;">If you didn't request this email, you can safely ignore it. Your account remains secure.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function otpBlock(code: string, expiryMinutes = 10): string {
  const digits = code.split('').map(d =>
    `<span style="display:inline-block;width:48px;height:60px;line-height:60px;background:${BRAND_LIGHT};border:2px solid ${BRAND_COLOR};border-radius:10px;font-size:28px;font-weight:800;color:${BRAND_COLOR};text-align:center;margin:0 4px;">${d}</span>`
  ).join('');

  return `
    <div style="text-align:center;margin:32px 0;">
      <div style="margin-bottom:12px;">${digits}</div>
      <p style="margin:12px 0 0;color:${TEXT_MUTED};font-size:13px;">
        ⏱ This code expires in <strong>${expiryMinutes} minutes</strong>. Do not share it with anyone.
      </p>
    </div>
  `;
}

function ctaButton(label: string, url: string): string {
  return `
    <div style="text-align:center;margin:32px 0;">
      <a href="${url}" style="display:inline-block;background:linear-gradient(135deg,#7C3AED,#5B21B6);color:#FFFFFF;text-decoration:none;padding:14px 36px;border-radius:8px;font-size:16px;font-weight:700;letter-spacing:0.3px;">
        ${label} →
      </a>
    </div>
  `;
}

// ─── Templates ───────────────────────────────────────────────────────────────

/**
 * Welcome email sent after a new workspace is registered.
 * Includes email verification OTP.
 */
export function welcomeEmail(params: {
  name: string;
  companyName: string;
  workspaceUrl: string;
  otpCode: string;
}): string {
  const content = `
    <h2 style="margin:0 0 8px;color:${TEXT_DARK};font-size:24px;font-weight:700;">Welcome to Trackam, ${params.name}! 🎉</h2>
    <p style="margin:0 0 24px;color:${TEXT_MUTED};font-size:15px;line-height:1.6;">
      Your workspace <strong style="color:${TEXT_DARK};">${params.companyName}</strong> is ready. Before you dive in, please verify your email address using the code below:
    </p>

    ${otpBlock(params.otpCode)}

    <div style="background:${BRAND_LIGHT};border-radius:10px;padding:20px 24px;margin:24px 0;">
      <p style="margin:0 0 6px;color:${TEXT_MUTED};font-size:13px;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">Your Workspace URL</p>
      <a href="${params.workspaceUrl}" style="color:${BRAND_COLOR};font-size:15px;font-weight:600;word-break:break-all;">${params.workspaceUrl}</a>
    </div>

    ${ctaButton('Go to My Workspace', params.workspaceUrl)}

    <p style="color:${TEXT_MUTED};font-size:14px;line-height:1.6;">
      You're on a <strong>7-day free trial</strong>. Explore every feature — no credit card needed yet.
    </p>
  `;
  return baseTemplate(content, `Welcome to Trackam — verify your email to get started`);
}

/**
 * Login OTP email — sent after successful password, before granting access.
 */
export function loginOtpEmail(params: {
  name: string;
  otpCode: string;
  ipAddress?: string;
}): string {
  const content = `
    <h2 style="margin:0 0 8px;color:${TEXT_DARK};font-size:24px;font-weight:700;">Your Login Code 🔐</h2>
    <p style="margin:0 0 8px;color:${TEXT_MUTED};font-size:15px;line-height:1.6;">
      Hi <strong style="color:${TEXT_DARK};">${params.name}</strong>, someone (hopefully you!) is signing into your Trackam account.
    </p>
    <p style="margin:0 0 24px;color:${TEXT_MUTED};font-size:15px;line-height:1.6;">
      Enter this one-time code to complete your login:
    </p>

    ${otpBlock(params.otpCode)}

    ${params.ipAddress ? `
    <div style="background:#FEF2F2;border:1px solid #FECACA;border-radius:8px;padding:12px 16px;margin:16px 0;">
      <p style="margin:0;color:#991B1B;font-size:13px;">
        🌐 Login attempt from IP: <strong>${params.ipAddress}</strong><br/>
        If this wasn't you, change your password immediately.
      </p>
    </div>` : ''}

    <p style="color:${TEXT_MUTED};font-size:13px;margin-top:24px;">
      Never share this code with anyone — including Trackam support.
    </p>
  `;
  return baseTemplate(content, `Your Trackam login verification code`);
}

/**
 * Password reset OTP email.
 */
export function passwordResetEmail(params: {
  name: string;
  otpCode: string;
}): string {
  const content = `
    <h2 style="margin:0 0 8px;color:${TEXT_DARK};font-size:24px;font-weight:700;">Reset Your Password 🔑</h2>
    <p style="margin:0 0 24px;color:${TEXT_MUTED};font-size:15px;line-height:1.6;">
      Hi <strong style="color:${TEXT_DARK};">${params.name}</strong>, we received a request to reset your Trackam password.
      Use the code below to proceed:
    </p>

    ${otpBlock(params.otpCode)}

    <div style="background:#FEF2F2;border:1px solid #FECACA;border-radius:8px;padding:12px 16px;margin:16px 0;">
      <p style="margin:0;color:#991B1B;font-size:13px;">
        ⚠️ If you didn't request this password reset, your account may be at risk. 
        Contact us immediately at <a href="mailto:security@trackam.com.ng" style="color:#991B1B;">security@trackam.com.ng</a>
      </p>
    </div>
  `;
  return baseTemplate(content, `Reset your Trackam password`);
}

/**
 * Team member invite email — sent when an admin adds a new user.
 */
export function inviteEmail(params: {
  name: string;
  inviterName: string;
  companyName: string;
  role: string;
  inviteUrl: string;
}): string {
  const content = `
    <h2 style="margin:0 0 8px;color:${TEXT_DARK};font-size:24px;font-weight:700;">You're Invited! 🙌</h2>
    <p style="margin:0 0 24px;color:${TEXT_MUTED};font-size:15px;line-height:1.6;">
      Hi <strong style="color:${TEXT_DARK};">${params.name}</strong>, <strong>${params.inviterName}</strong> has invited you to join 
      <strong style="color:${BRAND_COLOR};">${params.companyName}</strong>'s workspace on Trackam CRM as a 
      <strong style="text-transform:capitalize;">${params.role}</strong>.
    </p>

    <div style="background:${BRAND_LIGHT};border-radius:10px;padding:20px 24px;margin:24px 0;">
      <p style="margin:0 0 6px;color:${TEXT_MUTED};font-size:13px;font-weight:600;">What is Trackam?</p>
      <p style="margin:0;color:${TEXT_DARK};font-size:14px;line-height:1.6;">
        Nigeria's premier CRM platform — manage clients, track deals, send professional invoices, and collaborate with your team in real time.
      </p>
    </div>

    ${ctaButton('Accept Invitation & Set Password', params.inviteUrl)}

    <p style="color:${TEXT_MUTED};font-size:13px;margin-top:0;">
      ⏱ This invitation link expires in <strong>72 hours</strong>.
    </p>
  `;
  return baseTemplate(content, `${params.inviterName} invited you to join ${params.companyName} on Trackam`);
}

/**
 * Email verified confirmation — sent after user verifies their email.
 */
export function emailVerifiedEmail(params: {
  name: string;
  companyName: string;
  workspaceUrl: string;
}): string {
  const content = `
    <div style="text-align:center;margin-bottom:24px;">
      <div style="display:inline-block;width:64px;height:64px;background:${BRAND_LIGHT};border-radius:50%;line-height:64px;font-size:32px;">✅</div>
    </div>
    <h2 style="margin:0 0 8px;color:${TEXT_DARK};font-size:24px;font-weight:700;text-align:center;">Email Verified!</h2>
    <p style="margin:0 0 24px;color:${TEXT_MUTED};font-size:15px;line-height:1.6;text-align:center;">
      Hi <strong style="color:${TEXT_DARK};">${params.name}</strong>, your email has been verified and your 
      <strong>${params.companyName}</strong> workspace is fully active.
    </p>

    ${ctaButton('Go to Dashboard', params.workspaceUrl)}
  `;
  return baseTemplate(content, `Your Trackam email has been verified`);
}
