import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

type JobStatus =
  | 'annahme'
  | 'diagnose'
  | 'teile_bestellt'
  | 'teile_da'
  | 'reparatur'
  | 'abholbereit'
  | 'abgeholt';

interface NotifyBody {
  jobId: string;
  newStatus: JobStatus;
  customerPhone: string | null;
  customerEmail: string | null;
  customerName: string;
  kennzeichen: string;
  werkstattName: string;
  tenantGoogleReviewUrl: string | null;
}

function esc(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function getSmsText(
  status: JobStatus,
  name: string,
  kennzeichen: string,
  werkstatt: string
): string | null {
  const n = name.split(' ')[0];
  const k = kennzeichen;
  const w = werkstatt;
  switch (status) {
    case 'annahme':
      return `Hallo ${n}, Ihr Fahrzeug ${k} wurde bei uns angenommen. Wir melden uns nach der Diagnose. Ihr Team von ${w}`;
    case 'teile_bestellt':
      return `Hallo ${n}, die benötigten Teile für ${k} wurden bestellt. Wir informieren Sie sobald die Reparatur beginnt. Ihr Team von ${w}`;
    case 'reparatur':
      return `Hallo ${n}, die Reparatur an Ihrem ${k} hat begonnen. Ihr Team von ${w}`;
    case 'abholbereit':
      return `Hallo ${n}, gute Nachricht! Ihr Fahrzeug ${k} ist abholbereit. Bitte kommen Sie zu unseren Öffnungszeiten vorbei. Ihr Team von ${w}`;
    default:
      return null;
  }
}

function getPickupReadyEmail(
  customerName: string,
  kennzeichen: string,
  werkstattName: string
): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:system-ui,sans-serif;background:#f8f9fa;margin:0;padding:20px">
  <div style="max-width:500px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1)">
    <div style="background:#f59e0b;padding:24px;text-align:center">
      <h1 style="color:#0f0f11;margin:0;font-size:22px">Ihr Fahrzeug ist abholbereit! 🎉</h1>
    </div>
    <div style="padding:24px">
      <p style="font-size:16px;color:#374151">Hallo <strong>${esc(customerName)}</strong>,</p>
      <p style="color:#374151">Ihr Fahrzeug <strong style="font-family:monospace;background:#f3f4f6;padding:2px 6px;border-radius:4px">${esc(kennzeichen)}</strong> ist fertig repariert und wartet auf Sie.</p>
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin:20px 0">
        <p style="margin:0;color:#166534;font-weight:600">✅ Reparatur abgeschlossen</p>
        <p style="margin:4px 0 0;color:#166534;font-size:14px">Sie können Ihr Fahrzeug jetzt abholen.</p>
      </div>
      <p style="color:#6b7280;font-size:14px">Bitte bringen Sie Ihren Fahrzeugschein mit. Bei Fragen rufen Sie uns gerne an.</p>
      <p style="color:#374151;margin-top:24px">Mit freundlichen Grüßen,<br><strong>${esc(werkstattName)}</strong></p>
    </div>
  </div>
</body>
</html>`;
}

function getReviewEmail(
  customerName: string,
  kennzeichen: string,
  werkstattName: string,
  reviewUrl: string
): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:system-ui,sans-serif;background:#f8f9fa;margin:0;padding:20px">
  <div style="max-width:500px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1)">
    <div style="background:#f59e0b;padding:24px;text-align:center">
      <h1 style="color:#0f0f11;margin:0;font-size:22px">Wie war Ihre Erfahrung?</h1>
    </div>
    <div style="padding:24px">
      <p style="font-size:16px;color:#374151">Hallo <strong>${esc(customerName)}</strong>,</p>
      <p style="color:#374151">Ihr Fahrzeug <strong style="font-family:monospace">${esc(kennzeichen)}</strong> wurde erfolgreich abgeholt. Wir hoffen, Sie sind zufrieden!</p>
      <p style="color:#374151">Es würde uns sehr helfen, wenn Sie uns eine kurze Bewertung hinterlassen:</p>
      <div style="text-align:center;margin:24px 0">
        <a href="${esc(reviewUrl)}" style="background:#f59e0b;color:#0f0f11;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:16px">⭐ Jetzt bewerten</a>
      </div>
      <p style="color:#6b7280;font-size:14px">Herzlichen Dank für Ihr Vertrauen!</p>
      <p style="color:#374151;margin-top:24px">Ihr Team von<br><strong>${esc(werkstattName)}</strong></p>
    </div>
  </div>
</body>
</html>`;
}

async function sendSMS(to: string, body: string): Promise<void> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !from || accountSid.startsWith('AC_placeholder')) {
    console.log('[notify] SMS skipped — Twilio not configured');
    return;
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const params = new URLSearchParams({ To: to, From: from, Body: body });

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Twilio error: ${err}`);
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = req.body as NotifyBody;
  const { newStatus, customerPhone, customerEmail, customerName, kennzeichen, werkstattName, tenantGoogleReviewUrl } = body;

  const results: Record<string, string> = {};

  try {
    // SMS for applicable statuses
    const smsText = getSmsText(newStatus, customerName, kennzeichen, werkstattName);
    if (smsText && customerPhone) {
      try {
        await sendSMS(customerPhone, smsText);
        results.sms = 'sent';
      } catch (err) {
        console.error('[notify] SMS failed:', err);
        results.sms = 'failed';
      }
    }

    // Email for abholbereit
    if (newStatus === 'abholbereit' && customerEmail) {
      try {
        await resend.emails.send({
          from: `${werkstattName} <${process.env.RESEND_FROM_EMAIL ?? 'noreply@ki-einbau.de'}>`,
          to: customerEmail,
          subject: `Ihr Fahrzeug ${kennzeichen} ist abholbereit`,
          html: getPickupReadyEmail(customerName, kennzeichen, werkstattName),
        });
        results.email = 'sent';
      } catch (err) {
        console.error('[notify] Email (abholbereit) failed:', err);
        results.email = 'failed';
      }
    }

    // Email with review link for abgeholt
    if (newStatus === 'abgeholt' && customerEmail && tenantGoogleReviewUrl) {
      try {
        await resend.emails.send({
          from: `${werkstattName} <${process.env.RESEND_FROM_EMAIL ?? 'noreply@ki-einbau.de'}>`,
          to: customerEmail,
          subject: `Wie war Ihre Erfahrung bei ${werkstattName}?`,
          html: getReviewEmail(customerName, kennzeichen, werkstattName, tenantGoogleReviewUrl),
        });
        results.reviewEmail = 'sent';
      } catch (err) {
        console.error('[notify] Review email failed:', err);
        results.reviewEmail = 'failed';
      }
    }

    return res.status(200).json({ ok: true, results });
  } catch (err) {
    console.error('[notify] Unexpected error:', err);
    return res.status(500).json({ error: 'Internal error', details: String(err) });
  }
}
