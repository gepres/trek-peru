'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
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

  // Cargar favoritos del usuario
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

      // Obtener IDs de favoritos
      const { data: favoritesData, error: favError } = await supabase
        .from('favorites')
        .select('route_id')
        .eq('user_id', user.id);

      if (favError) throw favError;

      const ids = new Set(favoritesData?.map(f => f.route_id) || []);
      setFavoriteIds(ids);

      // Si hay favoritos, obtener las rutas completas
      if (ids.size > 0) {
        const { data: routesData, error: routesError } = await supabase
          .from('routes')
          .select(`
            *,
            creator:profiles(id, username, full_name, avatar_url),
            attendees(count)
          `)
          .in('id', Array.from(ids))
          .order('created_at', { ascending: false });

        if (routesError) throw routesError;
        setFavorites(routesData || []);
      } else {
        setFavorites([]);
      }
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

  // Agregar a favoritos
  const addFavorite = useCallback(async (routeId: string): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Debes iniciar sesión para agregar favoritos');
        return false;
      }

      const { error: insertError } = await supabase
        .from('favorites')
        .insert({
          user_id: user.id,
          route_id: routeId
        });

      if (insertError) {
        // Si ya existe, ignorar el error
        if (insertError.code === '23505') {
          return true;
        }
        throw insertError;
      }

      // Actualizar estado local
      setFavoriteIds(prev => new Set([...prev, routeId]));

      // Incrementar contador en la ruta (optimistic update)
      await supabase.rpc('increment_favorites', { route_id: routeId });

      return true;
    } catch (err: any) {
      console.error('Error adding favorite:', err);
      setError(err.message || 'Error al agregar favorito');
      return false;
    }
  }, [supabase]);

  // Quitar de favoritos
  const removeFavorite = useCallback(async (routeId: string): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Debes iniciar sesión');
        return false;
      }

      const { error: deleteError } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('route_id', routeId);

      if (deleteError) throw deleteError;

      // Actualizar estado local
      setFavoriteIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(routeId);
        return newSet;
      });

      // Decrementar contador en la ruta
      await supabase.rpc('decrement_favorites', { route_id: routeId });

      // Actualizar lista de favoritos
      setFavorites(prev => prev.filter(r => r.id !== routeId));

      return true;
    } catch (err: any) {
      console.error('Error removing favorite:', err);
      setError(err.message || 'Error al quitar favorito');
      return false;
    }
  }, [supabase]);

  // Toggle favorito
  const toggleFavorite = useCallback(async (routeId: string): Promise<boolean> => {
    if (isFavorite(routeId)) {
      return removeFavorite(routeId);
    } else {
      return addFavorite(routeId);
    }
  }, [isFavorite, addFavorite, removeFavorite]);

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

        const { data, error } = await supabase
          .from('favorites')
          .select('id')
          .eq('user_id', user.id)
          .eq('route_id', routeId)
          .single();

        setIsFavorite(!!data && !error);
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
