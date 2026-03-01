import { IRouteRepository } from '@/domain/route/route.repository.interface';

// Caso de uso: eliminar una ruta
// Solo el creador puede eliminar su propia ruta (la RLS de Supabase lo garantiza a nivel DB)
export async function deleteRoute(
  routeRepo: IRouteRepository,
  routeId: string,
): Promise<void> {
  return routeRepo.deleteById(routeId);
}
