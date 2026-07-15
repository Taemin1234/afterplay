import type { MetadataRoute } from 'next';
import { buildUrl } from '@/lib/seo';

const STATIC_ROUTES = [
  '/',
  '/lists',
  '/weekly-new-releases',
  '/featured',
  '/polls',
  '/search',
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return STATIC_ROUTES.map((route) => ({
    url: buildUrl(route),
    lastModified: now,
    changeFrequency: route === '/' ? 'daily' : 'weekly',
    priority: route === '/' ? 1 : 0.8,
  }));
}
