import type { MetadataRoute } from 'next';

const BASE = 'https://kodicomply.co.tz';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: BASE,                                          lastModified: now, changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${BASE}/calculators`,                         lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${BASE}/about`,                               lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/auth/register`,                       lastModified: now, changeFrequency: 'yearly',  priority: 0.5 },
    { url: `${BASE}/auth/login`,                          lastModified: now, changeFrequency: 'yearly',  priority: 0.4 },
    { url: `${BASE}/calculator/employment`,               lastModified: now, changeFrequency: 'monthly', priority: 0.85 },
    { url: `${BASE}/calculator/vat`,                      lastModified: now, changeFrequency: 'monthly', priority: 0.85 },
    { url: `${BASE}/calculator/withholding`,              lastModified: now, changeFrequency: 'monthly', priority: 0.80 },
    { url: `${BASE}/calculator/corporate`,                lastModified: now, changeFrequency: 'monthly', priority: 0.80 },
    { url: `${BASE}/calculator/business`,                 lastModified: now, changeFrequency: 'monthly', priority: 0.75 },
    { url: `${BASE}/calculator/presumptive`,              lastModified: now, changeFrequency: 'monthly', priority: 0.75 },
    { url: `${BASE}/calculator/terminal`,                 lastModified: now, changeFrequency: 'monthly', priority: 0.70 },
    { url: `${BASE}/calculator/penalty`,                  lastModified: now, changeFrequency: 'monthly', priority: 0.70 },
    { url: `${BASE}/calculator/investment`,               lastModified: now, changeFrequency: 'monthly', priority: 0.65 },
    { url: `${BASE}/calculator/partnership`,              lastModified: now, changeFrequency: 'monthly', priority: 0.65 },
    { url: `${BASE}/calculator/benefits`,                 lastModified: now, changeFrequency: 'monthly', priority: 0.60 },
    { url: `${BASE}/calculator/vat-exempt-checker`,       lastModified: now, changeFrequency: 'monthly', priority: 0.60 },
    { url: `${BASE}/calculator/vat-tools`,                lastModified: now, changeFrequency: 'monthly', priority: 0.60 },
    { url: `${BASE}/calculator/vat-refund`,               lastModified: now, changeFrequency: 'monthly', priority: 0.55 },
    { url: `${BASE}/calculator/digital-marketplace`,      lastModified: now, changeFrequency: 'monthly', priority: 0.55 },
    { url: `${BASE}/calculator/foreigntax`,               lastModified: now, changeFrequency: 'monthly', priority: 0.55 },
    { url: `${BASE}/calculator/retirement`,               lastModified: now, changeFrequency: 'monthly', priority: 0.55 },
    { url: `${BASE}/calculator/longterm`,                 lastModified: now, changeFrequency: 'monthly', priority: 0.55 },
    { url: `${BASE}/calculator/filing-required`,          lastModified: now, changeFrequency: 'monthly', priority: 0.55 },
  ];
}
