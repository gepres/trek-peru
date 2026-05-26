// Wrapper de Mapbox Directions API v5.
// Docs: https://docs.mapbox.com/api/navigation/directions/
//
// Uso típico: calcular el tramo final entre el último segmento de "cómo llegar"
// y el meeting_point de la ruta (en auto o caminando).

import type { Coordinates } from '@/types/transport.types';

export type DirectionsProfile = 'driving' | 'walking' | 'cycling';

export interface DirectionsResult {
  distanceMeters: number;
  durationSeconds: number;
  profile: DirectionsProfile;
  // GeoJSON LineString opcional para dibujar en mapa en el futuro
  geometry?: {
    type: 'LineString';
    coordinates: [number, number][];
  };
}

interface MapboxRoute {
  distance: number;
  duration: number;
  geometry?: {
    type: 'LineString';
    coordinates: [number, number][];
  };
}

interface MapboxResponse {
  routes?: MapboxRoute[];
  code?: string;
}

const BASE_URL = 'https://api.mapbox.com/directions/v5/mapbox';

export async function getDirections(
  from: Coordinates,
  to: Coordinates,
  options: {
    profile?: DirectionsProfile;
    includeGeometry?: boolean;
    signal?: AbortSignal;
  } = {},
): Promise<DirectionsResult | null> {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (!token) {
    console.warn('NEXT_PUBLIC_MAPBOX_TOKEN no configurado');
    return null;
  }

  const profile = options.profile ?? 'driving';
  // Mapbox espera coords como "lng,lat;lng,lat"
  const coordsStr = `${from.lng},${from.lat};${to.lng},${to.lat}`;

  const params = new URLSearchParams({
    access_token: token,
    overview: options.includeGeometry ? 'full' : 'false',
    geometries: 'geojson',
  });

  try {
    const res = await fetch(
      `${BASE_URL}/${profile}/${coordsStr}?${params.toString()}`,
      { signal: options.signal },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as MapboxResponse;
    const route = data.routes?.[0];
    if (!route) return null;

    return {
      distanceMeters: route.distance,
      durationSeconds: route.duration,
      profile,
      geometry: options.includeGeometry ? route.geometry : undefined,
    };
  } catch (err) {
    if ((err as Error)?.name === 'AbortError') return null;
    console.error('getDirections:', err);
    return null;
  }
}
