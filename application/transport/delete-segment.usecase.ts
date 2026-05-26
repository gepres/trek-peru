import type { ITransportRepository } from '@/domain/transport/transport.repository.interface';

// Caso de uso: eliminar un tramo de transporte (cascada elimina sus opciones)
export async function deleteTransportSegment(
  transportRepo: ITransportRepository,
  segmentId: string,
): Promise<void> {
  return transportRepo.deleteSegment(segmentId);
}
