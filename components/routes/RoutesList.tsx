'use client';

import { useState } from 'react';
import { useRoutes } from '@/lib/hooks/useRoutes';
import { RouteCard } from './RouteCard';
import { RouteFilters } from './RouteFilters';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { Mountain } from 'lucide-react';
import { RouteFilters as RouteFiltersType } from '@/types/route.types';

interface RoutesListProps {
  locale: string;
}

// Componente de listado de rutas con filtros
export function RoutesList({ locale }: RoutesListProps) {
  const [filters, setFilters] = useState<RouteFiltersType>({});
  const { routes, loading, error } = useRoutes(filters);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" text="Cargando rutas..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-lg bg-red-50 border border-red-200">
        <p className="text-sm text-red-600">
          Error al cargar las rutas: {error}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Sidebar: Filters */}
      <aside className="w-full lg:w-72 shrink-0">
        <div className="sticky top-24">
          <RouteFilters onFilterChange={setFilters} />
        </div>
      </aside>

      {/* Main Content: Route Grid */}
      <main className="flex-1">
        {routes.length === 0 ? (
          <EmptyState
            icon={Mountain}
            title="No se encontraron rutas"
            description="No hay rutas que coincidan con tus criterios de búsqueda. Intenta con otros filtros o crea la primera ruta."
          />
        ) : (
          <>
            {/* Header con contador y sort */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-foreground">
                Rutas Recomendadas
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {routes.length} {routes.length === 1 ? 'ruta' : 'rutas'}
                </span>
              </div>
            </div>

            {/* Grid de rutas - Diseño de code.html */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {routes.map((route) => (
                <RouteCard key={route.id} route={route} locale={locale} />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
