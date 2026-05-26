import { createClient } from '@/lib/supabase/server';
import { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.trek-peru.com';

// new Date() se evalúa en build time (no en cada request),
// por lo que refleja la fecha real del último deploy en Vercel
const DEPLOY_DATE = new Date();

// Páginas estáticas indexables (excluye login, register, dashboard — son noindex)
// /routes y /routes/completed usan lastModified dinámico basado en la ruta más reciente
const STATIC_PATHS = ['', '/about', '/contact', '/terms', '/privacy'];

// Slugs de las páginas de detalle de features (landing secundarias)
const FEATURE_SLUGS = ['interactive-maps', 'community', 'reviews', 'routes'];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();

  // Obtener rutas publicadas con timestamp real de actualización
  const { data: routes } = await supabase
    .from('routes')
    .select('slug, updated_at, created_at')
    .eq('status', 'published')
    .eq('visibility', 'public')
    .order('updated_at', { ascending: false });

  // Fecha de la ruta más reciente — refleja cuándo cambió el listado
  const latestRouteDate = routes?.[0]
    ? new Date(routes[0].updated_at || routes[0].created_at)
    : DEPLOY_DATE;

  // Rutas dinámicas con timestamp real de la DB
  const routeEntries: MetadataRoute.Sitemap = (routes ?? []).flatMap((route) => {
    const lastModified = new Date(route.updated_at || route.created_at);
    return [
      {
        url: `${BASE_URL}/es/routes/${route.slug}`,
        lastModified,
        alternates: {
          languages: {
            es: `${BASE_URL}/es/routes/${route.slug}`,
            en: `${BASE_URL}/en/routes/${route.slug}`,
            'x-default': `${BASE_URL}/es/routes/${route.slug}`,
          },
        },
      },
      {
        url: `${BASE_URL}/en/routes/${route.slug}`,
        lastModified,
        alternates: {
          languages: {
            es: `${BASE_URL}/es/routes/${route.slug}`,
            en: `${BASE_URL}/en/routes/${route.slug}`,
            'x-default': `${BASE_URL}/es/routes/${route.slug}`,
          },
        },
      },
    ];
  });

  // Páginas de listado de rutas — lastModified basado en la ruta más reciente
  const routeListingEntries: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/es/routes`,
      lastModified: latestRouteDate,
      alternates: {
        languages: {
          es: `${BASE_URL}/es/routes`,
          en: `${BASE_URL}/en/routes`,
          'x-default': `${BASE_URL}/es/routes`,
        },
      },
    },
    {
      url: `${BASE_URL}/en/routes`,
      lastModified: latestRouteDate,
      alternates: {
        languages: {
          es: `${BASE_URL}/es/routes`,
          en: `${BASE_URL}/en/routes`,
          'x-default': `${BASE_URL}/es/routes`,
        },
      },
    },
    {
      url: `${BASE_URL}/es/routes/completed`,
      lastModified: latestRouteDate,
      alternates: {
        languages: {
          es: `${BASE_URL}/es/routes/completed`,
          en: `${BASE_URL}/en/routes/completed`,
          'x-default': `${BASE_URL}/es/routes/completed`,
        },
      },
    },
    {
      url: `${BASE_URL}/en/routes/completed`,
      lastModified: latestRouteDate,
      alternates: {
        languages: {
          es: `${BASE_URL}/es/routes/completed`,
          en: `${BASE_URL}/en/routes/completed`,
          'x-default': `${BASE_URL}/es/routes/completed`,
        },
      },
    },
  ];

  // Páginas estáticas — lastModified basado en el último deploy.
  // x-default siempre apunta a la versión /es (URL 200 OK).
  // No usar `/` aquí: redirige 308 a /es y Google entonces elige una canónica distinta.
  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.flatMap((path) => {
    const xDefault = `${BASE_URL}/es${path}`;
    return [
      {
        url: `${BASE_URL}/es${path}`,
        lastModified: DEPLOY_DATE,
        alternates: {
          languages: {
            es: `${BASE_URL}/es${path}`,
            en: `${BASE_URL}/en${path}`,
            'x-default': xDefault,
          },
        },
      },
      {
        url: `${BASE_URL}/en${path}`,
        lastModified: DEPLOY_DATE,
        alternates: {
          languages: {
            es: `${BASE_URL}/es${path}`,
            en: `${BASE_URL}/en${path}`,
            'x-default': xDefault,
          },
        },
      },
    ];
  });

  // Páginas de detalle de features — contenido estático con lastModified en deploy
  const featureEntries: MetadataRoute.Sitemap = FEATURE_SLUGS.flatMap((slug) => [
    {
      url: `${BASE_URL}/es/features/${slug}`,
      lastModified: DEPLOY_DATE,
      alternates: {
        languages: {
          es: `${BASE_URL}/es/features/${slug}`,
          en: `${BASE_URL}/en/features/${slug}`,
          'x-default': `${BASE_URL}/es/features/${slug}`,
        },
      },
    },
    {
      url: `${BASE_URL}/en/features/${slug}`,
      lastModified: DEPLOY_DATE,
      alternates: {
        languages: {
          es: `${BASE_URL}/es/features/${slug}`,
          en: `${BASE_URL}/en/features/${slug}`,
          'x-default': `${BASE_URL}/es/features/${slug}`,
        },
      },
    },
  ]);

  return [...staticEntries, ...featureEntries, ...routeListingEntries, ...routeEntries];
}
