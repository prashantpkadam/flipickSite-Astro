import type { APIRoute } from 'astro';
import domains from '../../../data/blocked-email-domains.json';

export const GET: APIRoute = () =>
  new Response(
    `window.FLIPICK = window.FLIPICK || {};\nFLIPICK.blockedEmailDomains = ${JSON.stringify(domains)};\n`,
    { headers: { 'Content-Type': 'application/javascript' } },
  );