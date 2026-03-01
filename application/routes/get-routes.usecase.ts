import { IRouteRepository } from '@/domain/route/route.repository.interface';
import { RouteFilters, RouteWithCreator } from '@/types/route.types';

// Caso de uso: obtener rutas públicas con filtros opcionales
export async function getRoutes(
  routeRepo: IRouteRepository,
  filters?: RouteFilters,
): Promise<RouteWithCreator[]> {
  return routeRepo.findPublished(filters);
}
