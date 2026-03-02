'use client';

import { useState } from 'react';
import { useMyRoutes } from '@/presentation/hooks/useRoutes';
import { useStorageDelete } from '@/presentation/hooks/useStorageDelete';
import { useToast } from '@/components/ui/use-toast';
import { RouteCard } from './RouteCard';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { Mountain, Users, Trash2, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import Link from 'next/link';
import { RouteWithCreator } from '@/types/route.types';

interface MyRoutesListProps {
  locale: string;
}

// Componente para mostrar las rutas del usuario autenticado con gestión (editar, asistentes, eliminar)
export function MyRoutesList({ locale }: MyRoutesListProps) {
  const { routes, loading, error, removeRoute, deletingId } = useMyRoutes();
  const { deleteFile } = useStorageDelete();
  const { toast } = useToast();
  const router = useRouter();

  // Ruta pendiente de confirmar eliminación
  const [routeToDelete, setRouteToDelete] = useState<RouteWithCreator | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  // Confirma y ejecuta la eliminación: limpia Storage primero, luego borra la BD
  async function handleConfirmDelete() {
    if (!routeToDelete) return;

    try {
      setIsDeleting(true);

      // Eliminar archivos del Storage asociados a la ruta
      const storageCleanup: Promise<void>[] = [];

      if (routeToDelete.featured_image) {
        storageCleanup.push(
          deleteFile(routeToDelete.featured_image, 'route-images').catch(() => {
            // No bloquear si falla la limpieza de storage
          })
        );
      }
      if (routeToDelete.images?.length) {
        routeToDelete.images.forEach((url) => {
          storageCleanup.push(
            deleteFile(url, 'route-images').catch(() => {})
          );
        });
      }
      if (routeToDelete.gpx_file) {
        storageCleanup.push(
          deleteFile(routeToDelete.gpx_file, 'route-gpx').catch(() => {})
        );
      }

      await Promise.all(storageCleanup);

      // Eliminar la ruta de la base de datos
      await removeRoute(routeToDelete.id);

      toast({
        title: 'Ruta eliminada',
        description: `"${routeToDelete.title}" fue eliminada correctamente.`,
      });
    } catch (err) {
      toast({
        title: 'Error al eliminar',
        description: err instanceof Error ? err.message : 'Ocurrió un error inesperado.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setRouteToDelete(null);
    }
  }

  return (
    <>
      <div className="space-y-6">
        <div className="text-sm text-muted-foreground">
          {routes.length} {routes.length === 1 ? 'ruta creada' : 'rutas creadas'}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {routes.map((route) => (
            <div
              key={route.id}
              className={`space-y-2 mb-10 transition-opacity duration-200 ${
                deletingId === route.id ? 'opacity-50 pointer-events-none' : ''
              }`}
            >
              <RouteCard route={route} locale={locale} />

              {/* Acciones del creador */}
              <div className="flex gap-2">
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="flex-1 gap-2"
                >
                  <Link href={`/${locale}/my-routes/${route.id}/attendees`}>
                    <Users className="h-3.5 w-3.5" />
                    Asistentes
                  </Link>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-300"
                  onClick={() => setRouteToDelete(route)}
                  disabled={deletingId === route.id}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Eliminar
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Diálogo de confirmación de eliminación */}
      <Dialog open={!!routeToDelete} onOpenChange={(open) => { if (!open && !isDeleting) setRouteToDelete(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Eliminar ruta
            </DialogTitle>
            <DialogDescription className="pt-1">
              ¿Estás seguro de que deseas eliminar{' '}
              <span className="font-semibold text-foreground">
                &ldquo;{routeToDelete?.title}&rdquo;
              </span>
              ? Esta acción no se puede deshacer. Se eliminarán también todas las imágenes y el archivo GPX asociados.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setRouteToDelete(null)}
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="gap-2"
            >
              {isDeleting ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent" />
                  Eliminando...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Sí, eliminar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
