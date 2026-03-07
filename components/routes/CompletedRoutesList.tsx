'use client';

import { useState } from 'react';
import { useCompletedRoutes } from '@/presentation/hooks/useRoutes';
import { RouteCard } from './RouteCard';
import { RouteFilters } from './RouteFilters';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { History, SlidersHorizontal, ChevronDown, X } from 'lucide-react';
import { RouteFilters as RouteFiltersType } from '@/types/route.types';
import { cn } from '@/lib/utils/cn';

interface CompletedRoutesListProps {
  locale: string;
}

// Cuenta cuántos grupos de filtros están activos
function countActiveFilters(filters: RouteFiltersType): number {
  return [
    (filters.difficulties?.length ?? 0) > 0,
    (filters.regions?.length ?? 0) > 0,
    filters.max_altitude != null,
    filters.max_duration != null,
    filters.max_distance != null,
    filters.date_from != null || filters.date_to != null,
  ].filter(Boolean).length;
}

// Listado de rutas completadas con filtros — sin opción de inscripción
export function CompletedRoutesList({ locale }: CompletedRoutesListProps) {
  const [filters, setFilters] = useState<RouteFiltersType>({});
  const [filtersOpen, setFiltersOpen] = useState(false);
  const { routes, loading, error } = useCompletedRoutes(filters);

  const activeFiltersCount = countActiveFilters(filters);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" text="Cargando rutas completadas..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-lg bg-red-50 border border-red-200">
        <p className="text-sm text-red-600">Error al cargar las rutas: {error}</p>
      </div>
    );
  }

  return (
    <div>
      {/* ── Toggle filtros en mobile ── */}
      <div className="lg:hidden mb-4 flex items-center gap-3">
        <button
          onClick={() => setFiltersOpen((v) => !v)}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors',
            filtersOpen
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-border bg-card hover:bg-muted text-foreground',
          )}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filtros
          {activeFiltersCount > 0 && (
            <span className="bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-none">
              {activeFiltersCount}
            </span>
          )}
          <ChevronDown
            className={cn(
              'h-4 w-4 text-muted-foreground transition-transform duration-200',
              filtersOpen && 'rotate-180',
            )}
          />
        </button>

        {activeFiltersCount > 0 && (
          <button
            onClick={() => { setFilters({}); setFiltersOpen(false); }}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors font-medium"
          >
            <X className="h-3.5 w-3.5" />
            Limpiar
          </button>
        )}
      </div>

      {/* ── Layout principal ── */}
      <div className="flex flex-col lg:flex-row gap-8">

        {/* Sidebar filtros */}
        <aside className={cn('w-full lg:w-72 shrink-0', !filtersOpen && 'hidden lg:block')}>
          <div className="lg:sticky lg:top-24">
            <RouteFilters
              onFilterChange={setFilters}
              onApplied={() => setFiltersOpen(false)}
              hideDateFilter
            />
          </div>
        </aside>

        {/* Grid de rutas */}
        <main className="flex-1">
          {routes.length === 0 ? (
            <EmptyState
              icon={History}
              title="No hay rutas completadas"
              description="Aún no hay rutas completadas que coincidan con tus filtros."
            />
          ) : (
            <>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-foreground">
                  Rutas Completadas
                </h2>
                <span className="text-sm text-muted-foreground">
                  {routes.length} {routes.length === 1 ? 'ruta' : 'rutas'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {routes.map((route) => (
                  <RouteCard key={route.id} route={route} locale={locale} />
                ))}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
