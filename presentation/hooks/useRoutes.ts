'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { createRouteRepository } from '@/infrastructure/supabase';
import { getRoutes, getRoute, getMyRoutes } from '@/application/routes';
import { RouteWithCreator, RouteFilters } from '@/types/route.types';

// Hook para obtener y gestionar rutas públicas con filtros
export function useRoutes(filters?: RouteFilters) {
  const [routes, setRoutes] = useState<RouteWithCreator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRoutes();
  }, [filters]);

  async function fetchRoutes() {
    try {
      setLoading(true);
      setError(null);

      const repository = createRouteRepository(createClient());
      const data = await getRoutes(repository, filters);
      setRoutes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error fetching routes:', err);
    } finally {
      setLoading(false);
    }
  }

  return { routes, loading, error, refetch: fetchRoutes };
}

// Hook para obtener una ruta específica por ID
export function useRoute(routeId: string) {
  const [route, setRoute] = useState<RouteWithCreator | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (routeId) {
      fetchRoute();
    }
  }, [routeId]);

  async function fetchRoute() {
    try {
      setLoading(true);
      setError(null);

      const repository = createRouteRepository(createClient());
      const data = await getRoute(repository, routeId);
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

// Hook para obtener rutas creadas por el usuario autenticado
export function useMyRoutes() {
  const [routes, setRoutes] = useState<RouteWithCreator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMyRoutes();
  }, []);

  async function fetchMyRoutes() {
    try {
      setLoading(true);
      setError(null);

      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const repository = createRouteRepository(supabase);
      const data = await getMyRoutes(repository, user.id);
      setRoutes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error fetching my routes:', err);
    } finally {
      setLoading(false);
    }
  }

  return { routes, loading, error, refetch: fetchMyRoutes };
}
