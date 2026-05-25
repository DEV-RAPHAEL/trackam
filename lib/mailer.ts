import { Resend } from "resend";

// Lazily initialized — reads env at call-time so hot-reloads pick up .env changes
let _resend: Resend | null = null;
let _mailMode: "resend" | "mock" | null = null;

function getMailer() {
  if (_mailMode) return; // already initialized

  const apiKey = process.env.RESEND_API_KEY;
  if (
    apiKey &&
    apiKey !== "re_REPLACE_WITH_NEW_KEY_AFTER_ROTATING" &&
    apiKey.trim() !== ""
  ) {
    _resend = new Resend(apiKey);
    _mailMode = "resend";
    console.log("✅ Mailer: Using Resend API only");
    return;
  }

  _mailMode = "mock";
  console.log("⚠️  Mailer: MOCK mode (no Resend API key configured)");
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
  attachments,
}: {
  to: string;
  subject: string;
  html: string;
  attachments?: EmailAttachment[];
}) {
  getMailer(); // ensure initialized

  if (_mailMode === "resend" && _resend) {
    try {
      let from = process.env.MAIL_FROM || "Trackam <onboarding@resend.dev>";
      from = from.replace(/^["']/g, "").replace(/["']$/g, "").trim();
      console.log(`📧 Resend Sending From: "${from}" → To: ${to}`);
      
      let result = await _resend.emails.send({
        from,
        to: [to],
        subject,
        html,
        attachments: attachments?.map((att) => ({
          filename: att.filename,
          content:
            typeof att.content === "string"
              ? Buffer.from(att.content)
              : att.content,
        })),
      });

      // If the custom domain fails, fallback to standard onboarding@resend.dev sandbox domain
      if (result.error && from.toLowerCase() !== "trackam <onboarding@resend.dev>") {
        console.warn("⚠️ Custom MAIL_FROM failed, falling back to onboarding@resend.dev:", result.error);
        const fallbackFrom = "Trackam <onboarding@resend.dev>";
        result = await _resend.emails.send({
          from: fallbackFrom,
          to: [to],
          subject,
          html,
          attachments: attachments?.map((att) => ({
            filename: att.filename,
            content:
              typeof att.content === "string"
                ? Buffer.from(att.content)
                : att.content,
          })),
        });
      }

      if (result.error) {
        console.error("❌ Resend Error:", result.error);
        return { success: false, error: result.error };
      }
      console.log("✅ Resend sent:", result.data?.id);
      return { success: true, data: result.data };
    } catch (err) {
      console.error("❌ Resend Exception:", err);
      return { success: false, error: err };
    }
  }

  // Mock mode
  console.log("--- MOCK EMAIL ---");
  console.log(`To: ${to}\nSubject: ${subject}`);
  if (attachments && attachments.length > 0) {
    console.log(
      `Attachments: ${attachments.map((a) => a.filename).join(", ")}`,
    );
  }
  console.log("-----------------");
  return { success: true, mock: true };
}
