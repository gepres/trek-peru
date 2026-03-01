import { IRouteRepository } from '@/domain/route/route.repository.interface';
import { Route, RouteForm } from '@/types/route.types';

// Caso de uso: crear una nueva ruta
export async function createRoute(
  routeRepo: IRouteRepository,
  routeData: RouteForm,
  creatorId: string,
): Promise<Route> {
  return routeRepo.create(routeData, creatorId);
}
