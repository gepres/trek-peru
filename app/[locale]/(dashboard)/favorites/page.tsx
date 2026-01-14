'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Heart, Search, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { RouteWithCreator } from '@/types/route.types';
import { RouteCard } from '@/components/routes/RouteCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { Input } from '@/components/ui/input';
import { RouteListSkeleton } from '@/components/ui/skeleton';

interface FavoritesPageProps {
  params: Promise<{ locale: string }>;
}

export default function FavoritesPage({ params }: FavoritesPageProps) {
  const t = useTranslations('favorites');
  const [locale, setLocale] = useState('es');
  const [favorites, setFavorites] = useState<RouteWithCreator[]>([]);
  const [filteredFavorites, setFilteredFavorites] = useState<RouteWithCreator[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const supabase = createClient();

  // Obtener locale
  useEffect(() => {
    params.then(p => setLocale(p.locale));
  }, [params]);

  // Cargar favoritos
  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        setIsLoading(true);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setFavorites([]);
          setIsLoading(false);
          return;
        }

        // Obtener IDs de favoritos
        const { data: favoritesData, error: favError } = await supabase
          .from('favorites')
          .select('route_id')
          .eq('user_id', user.id);

        if (favError) throw favError;

        if (!favoritesData || favoritesData.length === 0) {
          setFavorites([]);
          setIsLoading(false);
          return;
        }

        const routeIds = favoritesData.map(f => f.route_id);

        // Obtener rutas completas
        const { data: routesData, error: routesError } = await supabase
          .from('routes')
          .select(`
            *,
            creator:profiles(id, username, full_name, avatar_url),
            attendees(count)
          `)
          .in('id', routeIds)
          .order('created_at', { ascending: false });

        if (routesError) throw routesError;

        setFavorites(routesData || []);
        setFilteredFavorites(routesData || []);
      } catch (error) {
        console.error('Error fetching favorites:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFavorites();
  }, [supabase]);

  // Filtrar por búsqueda
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredFavorites(favorites);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = favorites.filter(route =>
      route.title.toLowerCase().includes(query) ||
      route.description?.toLowerCase().includes(query) ||
      route.region?.toLowerCase().includes(query)
    );
    setFilteredFavorites(filtered);
  }, [searchQuery, favorites]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{t('title')}</h1>
          <p className="text-muted-foreground">{t('description')}</p>
        </div>
        <RouteListSkeleton count={6} />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-red-500/10">
            <Heart className="h-6 w-6 text-red-500" />
          </div>
          <h1 className="text-3xl font-bold">{t('title')}</h1>
        </div>
        <p className="text-muted-foreground">{t('description')}</p>
      </div>

      {favorites.length > 0 ? (
        <>
          {/* Barra de búsqueda */}
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder={t('searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Contador */}
          <div className="mb-4 text-sm text-muted-foreground">
            {filteredFavorites.length} {filteredFavorites.length === 1 ? t('routeSingular') : t('routePlural')}
            {searchQuery && ` ${t('matchingSearch')}`}
          </div>

          {/* Grid de rutas */}
          {filteredFavorites.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredFavorites.map((route) => (
                <RouteCard key={route.id} route={route} locale={locale} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Search}
              title={t('noResults')}
              description={t('noResultsDescription')}
            />
          )}
        </>
      ) : (
        <EmptyState
          icon={Heart}
          title={t('empty')}
          description={t('emptyDescription')}
          actionLabel={t('exploreRoutes')}
          actionHref={`/${locale}/routes`}
        />
      )}
    </div>
  );
}
