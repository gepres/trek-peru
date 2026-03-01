import { RouteWithCreator } from '@/types/route.types';

// Contrato que cualquier implementación de repositorio de favoritos debe cumplir
export interface IFavoriteRepository {
  findIdsByUserId(userId: string): Promise<Set<string>>;
  findRoutesByUserId(userId: string): Promise<RouteWithCreator[]>;
  findByRouteAndUser(routeId: string, userId: string): Promise<boolean>;
  add(userId: string, routeId: string): Promise<void>;
  remove(userId: string, routeId: string): Promise<void>;
}
