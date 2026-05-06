import nodemailer from 'nodemailer';
import prisma from './prisma';

// ── Transporter ────────────────────────────────────────────────────────────────

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

// ── Template renderer ──────────────────────────────────────────────────────────

export function renderTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? '');
}

// ── Default templates ──────────────────────────────────────────────────────────

const DEFAULTS = {
  email_verification: {
    name: 'Email Verification',
    subject: 'Verify your KodiComply email address',
    variables: ['userName', 'verifyUrl', 'siteUrl'],
    htmlBody: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:Inter,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#0d1f17 0%,#1a5c38 100%);padding:32px 40px;text-align:center;">
            <div style="display:inline-flex;align-items:center;gap:10px;">
              <div style="width:36px;height:36px;background:rgba(255,255,255,0.2);border-radius:10px;display:inline-block;line-height:36px;text-align:center;font-weight:900;color:#fff;font-size:14px;">KC</div>
              <span style="color:#fff;font-weight:700;font-size:18px;letter-spacing:-0.3px;">KodiComply</span>
            </div>
            <p style="color:rgba(255,255,255,0.6);margin:8px 0 0;font-size:12px;">Tanzania Tax Compliance Platform</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:40px;">
            <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0f172a;">Verify your email</h1>
            <p style="margin:0 0 24px;color:#64748b;font-size:14px;line-height:1.6;">
              Hi <strong>{{userName}}</strong>, welcome to KodiComply! Please verify your email address to access all features.
            </p>

            <table width="100%" cellpadding="0" cellspacing="0">
              <tr><td align="center" style="padding:8px 0 32px;">
                <a href="{{verifyUrl}}" style="display:inline-block;background:#1a5c38;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:14px 36px;border-radius:10px;letter-spacing:-0.2px;">
                  Verify Email Address
                </a>
              </td></tr>
            </table>

            <p style="margin:0 0 8px;color:#94a3b8;font-size:12px;text-align:center;">
              Or copy and paste this link into your browser:
            </p>
            <p style="margin:0 0 24px;color:#1a5c38;font-size:11px;text-align:center;word-break:break-all;">{{verifyUrl}}</p>

            <div style="background:#f8fafc;border-radius:10px;padding:16px;margin-top:8px;">
              <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.6;">
                This link expires in <strong>24 hours</strong>. If you did not create a KodiComply account, you can safely ignore this email.
              </p>
            </div>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 40px 32px;border-top:1px solid #f1f5f9;text-align:center;">
            <p style="margin:0;color:#cbd5e1;font-size:11px;">
              &copy; 2024 KodiComply &middot;
              <a href="{{siteUrl}}" style="color:#94a3b8;text-decoration:none;">kodicomply.co.tz</a>
            </p>
            <p style="margin:4px 0 0;color:#e2e8f0;font-size:10px;">
              For informational purposes only. Not legal or tax advice.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`,
    textBody: `Hi {{userName}},

Welcome to KodiComply! Please verify your email address by visiting the link below:

{{verifyUrl}}

This link expires in 24 hours.

If you did not create a KodiComply account, please ignore this email.

— The KodiComply Team
{{siteUrl}}`,
  },

  calculation_summary: {
    name: 'Calculation Summary',
    subject: 'Your KodiComply calculation: {{calculationType}}',
    variables: ['userName', 'calculationType', 'date', 'keyResults', 'dashboardUrl', 'siteUrl'],
    htmlBody: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:Inter,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#0d1f17 0%,#1a5c38 100%);padding:32px 40px;text-align:center;">
            <div style="display:inline-flex;align-items:center;gap:10px;">
              <div style="width:36px;height:36px;background:rgba(255,255,255,0.2);border-radius:10px;display:inline-block;line-height:36px;text-align:center;font-weight:900;color:#fff;font-size:14px;">KC</div>
              <span style="color:#fff;font-weight:700;font-size:18px;letter-spacing:-0.3px;">KodiComply</span>
            </div>
            <p style="color:rgba(255,255,255,0.6);margin:8px 0 0;font-size:12px;">Calculation Summary</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:40px;">
            <p style="margin:0 0 4px;color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;font-weight:600;">{{date}}</p>
            <h1 style="margin:0 0 20px;font-size:20px;font-weight:700;color:#0f172a;">{{calculationType}}</h1>

            <p style="margin:0 0 20px;color:#475569;font-size:14px;line-height:1.6;">
              Hi <strong>{{userName}}</strong>, here is a summary of your recent tax calculation on KodiComply.
            </p>

            <!-- Results box -->
            <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:20px;margin-bottom:28px;">
              <p style="margin:0 0 12px;font-weight:700;color:#166534;font-size:13px;text-transform:uppercase;letter-spacing:0.05em;">Key Results</p>
              {{keyResults}}
            </div>

            <table width="100%" cellpadding="0" cellspacing="0">
              <tr><td align="center" style="padding:0 0 24px;">
                <a href="{{dashboardUrl}}" style="display:inline-block;background:#1a5c38;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 28px;border-radius:10px;">
                  View in Dashboard
                </a>
              </td></tr>
            </table>

            <div style="background:#f8fafc;border-radius:10px;padding:14px;margin-top:4px;">
              <p style="margin:0;color:#94a3b8;font-size:11px;line-height:1.6;text-align:center;">
                This is for informational purposes only. Always verify with a registered tax consultant or TRA.
              </p>
            </div>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 40px 32px;border-top:1px solid #f1f5f9;text-align:center;">
            <p style="margin:0;color:#cbd5e1;font-size:11px;">
              &copy; 2024 KodiComply &middot;
              <a href="{{siteUrl}}" style="color:#94a3b8;text-decoration:none;">kodicomply.co.tz</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`,
    textBody: `Hi {{userName}},

Here is your {{calculationType}} calculation summary from {{date}}.

KEY RESULTS:
{{keyResults}}

View your full calculation history in your dashboard:
{{dashboardUrl}}

This is for informational purposes only. Verify results with a registered tax consultant or TRA.

— KodiComply
{{siteUrl}}`,
  },

  welcome: {
    name: 'Welcome Email',
    subject: 'Welcome to KodiComply — Tanzania Tax Compliance',
    variables: ['userName', 'loginUrl', 'siteUrl'],
    htmlBody: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:Inter,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#0d1f17 0%,#1a5c38 100%);padding:32px 40px;text-align:center;">
            <div style="display:inline-flex;align-items:center;gap:10px;">
              <div style="width:36px;height:36px;background:rgba(255,255,255,0.2);border-radius:10px;display:inline-block;line-height:36px;text-align:center;font-weight:900;color:#fff;font-size:14px;">KC</div>
              <span style="color:#fff;font-weight:700;font-size:18px;letter-spacing:-0.3px;">KodiComply</span>
            </div>
            <p style="color:rgba(255,255,255,0.6);margin:8px 0 0;font-size:12px;">Tanzania Tax Compliance Platform</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:40px;">
            <h1 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#0f172a;">Karibu, {{userName}}! 🎉</h1>
            <p style="margin:0 0 20px;color:#475569;font-size:14px;line-height:1.6;">
              Your KodiComply account is verified and ready. You now have access to Tanzania&apos;s most accurate tax engine — 21+ calculators built on the exact logic of the ITA and VAT Act.
            </p>

            <div style="background:#f0fdf4;border-radius:12px;padding:20px;margin-bottom:28px;">
              <p style="margin:0 0 12px;font-weight:700;color:#166534;font-size:13px;">What you can do:</p>
              <ul style="margin:0;padding-left:18px;color:#475569;font-size:13px;line-height:2;">
                <li>Calculate PAYE, VAT, WHT and 18+ more</li>
                <li>Track filing deadlines</li>
                <li>Download PDF calculation reports</li>
                <li>Chat with the AI Tax Assistant</li>
              </ul>
            </div>

            <table width="100%" cellpadding="0" cellspacing="0">
              <tr><td align="center" style="padding:0 0 24px;">
                <a href="{{loginUrl}}" style="display:inline-block;background:#1a5c38;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:14px 36px;border-radius:10px;">
                  Go to Dashboard
                </a>
              </td></tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 40px 32px;border-top:1px solid #f1f5f9;text-align:center;">
            <p style="margin:0;color:#cbd5e1;font-size:11px;">
              &copy; 2024 KodiComply &middot;
              <a href="{{siteUrl}}" style="color:#94a3b8;text-decoration:none;">kodicomply.co.tz</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`,
    textBody: `Karibu {{userName}}!

Your KodiComply account is verified. You now have access to 21+ Tanzania tax calculators.

Go to your dashboard: {{loginUrl}}

— KodiComply
{{siteUrl}}`,
  },
};

// ── Seed defaults into DB ──────────────────────────────────────────────────────

export async function seedEmailTemplates(): Promise<void> {
  for (const [slug, tpl] of Object.entries(DEFAULTS)) {
    const exists = await prisma.emailTemplate.findUnique({ where: { slug } });
    if (!exists) {
      await prisma.emailTemplate.create({
        data: {
          slug,
          name: tpl.name,
          subject: tpl.subject,
          htmlBody: tpl.htmlBody,
          textBody: tpl.textBody,
          variables: JSON.stringify(tpl.variables),
        },
      });
    }
  }
}

// ── Send email ────────────────────────────────────────────────────────────────

export async function sendEmail(opts: {
  to: string;
  templateSlug: string;
  vars: Record<string, string>;
}): Promise<void> {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn(`[email] SMTP not configured — skipping email to ${opts.to} (${opts.templateSlug})`);
    return;
  }

  const template = await prisma.emailTemplate.findUnique({
    where: { slug: opts.templateSlug, isActive: true },
  });
  if (!template) {
    console.warn(`[email] Template "${opts.templateSlug}" not found or inactive`);
    return;
  }

  const subject  = renderTemplate(template.subject,  opts.vars);
  const html     = renderTemplate(template.htmlBody,  opts.vars);
  const text     = renderTemplate(template.textBody,  opts.vars);

  const transporter = createTransporter();
  await transporter.sendMail({
    from: process.env.SMTP_FROM || `KodiComply <noreply@kodicomply.co.tz>`,
    to:   opts.to,
    subject,
    html,
    text,
  });
  console.log(`[email] Sent "${opts.templateSlug}" to ${opts.to}`);
}
