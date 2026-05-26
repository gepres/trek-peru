import type {
  TransportSegment,
  TransportSegmentForm,
  TransportOption,
  TransportOptionForm,
  AggregatedAlternative,
} from '@/types/transport.types';

// Contrato que cualquier implementación de repositorio de transporte debe cumplir.
// Cubre CRUD de segmentos y opciones + sugerencias agregadas crowdsourced.
export interface ITransportRepository {
  // Lectura: tramos de una ruta con sus opciones (ordenados)
  findByRouteId(routeId: string): Promise<TransportSegment[]>;

  // Segmentos
  createSegment(
    routeId: string,
    data: TransportSegmentForm,
  ): Promise<TransportSegment>;
  updateSegment(
    segmentId: string,
    data: Partial<TransportSegmentForm>,
  ): Promise<TransportSegment>;
  deleteSegment(segmentId: string): Promise<void>;
  reorderSegments(routeId: string, orderedIds: string[]): Promise<void>;

  // Opciones (alternativas dentro de un segmento)
  addOption(
    segmentId: string,
    data: TransportOptionForm,
  ): Promise<TransportOption>;
  updateOption(
    optionId: string,
    data: Partial<TransportOptionForm>,
  ): Promise<TransportOption>;
  deleteOption(optionId: string): Promise<void>;

  // Flujo dinámico — sugerencias agregadas del corpus de la plataforma
  findAlternativesForLeg(
    fromLabel: string,
    toLabel: string,
    excludeSegmentId?: string,
  ): Promise<AggregatedAlternative[]>;
}
