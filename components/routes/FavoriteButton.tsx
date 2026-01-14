'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils/cn';
import { useToast } from '@/components/ui/use-toast';

interface FavoriteButtonProps {
  routeId: string;
  initialFavorited?: boolean;
  initialCount?: number;
  showCount?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'icon';
  variant?: 'default' | 'ghost' | 'outline';
  className?: string;
  onToggle?: (isFavorite: boolean) => void;
}

export function FavoriteButton({
  routeId,
  initialFavorited = false,
  initialCount = 0,
  showCount = false,
  size = 'icon',
  variant = 'ghost',
  className,
  onToggle
}: FavoriteButtonProps) {
  const [isFavorited, setIsFavorited] = useState(initialFavorited);
  const [count, setCount] = useState(initialCount);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { toast } = useToast();
  const supabase = createClient();

  // Verificar autenticación y estado de favorito
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);

      if (user) {
        // Verificar si ya es favorito
        const { data } = await supabase
          .from('favorites')
          .select('id')
          .eq('user_id', user.id)
          .eq('route_id', routeId)
          .single();

        setIsFavorited(!!data);
      }
    };

    checkAuth();
  }, [routeId, supabase]);

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      toast({
        title: 'Inicia sesión',
        description: 'Debes iniciar sesión para guardar favoritos',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (isFavorited) {
        // Quitar de favoritos
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('route_id', routeId);

        if (error) throw error;

        setIsFavorited(false);
        setCount(prev => Math.max(0, prev - 1));

        toast({
          title: 'Eliminado de favoritos',
          description: 'La ruta se ha quitado de tus favoritos'
        });
      } else {
        // Agregar a favoritos
        const { error } = await supabase
          .from('favorites')
          .insert({
            user_id: user.id,
            route_id: routeId
          });

        if (error) {
          if (error.code === '23505') {
            // Ya existe, actualizar estado
            setIsFavorited(true);
            return;
          }
          throw error;
        }

        setIsFavorited(true);
        setCount(prev => prev + 1);

        toast({
          title: 'Agregado a favoritos',
          description: 'La ruta se ha guardado en tus favoritos'
        });
      }

      onToggle?.(!isFavorited);
    } catch (error: any) {
      console.error('Error toggling favorite:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar favoritos',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-9 w-9',
    lg: 'h-10 w-10',
    icon: 'h-9 w-9'
  };

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-5 w-5',
    icon: 'h-5 w-5'
  };

  if (showCount) {
    return (
      <Button
        variant={variant}
        size="sm"
        onClick={handleToggle}
        disabled={isLoading}
        className={cn(
          'gap-1.5',
          isFavorited && 'text-red-500 hover:text-red-600',
          className
        )}
      >
        <Heart
          className={cn(
            iconSizes[size],
            isFavorited && 'fill-current'
          )}
        />
        <span className="text-sm">{count}</span>
      </Button>
    );
  }

  return (
    <Button
      variant={variant}
      size="icon"
      onClick={handleToggle}
      disabled={isLoading}
      className={cn(
        sizeClasses[size],
        'rounded-full transition-all',
        isFavorited
          ? 'text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-950 dark:hover:bg-red-900'
          : 'hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950',
        className
      )}
      title={isFavorited ? 'Quitar de favoritos' : 'Agregar a favoritos'}
    >
      <Heart
        className={cn(
          iconSizes[size],
          isFavorited && 'fill-current',
          isLoading && 'animate-pulse'
        )}
      />
    </Button>
  );
}
