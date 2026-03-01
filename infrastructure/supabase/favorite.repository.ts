import { SupabaseClient } from '@supabase/supabase-js';
import { RouteWithCreator } from '@/types/route.types';
import { IFavoriteRepository } from '@/domain/favorite/favorite.repository.interface';

// Repositorio de acceso a datos para favoritos — implementa IFavoriteRepository
export function createFavoriteRepository(supabase: SupabaseClient): IFavoriteRepository {
  return {
    // Obtener solo los IDs de rutas favoritas de un usuario
    async findIdsByUserId(userId: string): Promise<Set<string>> {
      const { data, error } = await supabase
        .from('favorites')
        .select('route_id')
        .eq('user_id', userId);

      if (error) throw error;
      return new Set(data?.map((f) => f.route_id) ?? []);
    },

    // Obtener las rutas completas favoritas de un usuario
    async findRoutesByUserId(userId: string): Promise<RouteWithCreator[]> {
      const ids = await this.findIdsByUserId(userId);
      if (ids.size === 0) return [];

      const { data, error } = await supabase
        .from('routes')
        .select(`
          *,
          creator:profiles(id, username, full_name, avatar_url),
          attendees(count)
        `)
        .in('id', Array.from(ids))
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },

    // Verificar si una ruta es favorita para un usuario
    async findByRouteAndUser(routeId: string, userId: string): Promise<boolean> {
      const { data, error } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', userId)
        .eq('route_id', routeId)
        .single();

      if (error) return false;
      return !!data;
    },

    // Agregar una ruta a favoritos
    async add(userId: string, routeId: string): Promise<void> {
      const { error } = await supabase
        .from('favorites')
        .insert({ user_id: userId, route_id: routeId });

      // Ignorar error de duplicado (clave única)
      if (error && error.code !== '23505') throw error;

      // Incrementar contador en la ruta
      await supabase.rpc('increment_favorites', { route_id: routeId });
    },

    // Quitar una ruta de favoritos
    async remove(userId: string, routeId: string): Promise<void> {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', userId)
        .eq('route_id', routeId);

      if (error) throw error;

      // Decrementar contador en la ruta
      await supabase.rpc('decrement_favorites', { route_id: routeId });
    },
  };
}

export type FavoriteRepository = ReturnType<typeof createFavoriteRepository>;
