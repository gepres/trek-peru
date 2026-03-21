// Schema.org global: TravelAgency + WebSite
// Se incluye en el layout de locale para todas las páginas públicas.
// Mejora el conocimiento del grafo de entidades en Google y citabilidad en motores de IA.

interface GlobalJsonLdProps {
  locale: string;
}

export function GlobalJsonLd({ locale }: GlobalJsonLdProps) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.trek-peru.com';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      // TravelAgency — identifica a TrekPeru como agencia de turismo de aventura
      {
        '@type': 'TravelAgency',
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
        email: 'contacto@trek-peru.com',
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'Cusco',
          addressRegion: 'Cusco',
          addressCountry: 'PE',
        },
        contactPoint: {
          '@type': 'ContactPoint',
          email: 'contacto@trek-peru.com',
          // "customer service" es el valor requerido por Google (no "customer support")
          contactType: 'customer service',
          availableLanguage: ['Spanish', 'English'],
        },
        sameAs: [
          'https://www.instagram.com/trekperu',
          'https://www.facebook.com/trekperu',
        ],
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

      // WebSite — habilita el sitelinks searchbox en Google
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
