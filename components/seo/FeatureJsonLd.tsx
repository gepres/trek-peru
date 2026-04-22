// Schema.org para las páginas de detalle de feature.
// WebPage + BreadcrumbList mejoran el breadcrumb en SERPs y la clasificación
// temática del contenido en el knowledge graph.

interface FeatureJsonLdProps {
  slug: string;
  title: string;
  description: string;
  locale: string;
  breadcrumbHomeLabel: string;
  breadcrumbFeatureLabel: string;
}

export function FeatureJsonLd({
  slug,
  title,
  description,
  locale,
  breadcrumbHomeLabel,
  breadcrumbFeatureLabel,
}: FeatureJsonLdProps) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.trek-peru.com';
  const url = `${baseUrl}/${locale}/features/${slug}`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${url}#webpage`,
        url,
        name: title,
        description,
        inLanguage: locale === 'es' ? 'es-PE' : 'en-US',
        isPartOf: {
          '@id': `${baseUrl}/#website`,
        },
        about: {
          '@id': `${baseUrl}/#organization`,
        },
        breadcrumb: {
          '@id': `${url}#breadcrumb`,
        },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${url}#breadcrumb`,
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: breadcrumbHomeLabel,
            item: `${baseUrl}/${locale}`,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: breadcrumbFeatureLabel,
            item: url,
          },
        ],
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
