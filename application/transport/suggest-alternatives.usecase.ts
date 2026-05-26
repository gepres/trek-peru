import type { ITransportRepository } from '@/domain/transport/transport.repository.interface';
import type {
  AggregatedAlternative,
  TransportSegment,
} from '@/types/transport.types';

// Caso de uso del FLUJO DINÁMICO:
// dado un segmento (con sus opciones del creador), buscar alternativas
// crowdsourced en el corpus de la plataforma y filtrar las que ya están
// cubiertas por el creador (mismo modo + misma moneda).
export async function suggestTransportAlternatives(
  transportRepo: ITransportRepository,
  segment: TransportSegment,
): Promise<AggregatedAlternative[]> {
  const community = await transportRepo.findAlternativesForLeg(
    segment.from_label,
    segment.to_label,
    segment.id,
  );

  // Set de "modo+moneda" cubiertos manualmente por el creador
  const covered = new Set(
    segment.options.map((o) => `${o.mode}::${o.currency}`),
  );

  return community.filter(
    (alt) => !covered.has(`${alt.mode}::${alt.currency}`),
  );
}
