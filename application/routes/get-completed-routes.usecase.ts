import { IRouteRepository } from '@/domain/route/route.repository.interface';
import { RouteWithCreator, RouteFilters } from '@/types/route.types';

// Obtiene las rutas con status 'completed' visibles públicamente.
// Las rutas completadas son de solo lectura — no se puede inscribir en ellas.
export async function getCompletedRoutes(
  repo: IRouteRepository,
  filters?: RouteFilters,
): Promise<RouteWithCreator[]> {
  return repo.findCompleted(filters);
}
