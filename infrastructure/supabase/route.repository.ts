import { SupabaseClient } from '@supabase/supabase-js';
import { RouteWithCreator, RouteFilters, RouteForm, Route } from '@/types/route.types';
import { IRouteRepository } from '@/domain/route/route.repository.interface';

// Repositorio de acceso a datos para rutas — implementa IRouteRepository
export function createRouteRepository(supabase: SupabaseClient): IRouteRepository {
  // Selección base con relaciones
  const BASE_SELECT = `
    *,
    creator:profiles(*),
    attendees(count)
  `;

  return {
    // Obtener rutas públicas publicadas con filtros opcionales
    async findPublished(filters?: RouteFilters): Promise<RouteWithCreator[]> {
      let query = supabase
        .from('routes')
        .select(BASE_SELECT)
        .eq('status', 'published')
        .eq('visibility', 'public')
        .order('created_at', { ascending: false });

      if (filters?.difficulties && filters.difficulties.length > 0) {
        query = query.in('difficulty', filters.difficulties);
      }
      if (filters?.regions && filters.regions.length > 0) {
        query = query.in('region', filters.regions);
      }
      if (filters?.search) {
        query = query.textSearch('search_vector', filters.search);
      }
      if (filters?.min_distance) {
        query = query.gte('distance', filters.min_distance);
      }
      if (filters?.max_distance) {
        query = query.lte('distance', filters.max_distance);
      }
      if (filters?.date_from) {
        query = query.gte('departure_date', filters.date_from);
      }
      if (filters?.date_to) {
        query = query.lte('departure_date', filters.date_to);
      }
      if (filters?.max_altitude) {
        query = query.lte('max_altitude', filters.max_altitude);
      }
      if (filters?.min_duration) {
        query = query.gte('estimated_duration', filters.min_duration);
      }
      if (filters?.max_duration) {
        query = query.lte('estimated_duration', filters.max_duration);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },

    // Obtener una ruta por ID
    async findById(id: string): Promise<RouteWithCreator | null> {
      const { data, error } = await supabase
        .from('routes')
        .select(BASE_SELECT)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },

    // Obtener rutas creadas por un usuario
    async findByCreatorId(creatorId: string): Promise<RouteWithCreator[]> {
      const { data, error } = await supabase
        .from('routes')
        .select(BASE_SELECT)
        .eq('creator_id', creatorId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },

    // Crear una nueva ruta
    async create(routeData: RouteForm, creatorId: string): Promise<Route> {
      const { data, error } = await supabase
        .from('routes')
        .insert({ ...routeData, creator_id: creatorId })
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    // Actualizar una ruta existente
    async update(id: string, routeData: Partial<RouteForm>): Promise<Route> {
      const { data, error } = await supabase
        .from('routes')
        .update(routeData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    // Eliminar una ruta
    async deleteById(id: string): Promise<void> {
      const { error } = await supabase
        .from('routes')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
  };
}

export type RouteRepository = ReturnType<typeof createRouteRepository>;
