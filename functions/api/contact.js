// Cloudflare Pages Function: POST /api/contact
// Sends the contact form submission via the Resend API.
// Requires a Cloudflare Pages environment variable: RESEND_API_KEY

const TO_EMAIL = 'office@al-batuah.co.il';
const FROM_EMAIL = 'office@al-batuah.co.il';

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function jsonResponse(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

export async function onRequestPost({ request, env }) {
  let data;
  try {
    data = await request.json();
  } catch {
    return jsonResponse(400, { ok: false, error: 'invalid_json' });
  }

  // Honeypot: bots tend to fill every field, humans never see this one.
  if (data.website) {
    return jsonResponse(200, { ok: true });
  }

  const name = (data.name || '').trim();
  const email = (data.email || '').trim();
  const phone = (data.phone || '').trim();
  const subject = (data.subject || '').trim();
  const message = (data.message || '').trim();
  const privacyConsent = Boolean(data.privacyConsent);

  if (!name || !email || !message || !privacyConsent) {
    return jsonResponse(400, { ok: false, error: 'missing_fields' });
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    return jsonResponse(400, { ok: false, error: 'invalid_email' });
  }

  if (!env.RESEND_API_KEY) {
    return jsonResponse(500, { ok: false, error: 'not_configured' });
  }

  const htmlBody = `
    <div dir="rtl" style="font-family: Arial, sans-serif; font-size: 15px; color: #222;">
      <h2>פנייה חדשה מטופס יצירת הקשר באתר</h2>
      <p><strong>שם מלא:</strong> ${escapeHtml(name)}</p>
      <p><strong>דוא"ל:</strong> ${escapeHtml(email)}</p>
      <p><strong>טלפון:</strong> ${escapeHtml(phone || '-')}</p>
      <p><strong>נושא:</strong> ${escapeHtml(subject || '-')}</p>
      <p><strong>הודעה:</strong></p>
      <p style="white-space: pre-wrap;">${escapeHtml(message)}</p>
    </div>
  `;

  try {
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `אתר על בטוח <${FROM_EMAIL}>`,
        to: [TO_EMAIL],
        reply_to: email,
        subject: subject ? `פנייה מהאתר: ${subject}` : 'פנייה חדשה מהאתר',
        html: htmlBody,
      }),
    });

    if (!resendResponse.ok) {
      return jsonResponse(502, { ok: false, error: 'send_failed' });
    }

    return jsonResponse(200, { ok: true });
  } catch {
    return jsonResponse(502, { ok: false, error: 'send_failed' });
  }
}
