'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { createRouteRepository } from '@/infrastructure/supabase';
import { getRoutes, getRoute, getMyRoutes, deleteRoute, getCompletedRoutes } from '@/application/routes';
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

// Hook para obtener rutas completadas con filtros
export function useCompletedRoutes(filters?: RouteFilters) {
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
      const data = await getCompletedRoutes(repository, filters);
      setRoutes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  return { routes, loading, error, refetch: fetchRoutes };
}

// Hook para obtener y gestionar rutas creadas por el usuario autenticado
export function useMyRoutes() {
  const [routes, setRoutes] = useState<RouteWithCreator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  // Eliminar una ruta: borra de BD y actualiza lista local optimistamente
  async function removeRoute(routeId: string): Promise<void> {
    try {
      setDeletingId(routeId);
      const supabase = createClient();
      const repository = createRouteRepository(supabase);
      await deleteRoute(repository, routeId);
      setRoutes((prev) => prev.filter((r) => r.id !== routeId));
    } catch (err) {
      console.error('Error al eliminar ruta:', err);
      throw err;
    } finally {
      setDeletingId(null);
    }
  }

  return { routes, loading, error, refetch: fetchMyRoutes, removeRoute, deletingId };
}
