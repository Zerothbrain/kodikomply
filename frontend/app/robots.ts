import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/calculators', '/about', '/auth/login', '/auth/register', '/calculator/'],
        disallow: ['/dashboard', '/admin', '/onboarding', '/reports', '/tools/', '/api/'],
      },
    ],
    sitemap: 'https://kodicomply.co.tz/sitemap.xml',
  };
}
