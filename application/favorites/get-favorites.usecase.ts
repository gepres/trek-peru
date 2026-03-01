import { IFavoriteRepository } from '@/domain/favorite/favorite.repository.interface';
import { RouteWithCreator } from '@/types/route.types';

// Caso de uso: obtener rutas favoritas del usuario con sus IDs
export async function getFavorites(
  favoriteRepo: IFavoriteRepository,
  userId: string,
): Promise<{ routes: RouteWithCreator[]; ids: Set<string> }> {
  const [routes, ids] = await Promise.all([
    favoriteRepo.findRoutesByUserId(userId),
    favoriteRepo.findIdsByUserId(userId),
  ]);

  return { routes, ids };
}
