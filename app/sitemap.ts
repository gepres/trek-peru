import { createClient } from '@/lib/supabase/server';
import { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://trek-peru.vercel.app';
  const supabase = await createClient();

  // Obtener todas las rutas publicadas
  const { data: routes } = await supabase
    .from('routes')
    .select('slug, updated_at, created_at')
    .eq('status', 'published')
    .eq('visibility', 'public')
    .order('updated_at', { ascending: false });

  // Páginas estáticas
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/es`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/en`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/es/routes`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/en/routes`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/es/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/en/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/es/register`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/en/register`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  // Páginas dinámicas de rutas
  const routePages: MetadataRoute.Sitemap = routes?.flatMap(route => [
    {
      url: `${baseUrl}/es/routes/${route.slug}`,
      lastModified: new Date(route.updated_at || route.created_at),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/en/routes/${route.slug}`,
      lastModified: new Date(route.updated_at || route.created_at),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
  ]) || [];

  return [...staticPages, ...routePages];
}
