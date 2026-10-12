import type { APIRoute } from 'astro';
import domains from '../../data/blocked-email-domains.json';

export const GET: APIRoute = () =>
  new Response(JSON.stringify(domains), {
    headers: { 'Content-Type': 'application/json' },
  });