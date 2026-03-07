import { RouteWithCreator, RouteFilters, RouteForm, Route } from '@/types/route.types';

// Contrato que cualquier implementación de repositorio de rutas debe cumplir
export interface IRouteRepository {
  findPublished(filters?: RouteFilters): Promise<RouteWithCreator[]>;
  findCompleted(filters?: RouteFilters): Promise<RouteWithCreator[]>;
  findById(id: string): Promise<RouteWithCreator | null>;
  findByCreatorId(creatorId: string): Promise<RouteWithCreator[]>;
  create(routeData: RouteForm, creatorId: string): Promise<Route>;
  update(id: string, routeData: Partial<RouteForm>): Promise<Route>;
  deleteById(id: string): Promise<void>;
}
