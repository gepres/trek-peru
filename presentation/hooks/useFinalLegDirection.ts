'use client';

import { useEffect, useState } from 'react';
import {
  getDirections,
  type DirectionsProfile,
  type DirectionsResult,
} from '@/lib/mapbox/directions';
import type { Coordinates } from '@/types/transport.types';

interface UseFinalLegDirectionParams {
  from?: Coordinates;
  to?: Coordinates;
  profile?: DirectionsProfile;
  // true → pide la geometría completa (más payload, requerido para dibujar mapa)
  includeGeometry?: boolean;
}

interface UseFinalLegDirectionReturn {
  result: DirectionsResult | null;
  isLoading: boolean;
}

// Hook que calcula el tramo final entre dos coordenadas usando Mapbox Directions.
// Si falta alguna coordenada o el token, retorna result=null silenciosamente.
export function useFinalLegDirection({
  from,
  to,
  profile = 'driving',
  includeGeometry = false,
}: UseFinalLegDirectionParams): UseFinalLegDirectionReturn {
  const [result, setResult] = useState<DirectionsResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!from || !to) {
      setResult(null);
      return;
    }

    const controller = new AbortController();
    setIsLoading(true);
    void getDirections(from, to, {
      profile,
      includeGeometry,
      signal: controller.signal,
    })
      .then((r) => {
        if (!controller.signal.aborted) setResult(r);
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [from?.lat, from?.lng, to?.lat, to?.lng, profile, includeGeometry]); // eslint-disable-line react-hooks/exhaustive-deps

  return { result, isLoading };
}
