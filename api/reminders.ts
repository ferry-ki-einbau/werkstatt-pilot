import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { addWeeks, isAfter, isBefore, parseISO, isValid } from 'date-fns';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL ?? '',
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
);

const resend = new Resend(process.env.RESEND_API_KEY);

interface VehicleWithRelations {
  id: string;
  kennzeichen: string;
  tuev_datum: string | null;
  tenant_id: string;
  customer: {
    full_name: string;
    email: string | null;
    phone: string | null;
  };
  tenant: {
    name: string;
    sms_enabled: boolean;
  };
}

function esc(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function getTuevReminderEmail(
  customerName: string,
  kennzeichen: string,
  tuevDate: string,
  werkstattName: string,
  weeksUntil: number
): string {
  const urgency = weeksUntil <= 2 ? '⚠️ Dringend' : '📅 Erinnerung';
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:system-ui,sans-serif;background:#f8f9fa;margin:0;padding:20px">
  <div style="max-width:500px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1)">
    <div style="background:${weeksUntil <= 2 ? '#ef4444' : '#f97316'};padding:24px;text-align:center">
      <h1 style="color:#fff;margin:0;font-size:20px">${urgency}: TÜV-Termin für ${esc(kennzeichen)}</h1>
    </div>
    <div style="padding:24px">
      <p style="color:#374151">Hallo <strong>${esc(customerName)}</strong>,</p>
      <p style="color:#374151">der TÜV Ihres Fahrzeugs <strong style="font-family:monospace">${esc(kennzeichen)}</strong> ist am <strong>${esc(tuevDate)}</strong> fällig — das sind noch ca. <strong>${weeksUntil} Wochen</strong>.</p>
      <p style="color:#374151">Vereinbaren Sie jetzt einen Termin bei uns:</p>
      <p style="color:#374151;margin-top:24px">Mit freundlichen Grüßen,<br><strong>${esc(werkstattName)}</strong></p>
    </div>
  </div>
</body>
</html>`;
}

async function sendSMS(to: string, body: string): Promise<void> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !from || accountSid.startsWith('AC_placeholder')) return;

  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const params = new URLSearchParams({ To: to, From: from, Body: body });

  await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Verify cron secret
  const authHeader = req.headers['authorization'];
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  console.log('[reminders] Starting TÜV reminder check...');

  try {
    const { data: vehicles, error } = await supabase
      .from('vehicles')
      .select(`
        id, kennzeichen, tuev_datum, tenant_id,
        customer:customers(full_name, email, phone),
        tenant:tenants(name, sms_enabled)
      `)
      .not('tuev_datum', 'is', null);

    if (error) {
      console.error('[reminders] DB error:', error);
      return res.status(500).json({ error: error.message });
    }

    const now = new Date();
    const in6Weeks = addWeeks(now, 6);
    const in2Weeks = addWeeks(now, 2);

    let sent = 0;
    let skipped = 0;

    for (const v of (vehicles as unknown as VehicleWithRelations[])) {
      if (!v.tuev_datum) continue;

      const tuevDate = parseISO(v.tuev_datum);
      if (!isValid(tuevDate)) continue;

      // Skip already expired
      if (isBefore(tuevDate, now)) continue;

      const isIn6Weeks = isBefore(tuevDate, in6Weeks) && isAfter(tuevDate, in2Weeks);
      const isIn2Weeks = isBefore(tuevDate, in2Weeks);

      if (!isIn6Weeks && !isIn2Weeks) {
        skipped++;
        continue;
      }

      const weeksUntil = isIn2Weeks ? 2 : 6;
      const customer = Array.isArray(v.customer) ? v.customer[0] : v.customer;
      const tenant = Array.isArray(v.tenant) ? v.tenant[0] : v.tenant;

      if (!customer || !tenant) continue;

      const tuevDateFormatted = tuevDate.toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });

      // Send email
      if (customer.email && process.env.RESEND_API_KEY && !process.env.RESEND_API_KEY.includes('placeholder')) {
        try {
          await resend.emails.send({
            from: `${tenant.name} <noreply@ki-einbau.de>`,
            to: customer.email,
            subject: `TÜV-Erinnerung: ${v.kennzeichen} — noch ${weeksUntil} Wochen`,
            html: getTuevReminderEmail(
              customer.full_name,
              v.kennzeichen,
              tuevDateFormatted,
              tenant.name,
              weeksUntil
            ),
          });
          sent++;
        } catch (err) {
          console.error(`[reminders] Email failed for ${v.kennzeichen}:`, err);
        }
      }

      // Send SMS if enabled
      if (tenant.sms_enabled && customer.phone) {
        const smsText = `TÜV-Erinnerung: Ihr ${v.kennzeichen} hat TÜV am ${tuevDateFormatted} (noch ${weeksUntil} Wochen). Termin vereinbaren: ${tenant.name}`;
        try {
          await sendSMS(customer.phone, smsText);
          sent++;
        } catch (err) {
          console.error(`[reminders] SMS failed for ${v.kennzeichen}:`, err);
        }
      }
    }

    console.log(`[reminders] Done. Sent: ${sent}, Skipped: ${skipped}`);
    return res.status(200).json({ ok: true, sent, skipped });
  } catch (err) {
    console.error('[reminders] Unexpected error:', err);
    return res.status(500).json({ error: String(err) });
  }
}
