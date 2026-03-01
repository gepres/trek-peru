'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { createFavoriteRepository } from '@/infrastructure/supabase';
import { getFavorites, toggleFavorite as toggleFavoriteUseCase } from '@/application/favorites';
import { Favorite } from '@/types/route.types';
import { RouteWithCreator } from '@/types/route.types';

interface UseFavoritesReturn {
  favorites: RouteWithCreator[];
  favoriteIds: Set<string>;
  isLoading: boolean;
  error: string | null;
  isFavorite: (routeId: string) => boolean;
  toggleFavorite: (routeId: string) => Promise<boolean>;
  addFavorite: (routeId: string) => Promise<boolean>;
  removeFavorite: (routeId: string) => Promise<boolean>;
  refetch: () => Promise<void>;
}

export function useFavorites(): UseFavoritesReturn {
  const [favorites, setFavorites] = useState<RouteWithCreator[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  // Cargar favoritos del usuario via use-case
  const fetchFavorites = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setFavorites([]);
        setFavoriteIds(new Set());
        setIsLoading(false);
        return;
      }

      const repository = createFavoriteRepository(supabase);
      const { routes, ids } = await getFavorites(repository, user.id);
      setFavorites(routes);
      setFavoriteIds(ids);
    } catch (err: any) {
      console.error('Error fetching favorites:', err);
      setError(err.message || 'Error al cargar favoritos');
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  // Verificar si una ruta es favorita
  const isFavorite = useCallback((routeId: string): boolean => {
    return favoriteIds.has(routeId);
  }, [favoriteIds]);

  // Agregar a favoritos via use-case
  const addFavorite = useCallback(async (routeId: string): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Debes iniciar sesión para agregar favoritos');
        return false;
      }

      const repository = createFavoriteRepository(supabase);
      await repository.add(user.id, routeId); // add directo: toggleFavorite haría fetch extra
      setFavoriteIds(prev => new Set([...prev, routeId]));
      return true;
    } catch (err: any) {
      console.error('Error adding favorite:', err);
      setError(err.message || 'Error al agregar favorito');
      return false;
    }
  }, [supabase]);

  // Quitar de favoritos via repositorio
  const removeFavorite = useCallback(async (routeId: string): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Debes iniciar sesión');
        return false;
      }

      const repository = createFavoriteRepository(supabase);
      await repository.remove(user.id, routeId);

      setFavoriteIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(routeId);
        return newSet;
      });
      setFavorites(prev => prev.filter(r => r.id !== routeId));

      return true;
    } catch (err: any) {
      console.error('Error removing favorite:', err);
      setError(err.message || 'Error al quitar favorito');
      return false;
    }
  }, [supabase]);

  // Toggle favorito via use-case (actualiza estado local optimistamente)
  const toggleFavorite = useCallback(async (routeId: string): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Debes iniciar sesión');
        return false;
      }

      const repository = createFavoriteRepository(supabase);
      const { added } = await toggleFavoriteUseCase(repository, user.id, routeId);

      if (added) {
        setFavoriteIds(prev => new Set([...prev, routeId]));
      } else {
        setFavoriteIds(prev => { const s = new Set(prev); s.delete(routeId); return s; });
        setFavorites(prev => prev.filter(r => r.id !== routeId));
      }
      return true;
    } catch (err: any) {
      setError(err.message || 'Error al cambiar favorito');
      return false;
    }
  }, [supabase]);

  // Cargar favoritos al montar
  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  // Escuchar cambios de autenticación
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchFavorites();
    });

    return () => subscription.unsubscribe();
  }, [supabase, fetchFavorites]);

  return {
    favorites,
    favoriteIds,
    isLoading,
    error,
    isFavorite,
    toggleFavorite,
    addFavorite,
    removeFavorite,
    refetch: fetchFavorites
  };
}

// Hook simplificado para verificar si una ruta específica es favorita
export function useIsFavorite(routeId: string) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const checkFavorite = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setIsFavorite(false);
          setIsLoading(false);
          return;
        }

        const repository = createFavoriteRepository(supabase);
        const result = await repository.findByRouteAndUser(routeId, user.id);
        setIsFavorite(result);
      } catch {
        setIsFavorite(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkFavorite();
  }, [routeId, supabase]);

  return { isFavorite, isLoading };
}
