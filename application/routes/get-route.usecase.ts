import { IRouteRepository } from '@/domain/route/route.repository.interface';
import { RouteWithCreator } from '@/types/route.types';

// Caso de uso: obtener el detalle de una ruta por ID
export async function getRoute(
  routeRepo: IRouteRepository,
  routeId: string,
): Promise<RouteWithCreator | null> {
  return routeRepo.findById(routeId);
}
