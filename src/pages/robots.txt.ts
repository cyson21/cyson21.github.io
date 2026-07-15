import type { APIRoute } from 'astro';
import { getReleaseOrigin } from '../lib/release-origin';

export const GET: APIRoute = () => {
  const releaseOrigin = getReleaseOrigin(import.meta.env);
  const body = releaseOrigin
    ? `User-agent: *\nAllow: /\nSitemap: ${releaseOrigin}/sitemap.xml\n`
    : 'User-agent: *\nDisallow: /\n';

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
