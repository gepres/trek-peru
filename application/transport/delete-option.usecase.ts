import type { ITransportRepository } from '@/domain/transport/transport.repository.interface';

// Caso de uso: eliminar una opción de transporte
export async function deleteTransportOption(
  transportRepo: ITransportRepository,
  optionId: string,
): Promise<void> {
  return transportRepo.deleteOption(optionId);
}
