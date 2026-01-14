// Componente de JSON-LD para rutas de trekking
// Mejora el SEO con datos estructurados para Google

interface RouteJsonLdProps {
  route: {
    title: string;
    description?: string;
    slug: string;
    featured_image?: string;
    images?: string[];
    region?: string;
    province?: string;
    difficulty: string;
    distance?: number;
    elevation_gain?: number;
    max_altitude?: number;
    duration_type?: 'hours' | 'days';
    duration_value?: number;
    estimated_duration?: number;
    departure_date?: string;
    cost?: number;
    currency?: string;
    max_capacity?: number;
    creator?: {
      full_name: string;
      username: string;
    };
    average_rating?: number;
    total_ratings?: number;
    meeting_point?: {
      coordinates?: {
        latitude: number;
        longitude: number;
      };
      name?: string;
    };
  };
  locale: string;
}

export function RouteJsonLd({ route, locale }: RouteJsonLdProps) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://trekperu.com';

  // Formatear duración en ISO 8601
  const formatDuration = () => {
    if (route.duration_type === 'days' && route.duration_value) {
      return `P${route.duration_value}D`;
    }
    if (route.duration_value) {
      return `PT${route.duration_value}H`;
    }
    if (route.estimated_duration) {
      return `PT${route.estimated_duration}H`;
    }
    return undefined;
  };

  // Datos estructurados principales (Event + TouristAttraction)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      // Como evento de trekking
      {
        '@type': 'SportsEvent',
        '@id': `${baseUrl}/${locale}/routes/${route.slug}#event`,
        name: route.title,
        description: route.description,
        image: route.featured_image ? [route.featured_image, ...(route.images || [])] : route.images,
        url: `${baseUrl}/${locale}/routes/${route.slug}`,
        startDate: route.departure_date,
        duration: formatDuration(),
        sport: 'Hiking',
        location: route.meeting_point?.coordinates ? {
          '@type': 'Place',
          name: route.meeting_point?.name || `${route.region}${route.province ? `, ${route.province}` : ''}`,
          address: {
            '@type': 'PostalAddress',
            addressRegion: route.region,
            addressLocality: route.province,
            addressCountry: 'PE'
          },
          geo: {
            '@type': 'GeoCoordinates',
            latitude: route.meeting_point.coordinates.latitude,
            longitude: route.meeting_point.coordinates.longitude
          }
        } : {
          '@type': 'Place',
          name: `${route.region}${route.province ? `, ${route.province}` : ''}`,
          address: {
            '@type': 'PostalAddress',
            addressRegion: route.region,
            addressLocality: route.province,
            addressCountry: 'PE'
          }
        },
        organizer: route.creator ? {
          '@type': 'Person',
          name: route.creator.full_name,
          url: `${baseUrl}/${locale}/profile/${route.creator.username}`
        } : undefined,
        offers: route.cost ? {
          '@type': 'Offer',
          price: route.cost,
          priceCurrency: route.currency || 'PEN',
          availability: 'https://schema.org/InStock',
          validFrom: new Date().toISOString()
        } : {
          '@type': 'Offer',
          price: 0,
          priceCurrency: 'PEN',
          availability: 'https://schema.org/InStock'
        },
        maximumAttendeeCapacity: route.max_capacity,
        aggregateRating: route.average_rating && route.total_ratings ? {
          '@type': 'AggregateRating',
          ratingValue: route.average_rating,
          reviewCount: route.total_ratings,
          bestRating: 5,
          worstRating: 1
        } : undefined
      },
      // Como atracción turística
      {
        '@type': 'TouristAttraction',
        '@id': `${baseUrl}/${locale}/routes/${route.slug}#attraction`,
        name: route.title,
        description: route.description,
        image: route.featured_image,
        url: `${baseUrl}/${locale}/routes/${route.slug}`,
        touristType: ['Backpackers', 'Adventure travelers', 'Nature lovers'],
        isAccessibleForFree: !route.cost,
        publicAccess: true,
        address: {
          '@type': 'PostalAddress',
          addressRegion: route.region,
          addressLocality: route.province,
          addressCountry: 'PE'
        },
        geo: route.meeting_point?.coordinates ? {
          '@type': 'GeoCoordinates',
          latitude: route.meeting_point.coordinates.latitude,
          longitude: route.meeting_point.coordinates.longitude
        } : undefined,
        // Características adicionales de la ruta
        additionalProperty: [
          route.distance ? {
            '@type': 'PropertyValue',
            name: 'Distance',
            value: route.distance,
            unitCode: 'KMT'
          } : null,
          route.elevation_gain ? {
            '@type': 'PropertyValue',
            name: 'Elevation Gain',
            value: route.elevation_gain,
            unitCode: 'MTR'
          } : null,
          route.max_altitude ? {
            '@type': 'PropertyValue',
            name: 'Maximum Altitude',
            value: route.max_altitude,
            unitCode: 'MTR'
          } : null,
          {
            '@type': 'PropertyValue',
            name: 'Difficulty',
            value: route.difficulty
          }
        ].filter(Boolean)
      },
      // Breadcrumbs
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Inicio',
            item: `${baseUrl}/${locale}`
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Rutas',
            item: `${baseUrl}/${locale}/routes`
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: route.title,
            item: `${baseUrl}/${locale}/routes/${route.slug}`
          }
        ]
      }
    ]
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
