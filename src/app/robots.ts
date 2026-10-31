// src/app/robots.ts
import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/arsip', '/arsip/*', '/panduan', '/tentang'],
        disallow: ['/admin', '/admin/*', '/penulis', '/penulis/*', '/peninjau', '/peninjau/*', '/api/*'],
      },
      {
        userAgent: 'Googlebot-Scholar',
        allow: ['/', '/arsip', '/arsip/*'],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
