// Schema.org global: Organization + WebSite
// Se incluye en el layout de locale para todas las páginas públicas.
// Mejora el conocimiento del grafo de entidades en Google y citabilidad en motores de IA.

interface GlobalJsonLdProps {
  locale: string;
}

export function GlobalJsonLd({ locale }: GlobalJsonLdProps) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://trek-peru.vercel.app';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      // Entidad Organization — identifica quién es TrekPeru
      {
        '@type': 'Organization',
        '@id': `${baseUrl}/#organization`,
        name: 'TrekPeru',
        url: baseUrl,
        logo: {
          '@type': 'ImageObject',
          '@id': `${baseUrl}/#logo`,
          url: `${baseUrl}/images/logo/logo-trek.png`,
          contentUrl: `${baseUrl}/images/logo/logo-trek.png`,
          width: 512,
          height: 512,
        },
        description:
          'Plataforma colaborativa para descubrir, compartir y organizar rutas de trekking en Perú.',
        contactPoint: {
          '@type': 'ContactPoint',
          email: 'genaropretill@gmail.com',
          contactType: 'customer support',
          availableLanguage: ['Spanish', 'English'],
        },
        founder: {
          '@type': 'Person',
          name: 'Genaro Pretill Escobar',
        },
        foundingDate: '2025',
        areaServed: {
          '@type': 'Country',
          name: 'Peru',
          sameAs: 'https://en.wikipedia.org/wiki/Peru',
        },
        knowsAbout: [
          'Trekking',
          'Hiking',
          'Adventure tourism',
          'Inca Trail',
          'Peruvian Andes',
        ],
      },

      // Entidad WebSite — permite el sitelinks searchbox en Google
      {
        '@type': 'WebSite',
        '@id': `${baseUrl}/#website`,
        url: baseUrl,
        name: 'TrekPeru',
        description:
          'Plataforma colaborativa para descubrir, compartir y organizar rutas de trekking en Perú.',
        publisher: {
          '@id': `${baseUrl}/#organization`,
        },
        // SearchAction habilita el cuadro de búsqueda en resultados de Google
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: `${baseUrl}/${locale}/routes?search={search_term_string}`,
          },
          'query-input': 'required name=search_term_string',
        },
        inLanguage: locale === 'es' ? 'es-PE' : 'en-US',
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
