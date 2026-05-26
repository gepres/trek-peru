import type { ITransportRepository } from '@/domain/transport/transport.repository.interface';
import type {
  TransportSegment,
  TransportSegmentForm,
} from '@/types/transport.types';

// Caso de uso: crear un nuevo tramo de transporte para una ruta
export async function createTransportSegment(
  transportRepo: ITransportRepository,
  routeId: string,
  data: TransportSegmentForm,
): Promise<TransportSegment> {
  return transportRepo.createSegment(routeId, data);
}
