import type { ITransportRepository } from '@/domain/transport/transport.repository.interface';

// Caso de uso: reordenar los tramos de una ruta (drag and drop)
export async function reorderTransportSegments(
  transportRepo: ITransportRepository,
  routeId: string,
  orderedSegmentIds: string[],
): Promise<void> {
  return transportRepo.reorderSegments(routeId, orderedSegmentIds);
}
