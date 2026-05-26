'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { createTransportRepository } from '@/infrastructure/supabase';
import { getTransportSegments } from '@/application/transport';
import type { TransportSegment } from '@/types/transport.types';

interface UseTransportSegmentsReturn {
  segments: TransportSegment[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// Hook de lectura: tramos de transporte de una ruta
export function useTransportSegments(
  routeId: string,
): UseTransportSegmentsReturn {
  const [segments, setSegments] = useState<TransportSegment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const supabase = createClient();
      const repo = createTransportRepository(supabase);
      const data = await getTransportSegments(repo, routeId);
      setSegments(data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Error cargando tramos';
      console.error('useTransportSegments:', err);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [routeId]);

  useEffect(() => {
    void fetch();
  }, [fetch]);

  return { segments, isLoading, error, refetch: fetch };
}
