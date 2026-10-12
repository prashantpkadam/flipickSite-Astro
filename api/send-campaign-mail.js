// Campaign lead forms. POST { form_id, name, email, fields: [{ label, value }] }.
// The route (campaign label, page, recipients) always comes from ROUTES below,
// never from the request, so leads can never be mis-routed.
import {
  ValidationError, blockedDomains, clean, envList, h, headerSafe, isEmail, json, readJson, recipientsFor, respond, sendMail,
} from './_lib/util.js';

// form_id      the id sent by the page's script
// campaign     label shown in the email subject and badge
// page         source page slug shown in the email
// recipients   NAME of the environment variable holding this form's recipients
//              (comma-separated). The addresses live in Vercel, not in the code.
// workEmail    true = personal addresses (gmail, yahoo...) are rejected
// To add a campaign form: add one entry here and a RECIPIENTS_... variable in Vercel.
const ROUTES = {
  'shopify-usa-lead': {
    campaign: 'Shopify USA', page: 'shopify-usa', recipients: 'RECIPIENTS_SHOPIFY_USA_LEAD', workEmail: true,
  },
  'vvp-us-retail-lead': {
    campaign: 'VVP US Retail', page: 'vvp-us-retail', recipients: 'RECIPIENTS_VVP_US_RETAIL_LEAD', workEmail: true,
  },
  'dealership-lead': {
    campaign: 'US Dealerships', page: 'dealership', recipients: 'RECIPIENTS_DEALERSHIP_LEAD', workEmail: true,
  },
};

const MAX_FIELDS = 15;

export async function POST(request) {
  return respond('send-campaign-mail', async () => {
    const data = await readJson(request);

    const formId = clean(data.form_id, 80);
    const route = Object.hasOwn(ROUTES, formId) ? ROUTES[formId] : undefined;
    if (!route) throw new ValidationError('Unknown form.');

    const name = clean(data.name, 100);
    const email = clean(data.email, 254);
    if (!name) throw new ValidationError('Name is required.');
    if (!email || !isEmail(email)) throw new ValidationError('A valid email is required.');
    if (route.workEmail) {
      const domain = email.slice(email.lastIndexOf('@') + 1).toLowerCase();
      if (blockedDomains().includes(domain)) {
        throw new ValidationError(
          'Please enter your work email address. Personal email addresses such as Gmail or Yahoo are not accepted.',
        );
      }
    }

    const rawFields = data.fields;
    if (!Array.isArray(rawFields) || rawFields.length === 0 || rawFields.length > MAX_FIELDS) {
      throw new ValidationError('Please complete all required fields.');
    }
    const fields = [];
    for (const field of rawFields) {
      if (field === null || typeof field !== 'object') {
        throw new ValidationError('Please complete all required fields.');
      }
      const label = clean(field.label, 60);
      const value = clean(field.value, 1000);
      if (!label) continue;
      if (!value) throw new ValidationError(`${label} is required.`);
      fields.push({ label, value });
    }
    if (fields.length === 0) throw new ValidationError('Please complete all required fields.');

    const dateTime = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true,
    }).format(new Date()) + ' IST';

    await sendMail({
      to: recipientsFor(envList(route.recipients)),
      replyTo: { name: headerSafe(name), address: email },
      subject: `New Lead: ${route.campaign} - ${headerSafe(name)}`,
      html: template({ formId, route, name, email, fields, dateTime }),
      text: [`New lead: ${route.campaign}`, `Form: ${formId}`, `Name: ${name}`, `Email: ${email}`,
        ...fields.map((f) => `${f.label}: ${f.value}`), dateTime].join('\n'),
    });
  });
}

// Any other method gets a clear 405.
export const GET = () => json(405, { success: false, message: 'Method not allowed' });

const row = (label, htmlValue) =>
  `<tr><td style="padding:14px 0;border-bottom:1px solid #EBEBF0;">` +
  `<p style="margin:0 0 5px;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#9999BB;">${label}</p>` +
  `<p style="margin:0;font-size:14px;color:#1A1A2E;">${htmlValue}</p></td></tr>`;

function template({ formId, route, name, email, fields, dateTime }) {
  // Source metadata first, then the visitor's details, then every field generically.
  const fieldRows = fields.map((f) => row(h(f.label), h(f.value))).join('');
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><title>New Lead - Flipick</title></head>
<body style="margin:0;padding:0;background:#F4F5F9;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" role="presentation"><tr><td align="center" style="padding:40px 16px;">
  <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.08);">
    <tr><td style="background:#11122B;padding:28px 40px;">
      <p style="margin:0;font-size:13px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#7B7FBB;">Flipick</p>
      <h1 style="margin:6px 0 0;font-size:20px;font-weight:700;color:#ffffff;">New Campaign Lead</h1>
    </td></tr>
    <tr><td style="background:#F0F1FF;padding:14px 40px;">
      <span style="display:inline-block;font-size:12px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#444CEC;background:#DDE0FF;padding:5px 12px;border-radius:999px;">${h(route.campaign)}</span>
    </td></tr>
    <tr><td style="padding:32px 40px 8px;">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
        ${row('Form', h(formId))}
        ${row('Page', h(route.page))}
        ${row('Campaign', h(route.campaign))}
        <tr><td style="padding:6px 0;"><hr style="border:none;border-top:2px solid #F0F1FF;margin:0;"></td></tr>
        ${row('Name', h(name))}
        ${row('Email', `<a href="mailto:${h(email)}" style="color:#444CEC;text-decoration:none;">${h(email)}</a>`)}
        ${fieldRows}
        ${row('Date &amp; Time', h(dateTime))}
      </table>
    </td></tr>
    <tr><td style="padding:24px 40px 32px;">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation"><tr>
        <td style="background:#F0F1FF;border-left:4px solid #444CEC;border-radius:0 8px 8px 0;padding:14px 18px;">
          <p style="margin:0;font-size:13px;color:#444CEC;"><strong>Reply-To</strong> is set to <a href="mailto:${h(email)}" style="color:#444CEC;">${h(email)}</a> - just hit <strong>Reply</strong> to respond to ${h(name)} directly.</p>
        </td>
      </tr></table>
    </td></tr>
    <tr><td style="background:#F4F5F9;padding:18px 40px;border-top:1px solid #E8E9F0;">
      <p style="margin:0;font-size:11px;color:#AAAACC;text-align:center;">Sent via a campaign form on <a href="https://flipick.com" style="color:#AAAACC;">flipick.com</a></p>
    </td></tr>
  </table>
</td></tr></table>
</body></html>`;
}
