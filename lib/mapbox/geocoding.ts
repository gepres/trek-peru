// Wrapper de Mapbox Geocoding API v6.
// Docs: https://docs.mapbox.com/api/search/geocoding-v6/
//
// Uso típico: autocompletar nombres de lugares en formularios y obtener
// coordenadas (lat/lng) + nombre canónico. País fijado a PE por defecto
// porque es el dominio de la app (mejora calidad y baja ambigüedad).

import type { Coordinates } from '@/types/transport.types';

export interface GeocodeResult {
  id: string;
  // Nombre principal ("Cusco")
  name: string;
  // Nombre completo con contexto ("Cusco, Cusco, Perú")
  fullName: string;
  coordinates: Coordinates;
  // Tipo de lugar devuelto por Mapbox (city, town, locality, etc.)
  placeType?: string;
}

interface MapboxFeature {
  id: string;
  type: 'Feature';
  properties: {
    name?: string;
    full_address?: string;
    place_formatted?: string;
    feature_type?: string;
    context?: Record<string, unknown>;
  };
  geometry: {
    type: 'Point';
    coordinates: [number, number]; // [lng, lat]
  };
}

interface MapboxResponse {
  type: 'FeatureCollection';
  features: MapboxFeature[];
}

const BASE_URL = 'https://api.mapbox.com/search/geocode/v6/forward';
const REVERSE_URL = 'https://api.mapbox.com/search/geocode/v6/reverse';

// Búsqueda forward: query → resultados ranqueados
export async function geocodeForward(
  query: string,
  options: {
    limit?: number;
    country?: string;
    proximity?: Coordinates;
    signal?: AbortSignal;
  } = {},
): Promise<GeocodeResult[]> {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (!token) {
    console.warn('NEXT_PUBLIC_MAPBOX_TOKEN no configurado');
    return [];
  }

  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const params = new URLSearchParams({
    q: trimmed,
    access_token: token,
    limit: String(options.limit ?? 5),
    country: options.country ?? 'pe',
    language: 'es',
  });
  if (options.proximity) {
    params.set('proximity', `${options.proximity.lng},${options.proximity.lat}`);
  }

  try {
    const res = await fetch(`${BASE_URL}?${params.toString()}`, {
      signal: options.signal,
    });
    if (!res.ok) return [];
    const data = (await res.json()) as MapboxResponse;

    return (data.features ?? []).map((f) => {
      const [lng, lat] = f.geometry.coordinates;
      return {
        id: f.id,
        name: f.properties.name ?? trimmed,
        fullName:
          f.properties.full_address ??
          f.properties.place_formatted ??
          f.properties.name ??
          trimmed,
        coordinates: { lat, lng },
        placeType: f.properties.feature_type,
      };
    });
  } catch (err) {
    if ((err as Error)?.name === 'AbortError') return [];
    console.error('geocodeForward:', err);
    return [];
  }
}

// Geocoding inverso: dadas coordenadas, devuelve el nombre canónico del lugar.
// Útil cuando guardamos coords pero el label se corrompió/perdió, o para
// mostrar el nombre real de un meeting_point que sólo tiene coordenadas.
export async function geocodeReverse(
  coordinates: Coordinates,
  options: {
    country?: string;
    signal?: AbortSignal;
  } = {},
): Promise<GeocodeResult | null> {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (!token) {
    console.warn('NEXT_PUBLIC_MAPBOX_TOKEN no configurado');
    return null;
  }

  const params = new URLSearchParams({
    longitude: String(coordinates.lng),
    latitude: String(coordinates.lat),
    access_token: token,
    limit: '1',
    country: options.country ?? 'pe',
    language: 'es',
  });

  try {
    const res = await fetch(`${REVERSE_URL}?${params.toString()}`, {
      signal: options.signal,
    });
    if (!res.ok) return null;
    const data = (await res.json()) as MapboxResponse;
    const f = data.features?.[0];
    if (!f) return null;
    const [lng, lat] = f.geometry.coordinates;
    return {
      id: f.id,
      name: f.properties.name ?? '',
      fullName:
        f.properties.full_address ??
        f.properties.place_formatted ??
        f.properties.name ??
        '',
      coordinates: { lat, lng },
      placeType: f.properties.feature_type,
    };
  } catch (err) {
    if ((err as Error)?.name === 'AbortError') return null;
    console.error('geocodeReverse:', err);
    return null;
  }
}
