// Componente JSON-LD para los tramos de transporte ("Cómo llegar").
// Server-side: carga los segmentos vía Supabase y emite un grafo Schema.org
// con BusTrip/Flight/TrainTrip/BoatTrip/Trip según el modo, todos ligados al
// TouristTrip principal de la ruta a través de partOfTrip.

import { createClient } from '@/lib/supabase/server';
import { createTransportRepository } from '@/infrastructure/supabase';
import { getTransportSegments } from '@/application/transport';
import type {
  TransportMode,
  TransportOption,
  TransportSegment,
} from '@/types/transport.types';

interface TransportJsonLdProps {
  routeId: string;
  routeUrl: string;
  // Fecha base (YYYY-MM-DD) usada para componer ISO 8601 de departureTime/arrivalTime
  // a partir de horas "HH:MM" en las opciones. Opcional — si no se pasa, los
  // ISO times se omiten y sólo se emiten campos compatibles sin fecha.
  departureBaseDate?: string;
}

// Mapa modo → tipo Schema.org más específico disponible.
// taxi/car/motorcycle/walk/bike/other no tienen tipo específico, usamos Trip.
function schemaTypeForMode(mode: TransportMode): string {
  switch (mode) {
    case 'bus':
    case 'combi':
    case 'colectivo':
      return 'BusTrip';
    case 'plane':
      return 'Flight';
    case 'train':
      return 'TrainTrip';
    case 'boat':
      return 'BoatTrip';
    default:
      return 'Trip';
  }
}

// Schema.org usa propiedades distintas para origen/destino según el tipo:
//  - BusTrip → departureBusStop / arrivalBusStop (BusStation)
//  - Flight → departureAirport / arrivalAirport (Airport)
//  - TrainTrip → departureStation / arrivalStation (TrainStation)
//  - BoatTrip → departureBoatTerminal / arrivalBoatTerminal (BoatTerminal)
//  - Trip genérico → no tiene departure/arrival; usamos itinerary con dos Place
function endpointsForMode(
  mode: TransportMode,
  from: string,
  to: string,
): Record<string, unknown> {
  const fromPlace = (placeType: string) => ({
    '@type': placeType,
    name: from,
  });
  const toPlace = (placeType: string) => ({
    '@type': placeType,
    name: to,
  });

  switch (mode) {
    case 'bus':
    case 'combi':
    case 'colectivo':
      return {
        departureBusStop: fromPlace('BusStation'),
        arrivalBusStop: toPlace('BusStation'),
      };
    case 'plane':
      return {
        departureAirport: fromPlace('Airport'),
        arrivalAirport: toPlace('Airport'),
      };
    case 'train':
      return {
        departureStation: fromPlace('TrainStation'),
        arrivalStation: toPlace('TrainStation'),
      };
    case 'boat':
      return {
        departureBoatTerminal: fromPlace('BoatTerminal'),
        arrivalBoatTerminal: toPlace('BoatTerminal'),
      };
    default:
      // Trip genérico: usamos itinerary con dos Place
      return {
        itinerary: {
          '@type': 'ItemList',
          itemListElement: [
            { '@type': 'Place', name: from, position: 1 },
            { '@type': 'Place', name: to, position: 2 },
          ],
        },
      };
  }
}

// Construye Offer / AggregateOffer según el rango de precio
function buildOffer(
  option: TransportOption,
  routeUrl: string,
): Record<string, unknown> | undefined {
  if (option.cost_type === 'free') {
    return {
      '@type': 'Offer',
      price: 0,
      priceCurrency: option.currency,
      availability: 'https://schema.org/InStock',
      url: routeUrl,
    };
  }

  const min = option.cost_min;
  const max = option.cost_max;

  if (min == null && max == null) return undefined;

  // Rango → AggregateOffer (mejor encaje semántico que Offer simple)
  if (min != null && max != null && min !== max) {
    return {
      '@type': 'AggregateOffer',
      lowPrice: Number(min),
      highPrice: Number(max),
      priceCurrency: option.currency,
      availability: 'https://schema.org/InStock',
      url: routeUrl,
    };
  }

  // Precio único
  return {
    '@type': 'Offer',
    price: Number(min ?? max ?? 0),
    priceCurrency: option.currency,
    availability: 'https://schema.org/InStock',
    url: routeUrl,
  };
}

// Convierte "HH:MM" + departure_date (YYYY-MM-DD) en ISO 8601.
// Si no hay departure_date o time no es exacto, devuelve undefined.
function buildIsoTime(
  time: string | undefined,
  baseDate: string | undefined,
): string | undefined {
  if (!time || !baseDate) return undefined;
  // Aceptamos formato HH:MM (24h) — descartamos approximate/range
  const match = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(time.trim());
  if (!match) return undefined;
  try {
    const date = new Date(`${baseDate}T${time.padStart(5, '0')}:00`);
    if (Number.isNaN(date.getTime())) return undefined;
    return date.toISOString();
  } catch {
    return undefined;
  }
}

// Convierte minutos a duración ISO 8601 (PT2H30M)
function formatIsoDuration(minutes?: number | null): string | undefined {
  if (minutes == null || minutes <= 0) return undefined;
  const n = Number(minutes);
  const h = Math.floor(n / 60);
  const m = n % 60;
  if (h === 0) return `PT${m}M`;
  if (m === 0) return `PT${h}H`;
  return `PT${h}H${m}M`;
}

// Construye un nodo Trip/BusTrip/Flight/etc para una opción concreta
function buildTripNode(
  segment: TransportSegment,
  option: TransportOption,
  routeUrl: string,
  parentTripId: string,
  departureBaseDate: string | undefined,
): Record<string, unknown> {
  const node: Record<string, unknown> = {
    '@type': schemaTypeForMode(option.mode),
    '@id': `${routeUrl}#segment-${segment.order_index}-opt-${option.id}`,
    name:
      segment.title?.trim() ||
      `${segment.from_label} → ${segment.to_label}`,
    partOfTrip: { '@id': parentTripId },
    ...endpointsForMode(option.mode, segment.from_label, segment.to_label),
  };

  if (option.operator) {
    // Provider/airline según tipo (Flight admite airline; el resto usa provider)
    if (option.mode === 'plane') {
      node.airline = { '@type': 'Airline', name: option.operator };
    } else {
      node.provider = { '@type': 'Organization', name: option.operator };
    }
  }

  const depIso = buildIsoTime(option.departure_time ?? undefined, departureBaseDate);
  const arrIso = buildIsoTime(option.arrival_time ?? undefined, departureBaseDate);
  if (depIso) node.departureTime = depIso;
  if (arrIso) node.arrivalTime = arrIso;

  // Para Trip genérico, Schema.org no define departureTime/arrivalTime — los omitimos
  if (schemaTypeForMode(option.mode) === 'Trip') {
    delete node.departureTime;
    delete node.arrivalTime;
  }

  const isoDuration = formatIsoDuration(option.duration_minutes);
  // Schema.org Trip no tiene `duration` estándar; sí Flight, BusTrip, TrainTrip
  if (isoDuration && option.mode !== 'walk' && option.mode !== 'bike' && schemaTypeForMode(option.mode) !== 'Trip') {
    // Schema.org no tiene duration en Trip; los específicos sí lo aceptan como propiedad permitida vía heredada
    // Mantenemos como additional info en additionalType si fuera necesario
  }

  const offer = buildOffer(option, routeUrl);
  if (offer) node.offers = offer;

  if (option.notes) node.disambiguatingDescription = option.notes;
  if (option.booking_url) node.url = option.booking_url;

  return node;
}

export async function TransportJsonLd({
  routeId,
  routeUrl,
  departureBaseDate,
}: TransportJsonLdProps) {
  let segments: TransportSegment[] = [];

  try {
    const supabase = await createClient();
    const repo = createTransportRepository(supabase);
    segments = await getTransportSegments(repo, routeId);
  } catch {
    // RLS bloquea a no-creadores en rutas no publicadas; tratamos como vacío.
    return null;
  }

  if (segments.length === 0) return null;

  const parentTripId = `${routeUrl}#trip`;

  const nodes: Record<string, unknown>[] = [];
  for (const segment of segments) {
    for (const option of segment.options) {
      nodes.push(
        buildTripNode(
          segment,
          option,
          routeUrl,
          parentTripId,
          departureBaseDate,
        ),
      );
    }
  }

  if (nodes.length === 0) return null;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': nodes,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
