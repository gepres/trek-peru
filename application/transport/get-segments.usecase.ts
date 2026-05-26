import type { ITransportRepository } from '@/domain/transport/transport.repository.interface';
import type { TransportSegment } from '@/types/transport.types';

// Caso de uso: obtener tramos de transporte de una ruta (ordenados)
export async function getTransportSegments(
  transportRepo: ITransportRepository,
  routeId: string,
): Promise<TransportSegment[]> {
  return transportRepo.findByRouteId(routeId);
}
