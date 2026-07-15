import { getCollection } from 'astro:content';
import type { APIRoute } from 'astro';
import { getReleaseOrigin } from '../lib/release-origin';

export const GET: APIRoute = async () => {
  const releaseOrigin = getReleaseOrigin(import.meta.env);
  const projects = (await getCollection('projects')).sort((a, b) => a.data.order - b.data.order);
  const routes = ['/', '/projects/', '/experience/', '/resume/', ...projects.map((project) => `/projects/${project.id}/`)];
  const urls = releaseOrigin
    ? routes.map((route) => `<url><loc>${releaseOrigin}${route}</loc></url>`).join('')
    : '';
  const xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
