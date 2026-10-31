// src/app/sitemap.ts
import { MetadataRoute } from 'next';
import { createClient } from '@/lib/supabase/server';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const supabase = await createClient();

  // 1. Rute Statis Publik
  const routes: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${siteUrl}/arsip`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${siteUrl}/panduan`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${siteUrl}/tentang`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
  ];

  // 2. Rute Dinamis Semua Artikel yang Telah Terbit (Open Access)
  try {
    const { data: articles } = await supabase
      .from('submissions')
      .select('id, updated_at, published_at')
      .eq('status', 'published');

    if (articles && articles.length > 0) {
      articles.forEach((art) => {
        routes.push({
          url: `${siteUrl}/arsip/${art.id}`,
          lastModified: art.published_at ? new Date(art.published_at) : new Date(art.updated_at),
          changeFrequency: 'monthly',
          priority: 0.8,
        });
      });
    }
  } catch (err) {
    console.error('Gagal memuat artikel ke dalam sitemap:', err);
  }

  return routes;
}
