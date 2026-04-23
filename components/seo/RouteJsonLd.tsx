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
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.trek-peru.com';
  const routeUrl = `${baseUrl}/${locale}/routes/${route.slug}`;

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

  // Calcula endDate sumando la duración real a startDate.
  // Google requiere endDate en Event schema — sin este campo no aparecen rich results.
  const computeEndDate = (startIso: string): string => {
    const start = new Date(startIso);
    if (route.duration_type === 'days' && route.duration_value) {
      start.setDate(start.getDate() + route.duration_value);
    } else if (route.duration_value) {
      start.setHours(start.getHours() + route.duration_value);
    } else if (route.estimated_duration) {
      start.setHours(start.getHours() + route.estimated_duration);
    } else {
      // Fallback conservador: 3 horas (duración típica de trek corto)
      start.setHours(start.getHours() + 3);
    }
    return start.toISOString();
  };

  // Datos de ubicación compartidos entre Event y TouristAttraction
  const locationName = route.meeting_point?.name
    || `${route.region ?? ''}${route.province ? `, ${route.province}` : ''}`.trim();

  const postalAddress = {
    '@type': 'PostalAddress',
    addressRegion: route.region,
    addressLocality: route.province,
    addressCountry: 'PE',
  };

  const geoCoordinates = route.meeting_point?.coordinates
    ? {
        '@type': 'GeoCoordinates',
        latitude: route.meeting_point.coordinates.latitude,
        longitude: route.meeting_point.coordinates.longitude,
      }
    : undefined;

  // Bloque Event — solo se emite si la ruta tiene fecha de salida.
  // Sin departure_date, un "Event" sin startDate es un schema inválido y Google lo ignora.
  const eventSchema = route.departure_date
    ? {
        '@type': 'Event',
        '@id': `${routeUrl}#event`,
        name: route.title,
        description: route.description,
        image: route.featured_image
          ? [route.featured_image, ...(route.images || [])]
          : route.images,
        url: routeUrl,
        startDate: route.departure_date,
        endDate: computeEndDate(route.departure_date),
        // Campos REQUERIDOS por Google desde 2022 para Event rich results
        eventStatus: 'https://schema.org/EventScheduled',
        eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
        duration: formatDuration(),
        location: {
          '@type': 'Place',
          name: locationName,
          address: postalAddress,
          ...(geoCoordinates ? { geo: geoCoordinates } : {}),
        },
        organizer: route.creator
          ? {
              '@type': 'Person',
              name: route.creator.full_name,
              url: `${baseUrl}/${locale}/profile/${route.creator.username}`,
            }
          : undefined,
        offers: {
          '@type': 'Offer',
          price: route.cost ?? 0,
          priceCurrency: route.currency || 'PEN',
          availability: 'https://schema.org/InStock',
          url: routeUrl,
          validFrom: new Date().toISOString(),
          // validThrough = día del evento (23:59:59) para señalar fin de la ventana de compra
          validThrough: new Date(
            new Date(route.departure_date).setHours(23, 59, 59, 999)
          ).toISOString(),
        },
        maximumAttendeeCapacity: route.max_capacity,
        aggregateRating:
          route.average_rating && route.total_ratings
            ? {
                '@type': 'AggregateRating',
                ratingValue: route.average_rating,
                reviewCount: route.total_ratings,
                bestRating: 5,
                worstRating: 1,
              }
            : undefined,
      }
    : null;

  // Bloque TouristAttraction — se emite siempre (describe el lugar, no el evento)
  const attractionSchema = {
    '@type': 'TouristAttraction',
    '@id': `${routeUrl}#attraction`,
    name: route.title,
    description: route.description,
    image: route.featured_image,
    url: routeUrl,
    touristType: ['Backpackers', 'Adventure travelers', 'Nature lovers'],
    isAccessibleForFree: !route.cost,
    publicAccess: true,
    address: postalAddress,
    ...(geoCoordinates ? { geo: geoCoordinates } : {}),
    additionalProperty: [
      route.distance
        ? { '@type': 'PropertyValue', name: 'Distance', value: route.distance, unitCode: 'KMT' }
        : null,
      route.elevation_gain
        ? { '@type': 'PropertyValue', name: 'Elevation Gain', value: route.elevation_gain, unitCode: 'MTR' }
        : null,
      route.max_altitude
        ? { '@type': 'PropertyValue', name: 'Maximum Altitude', value: route.max_altitude, unitCode: 'MTR' }
        : null,
      { '@type': 'PropertyValue', name: 'Difficulty', value: route.difficulty },
    ].filter(Boolean),
    aggregateRating:
      route.average_rating && route.total_ratings
        ? {
            '@type': 'AggregateRating',
            ratingValue: route.average_rating,
            reviewCount: route.total_ratings,
            bestRating: 5,
            worstRating: 1,
          }
        : undefined,
  };

  const breadcrumbSchema = {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: locale === 'es' ? 'Inicio' : 'Home', item: `${baseUrl}/${locale}` },
      { '@type': 'ListItem', position: 2, name: locale === 'es' ? 'Rutas' : 'Routes', item: `${baseUrl}/${locale}/routes` },
      { '@type': 'ListItem', position: 3, name: route.title, item: routeUrl },
    ],
  };

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      ...(eventSchema ? [eventSchema] : []),
      attractionSchema,
      breadcrumbSchema,
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
