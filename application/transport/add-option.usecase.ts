import type { ITransportRepository } from '@/domain/transport/transport.repository.interface';
import type {
  TransportOption,
  TransportOptionForm,
} from '@/types/transport.types';

// Caso de uso: agregar una opción (alternativa) a un tramo
export async function addTransportOption(
  transportRepo: ITransportRepository,
  segmentId: string,
  data: TransportOptionForm,
): Promise<TransportOption> {
  return transportRepo.addOption(segmentId, data);
}
