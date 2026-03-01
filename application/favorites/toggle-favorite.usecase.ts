import { IFavoriteRepository } from '@/domain/favorite/favorite.repository.interface';

// Caso de uso: agregar o quitar una ruta de favoritos según su estado actual
export async function toggleFavorite(
  favoriteRepo: IFavoriteRepository,
  userId: string,
  routeId: string,
): Promise<{ added: boolean }> {
  const isFav = await favoriteRepo.findByRouteAndUser(routeId, userId);

  if (isFav) {
    await favoriteRepo.remove(userId, routeId);
    return { added: false };
  } else {
    await favoriteRepo.add(userId, routeId);
    return { added: true };
  }
}
