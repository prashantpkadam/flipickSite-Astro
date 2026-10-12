// Shared helpers for the form endpoints in /api. Files in a folder that starts
// with an underscore are not deployed as routes; they are only imported.
import { readFileSync } from 'node:fs';
import nodemailer from 'nodemailer';

/** A JSON response. Same shape the PHP endpoints used: { success, message? }. */
export function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=UTF-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

/** Thrown for problems the visitor can fix. Becomes a 400 with the message. */
export class ValidationError extends Error {}

/** Read and parse the JSON body, with a size limit. */
export async function readJson(request, maxBytes = 20000) {
  const raw = await request.text();
  if (!raw || raw.length > maxBytes) throw new ValidationError('Invalid request.');
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new ValidationError('Invalid request.');
  }
  if (data === null || typeof data !== 'object' || Array.isArray(data)) {
    throw new ValidationError('Invalid request.');
  }
  return data;
}

/** Trimmed string with a maximum length. */
export function clean(value, max) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

/** Escape text for HTML. */
export function h(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const isEmail = (value) => EMAIL.test(value) && !/[\r\n]/.test(value);

/** Remove line breaks from anything that goes into an email header. */
export const headerSafe = (value) => String(value).replace(/[\r\n]+/g, ' ').trim();

/**
 * A comma-separated list of addresses from an environment variable, e.g.
 * RECIPIENTS_CONTACT=a@example.com,b@example.com. Invalid entries are skipped.
 */
export function envList(key) {
  return (process.env[key] ?? '')
    .split(',')
    .map((a) => a.trim())
    .filter((a) => a && isEmail(a));
}

/**
 * The final list of recipients. Preview/staging safety: if MAIL_OVERRIDE_TO is set,
 * every email goes to that one address. Throws if nobody would receive the mail,
 * so a lead is never lost silently.
 */
export function recipientsFor(list) {
  const override = (process.env.MAIL_OVERRIDE_TO ?? '').trim();
  const final = override ? [override] : list;
  if (final.length === 0) throw new Error('No mail recipients are configured');
  return final;
}

/** Personal-email domains that work-email forms reject. One source: src/data/. */
let blocked;
export function blockedDomains() {
  if (!blocked) {
    const file = new URL('../../src/data/blocked-email-domains.json', import.meta.url);
    blocked = JSON.parse(readFileSync(file, 'utf8')).map((d) => String(d).toLowerCase());
  }
  return blocked;
}

/** Send one email through the SMTP account configured in the environment. */
export async function sendMail({ to, replyTo, subject, html, text }) {
  const { SMTP_HOST, SMTP_PORT, SMTP_USERNAME, SMTP_PASSWORD, SMTP_FROM } = process.env;
  for (const [name, value] of Object.entries({ SMTP_HOST, SMTP_PORT, SMTP_USERNAME, SMTP_PASSWORD, SMTP_FROM })) {
    if (!value) throw new Error(`Missing environment variable ${name}`);
  }
  // SMTP_SECURE: "starttls" (default, port 587), "ssl" (port 465) or "none" (local testing only).
  const mode = (process.env.SMTP_SECURE || 'starttls').toLowerCase();
  const transport = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: mode === 'ssl',
    requireTLS: mode === 'starttls',
    ignoreTLS: mode === 'none',
    auth: { user: SMTP_USERNAME, pass: SMTP_PASSWORD },
    connectionTimeout: 10000,
    socketTimeout: 15000,
  });
  await transport.sendMail({
    from: { name: process.env.SMTP_FROM_NAME || 'Flipick', address: SMTP_FROM },
    to,
    replyTo,
    subject,
    html,
    text,
  });
}

/** Run a handler body and turn its outcome into a JSON response. */
export async function respond(label, fn) {
  try {
    await fn();
    return json(200, { success: true });
  } catch (err) {
    if (err instanceof ValidationError) {
      return json(400, { success: false, message: err.message });
    }
    // Details go to the Vercel logs, never to the visitor.
    console.error(`[${label}]`, err);
    // Errors from the mail library carry an SMTP/connection code (EAUTH, ECONNECTION, ...).
    const mail = !!err && typeof err === 'object' && ('responseCode' in err || /^E[A-Z]+$/.test(String(err.code ?? '')));
    return json(500, {
      success: false,
      message: mail ? 'Mail could not be sent. Please try again.' : 'Server error. Please try again.',
    });
  }
}
