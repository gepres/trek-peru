'use client';

import { useMyRoutes } from '@/lib/hooks/useRoutes';
import { RouteCard } from './RouteCard';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { Mountain } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface MyRoutesListProps {
  locale: string;
}

// Componente para mostrar las rutas del usuario autenticado
export function MyRoutesList({ locale }: MyRoutesListProps) {
  const { routes, loading, error } = useMyRoutes();
  const router = useRouter();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" text="Cargando tus rutas..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-lg bg-red-50 border border-red-200">
        <p className="text-sm text-red-600">
          Error al cargar tus rutas: {error}
        </p>
      </div>
    );
  }

  if (routes.length === 0) {
    return (
      <EmptyState
        icon={Mountain}
        title="No has creado ninguna ruta"
        description="Comienza a compartir tus aventuras creando tu primera ruta de trekking."
        action={{
          label: 'Crear Mi Primera Ruta',
          onClick: () => router.push(`/${locale}/routes/new`),
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-sm text-muted-foreground">
        {routes.length} {routes.length === 1 ? 'ruta creada' : 'rutas creadas'}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {routes.map((route) => (
          <RouteCard key={route.id} route={route} locale={locale} />
        ))}
      </div>
    </div>
  );
}
