import type { ITransportRepository } from '@/domain/transport/transport.repository.interface';
import type {
  TransportOption,
  TransportOptionForm,
} from '@/types/transport.types';

// Caso de uso: actualizar una opción de transporte
export async function updateTransportOption(
  transportRepo: ITransportRepository,
  optionId: string,
  data: Partial<TransportOptionForm>,
): Promise<TransportOption> {
  return transportRepo.updateOption(optionId, data);
}
