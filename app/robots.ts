import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.trek-peru.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // /_next/ excluido: Googlebot necesita CSS y JS para renderizar páginas
        disallow: [
          '/api/',
          '/auth/',
          '/private/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
