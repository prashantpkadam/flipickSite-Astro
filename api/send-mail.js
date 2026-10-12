// Contact form on /company. POST { name, email, company, topic, message }.
// Recipients come from the RECIPIENTS_CONTACT environment variable
// (comma-separated); SMTP settings come from the SMTP_* variables.
import {
  ValidationError, clean, envList, h, headerSafe, isEmail, json, readJson, recipientsFor, respond, sendMail,
} from './_lib/util.js';

// Must match the options in the /company contact form.
const TOPICS = ['Booking a demo', 'Sales & pricing', 'Support', 'Partnerships', 'Careers', 'Something else'];

async function handlePost(request) {
  return respond('send-mail', async () => {
    const data = await readJson(request);

    const name = clean(data.name, 100);
    const email = clean(data.email, 254);
    const company = clean(data.company, 150);
    const topic = clean(data.topic, 60);
    const message = clean(data.message, 5000);

    if (!name) throw new ValidationError('Name is required.');
    if (!email || !isEmail(email)) throw new ValidationError('A valid email is required.');
    if (!company) throw new ValidationError('Company is required.');
    if (!TOPICS.includes(topic)) throw new ValidationError('Please select a topic.');
    if (!message) throw new ValidationError('Message is required.');

    const dateTime = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true,
    }).format(new Date()) + ' IST';

    await sendMail({
      to: recipientsFor(envList('RECIPIENTS_CONTACT')),
      replyTo: { name: headerSafe(name), address: email },
      subject: `New Enquiry: ${headerSafe(topic)} - ${headerSafe(name)}`,
      html: template({ name, email, company, topic, message, dateTime }),
      text: `New enquiry\nName: ${name}\nEmail: ${email}\nCompany: ${company}\nTopic: ${topic}\n\n${message}\n\n${dateTime}`,
    });
  });
}

// Vercel calls this for every request. Only POST is accepted; anything else gets a clear 405.
export default {
  fetch(request) {
    return request.method === 'POST'
      ? handlePost(request)
      : json(405, { success: false, message: 'Method not allowed' });
  },
};

const row = (label, htmlValue) =>
  `<tr><td style="padding:14px 0;border-bottom:1px solid #EBEBF0;">` +
  `<p style="margin:0 0 5px;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#9999BB;">${label}</p>` +
  `<p style="margin:0;font-size:14px;color:#1A1A2E;">${htmlValue}</p></td></tr>`;

function template({ name, email, company, topic, message, dateTime }) {
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>New Enquiry — Flipick</title></head>
<body style="margin:0;padding:0;background:#F4F5F9;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" role="presentation"><tr><td align="center" style="padding:40px 16px;">
  <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.08);">
    <tr><td style="background:#11122B;padding:28px 40px;">
      <p style="margin:0;font-size:13px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#7B7FBB;">Flipick</p>
      <h1 style="margin:6px 0 0;font-size:20px;font-weight:700;color:#ffffff;">New Contact Form Submission</h1>
    </td></tr>
    <tr><td style="background:#F0F1FF;padding:14px 40px;">
      <span style="display:inline-block;font-size:12px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#444CEC;background:#DDE0FF;padding:5px 12px;border-radius:999px;">${h(topic)}</span>
    </td></tr>
    <tr><td style="padding:32px 40px 8px;">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
        ${row('Name', h(name))}
        ${row('Email', `<a href="mailto:${h(email)}" style="color:#444CEC;text-decoration:none;">${h(email)}</a>`)}
        ${row('Company', h(company))}
        ${row('Topic', h(topic))}
        <tr><td style="padding:14px 0;border-bottom:1px solid #EBEBF0;">
          <p style="margin:0 0 5px;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#9999BB;">Message</p>
          <p style="margin:0;font-size:14px;color:#1A1A2E;line-height:1.65;white-space:pre-wrap;">${h(message)}</p>
        </td></tr>
        ${row('Date &amp; Time', h(dateTime))}
      </table>
    </td></tr>
    <tr><td style="padding:24px 40px 32px;">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation"><tr>
        <td style="background:#F0F1FF;border-left:4px solid #444CEC;border-radius:0 8px 8px 0;padding:14px 18px;">
          <p style="margin:0;font-size:13px;color:#444CEC;"><strong>Reply-To</strong> is set to <a href="mailto:${h(email)}" style="color:#444CEC;">${h(email)}</a> — just hit <strong>Reply</strong> to respond to ${h(name)} directly.</p>
        </td>
      </tr></table>
    </td></tr>
    <tr><td style="background:#F4F5F9;padding:18px 40px;border-top:1px solid #E8E9F0;">
      <p style="margin:0;font-size:11px;color:#AAAACC;text-align:center;">Sent via the contact form on <a href="https://flipick.com" style="color:#AAAACC;">flipick.com</a></p>
    </td></tr>
  </table>
</td></tr></table>
</body></html>`;
}
