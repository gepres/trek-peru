// Cliente Rome2Rio — STUB (no implementado en Fase 3).
//
// Estado: pendiente de acceso al Rome2Rio Partner Program.
// https://www.rome2rio.com/business — la API completa no es self-service.
//
// Cuando esté disponible, este módulo:
//   1. Hará fetch a https://api.rome2rio.com/api/1.4/json/Search con la key
//   2. Mapeará el resultado a AggregatedAlternative[] con source='rome2rio'
//   3. Será llamado desde useTransportAlternatives sólo cuando from/to sean
//      ciudades grandes (Lima, Cusco, Arequipa, etc.) — el LLM y el corpus
//      crowdsourced cubren mejor el tramo "remoto" peruano.
//
// Por ahora exportamos un cliente que devuelve [] para evitar romper imports
// y permitir activación drop-in cuando se obtenga la key.

import type { AggregatedAlternative } from '@/types/transport.types';

export interface Rome2RioClient {
  search(from: string, to: string): Promise<AggregatedAlternative[]>;
}

export function createRome2RioClient(): Rome2RioClient {
  // Stub: hasta tener API key, retorna lista vacía silenciosamente.
  return {
    async search(_from: string, _to: string): Promise<AggregatedAlternative[]> {
      // TODO(rome2rio): implementar cuando se obtenga el acceso al Partner Program
      return [];
    },
  };
}
