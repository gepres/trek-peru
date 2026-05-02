import { IRouteRepository } from '@/domain/route/route.repository.interface';

// Caso de uso: traspasar una ruta a otro usuario.
// La RPC valida el creador actual, resuelve email/username y actualiza solo el propietario.
export async function transferRoute(
  routeRepo: IRouteRepository,
  routeId: string,
  recipient: string,
): Promise<void> {
  return routeRepo.transferOwnership(routeId, recipient);
}
