'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { RouteWithCreator, RouteFilters } from '@/types/route.types';

// Hook para obtener y gestionar rutas
export function useRoutes(filters?: RouteFilters) {
  const [routes, setRoutes] = useState<RouteWithCreator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    fetchRoutes();
  }, [filters]);

  // Obtener rutas con filtros
  async function fetchRoutes() {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('routes')
        .select(`
          *,
          creator:profiles(*),
          attendees(count)
        `)
        .eq('status', 'published')
        .eq('visibility', 'public')
        .order('created_at', { ascending: false });

      // Aplicar filtros
      // Aplicar filtros
      if (filters?.difficulties && filters.difficulties.length > 0) {
        query = query.in('difficulty', filters.difficulties);
      }

      if (filters?.region) {
        query = query.eq('region', filters.region);
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
      setRoutes(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error fetching routes:', err);
    } finally {
      setLoading(false);
    }
  }

  return { routes, loading, error, refetch: fetchRoutes };
}

// Hook para obtener una ruta específica
export function useRoute(routeId: string) {
  const [route, setRoute] = useState<RouteWithCreator | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    if (routeId) {
      fetchRoute();
    }
  }, [routeId]);

  async function fetchRoute() {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('routes')
        .select(`
          *,
          creator:profiles(*),
          attendees(count)
        `)
        .eq('id', routeId)
        .single();

      if (error) throw error;
      setRoute(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error fetching route:', err);
    } finally {
      setLoading(false);
    }
  }

  return { route, loading, error, refetch: fetchRoute };
}

// Hook para obtener rutas del usuario autenticado
export function useMyRoutes() {
  const [routes, setRoutes] = useState<RouteWithCreator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    fetchMyRoutes();
  }, []);

  async function fetchMyRoutes() {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { data, error } = await supabase
        .from('routes')
        .select(`
          *,
          creator:profiles(*),
          attendees(count)
        `)
        .eq('creator_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRoutes(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error fetching my routes:', err);
    } finally {
      setLoading(false);
    }
  }

  return { routes, loading, error, refetch: fetchMyRoutes };
}
