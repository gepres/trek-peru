import { IRouteRepository } from '@/domain/route/route.repository.interface';
import { Route, RouteForm } from '@/types/route.types';

// Caso de uso: actualizar una ruta existente
export async function updateRoute(
  routeRepo: IRouteRepository,
  routeId: string,
  routeData: Partial<RouteForm>,
): Promise<Route> {
  return routeRepo.update(routeId, routeData);
}
