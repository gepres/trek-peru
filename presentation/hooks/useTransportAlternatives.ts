'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { createTransportRepository } from '@/infrastructure/supabase';
import { suggestTransportAlternatives } from '@/application/transport';
import type {
  AggregatedAlternative,
  TransportSegment,
} from '@/types/transport.types';

interface UseTransportAlternativesReturn {
  alternatives: AggregatedAlternative[];
  isLoading: boolean;
  error: string | null;
}

// Umbral: si el corpus crowdsourced tiene menos de N alternativas, pedir
// sugerencias adicionales al endpoint IA. Mantiene latencia razonable en
// segmentos populares (muchos datos comunitarios) y enriquece los nuevos.
const AI_FALLBACK_THRESHOLD = 2;

// Llama al endpoint /api/transport/ai-suggest. Cualquier error → []
async function fetchAiSuggestions(
  from: string,
  to: string,
): Promise<AggregatedAlternative[]> {
  try {
    const res = await fetch('/api/transport/ai-suggest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to }),
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { suggestions?: AggregatedAlternative[] };
    return Array.isArray(data.suggestions) ? data.suggestions : [];
  } catch (err) {
    console.error('fetchAiSuggestions:', err);
    return [];
  }
}

// Hook del FLUJO DINÁMICO:
//  1. Busca alternativas crowdsourced en el corpus de la plataforma.
//  2. Si hay menos del umbral, complementa con sugerencias IA del endpoint.
//  3. Filtra duplicados por modo+moneda — community gana sobre IA.
export function useTransportAlternatives(
  segment: TransportSegment | null,
): UseTransportAlternativesReturn {
  const [alternatives, setAlternatives] = useState<AggregatedAlternative[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!segment) {
      setAlternatives([]);
      return;
    }
    try {
      setIsLoading(true);
      setError(null);

      // 1. Corpus crowdsourced
      const repo = createTransportRepository(createClient());
      const community = await suggestTransportAlternatives(repo, segment);

      // 2. Si el corpus es escaso, complementar con IA (en paralelo no — primero
      //    evaluamos si vale la pena gastar la llamada).
      let merged = community;
      if (community.length < AI_FALLBACK_THRESHOLD) {
        const ai = await fetchAiSuggestions(
          segment.from_label,
          segment.to_label,
        );

        // Dedupe: modos cubiertos por el creador o por la comunidad ganan
        const covered = new Set<string>([
          ...segment.options.map((o) => `${o.mode}::${o.currency}`),
          ...community.map((c) => `${c.mode}::${c.currency}`),
        ]);
        const filteredAi = ai.filter(
          (a) => !covered.has(`${a.mode}::${a.currency}`),
        );

        merged = [...community, ...filteredAi];
      }

      setAlternatives(merged);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Error cargando alternativas';
      console.error('useTransportAlternatives:', err);
      setError(message);
      setAlternatives([]);
    } finally {
      setIsLoading(false);
    }
  }, [segment]);

  useEffect(() => {
    void load();
  }, [load]);

  return { alternatives, isLoading, error };
}
