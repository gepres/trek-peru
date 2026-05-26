import type { ITransportRepository } from '@/domain/transport/transport.repository.interface';
import type {
  TransportSegment,
  TransportSegmentForm,
} from '@/types/transport.types';

// Caso de uso: actualizar un tramo de transporte existente
export async function updateTransportSegment(
  transportRepo: ITransportRepository,
  segmentId: string,
  data: Partial<TransportSegmentForm>,
): Promise<TransportSegment> {
  return transportRepo.updateSegment(segmentId, data);
}
