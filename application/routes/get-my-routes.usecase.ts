import { IRouteRepository } from '@/domain/route/route.repository.interface';
import { RouteWithCreator } from '@/types/route.types';

// Caso de uso: obtener rutas creadas por el usuario autenticado
export async function getMyRoutes(
  routeRepo: IRouteRepository,
  creatorId: string,
): Promise<RouteWithCreator[]> {
  return routeRepo.findByCreatorId(creatorId);
}
