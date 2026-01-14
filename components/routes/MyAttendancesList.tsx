'use client';

import { useMyAttendances } from '@/lib/hooks/useAttendees';
import { RouteCard } from './RouteCard';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { Calendar, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface MyAttendancesListProps {
  locale: string;
}

// Componente para mostrar las asistencias del usuario agrupadas por estado
export function MyAttendancesList({ locale }: MyAttendancesListProps) {
  const { attendances, loading, error } = useMyAttendances();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" text="Cargando tus asistencias..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-lg bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800">
        <p className="text-sm text-red-600 dark:text-red-400">
          Error al cargar tus asistencias: {error}
        </p>
      </div>
    );
  }

  if (attendances.length === 0) {
    return (
      <EmptyState
        icon={Calendar}
        title="No estás inscrito en ninguna ruta"
        description="Explora las rutas disponibles y únete a una aventura."
      />
    );
  }

  // Agrupar asistencias por estado
  const confirmedAttendances = attendances.filter((a: any) => a.status === 'confirmed');
  const pendingAttendances = attendances.filter((a: any) => a.status === 'pending');
  const waitingListAttendances = attendances.filter((a: any) => a.status === 'waiting_list');
  const completedAttendances = attendances.filter((a: any) => a.status === 'completed');
  const cancelledAttendances = attendances.filter((a: any) => a.status === 'cancelled');

  // Colores de estado
  const statusColors: Record<string, string> = {
    confirmed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    waiting_list: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    completed: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  };

  const statusLabels: Record<string, string> = {
    confirmed: 'Confirmado',
    pending: 'Pendiente',
    waiting_list: 'Lista de Espera',
    completed: 'Completado',
    cancelled: 'Cancelado',
  };

  return (
    <div className="space-y-6">
      {/* Resumen */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {confirmedAttendances.length}
                </p>
                <p className="text-xs text-muted-foreground">Confirmadas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {pendingAttendances.length}
                </p>
                <p className="text-xs text-muted-foreground">Pendientes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {waitingListAttendances.length}
                </p>
                <p className="text-xs text-muted-foreground">En Espera</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {completedAttendances.length}
                </p>
                <p className="text-xs text-muted-foreground">Completadas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rutas confirmadas */}
      {confirmedAttendances.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Rutas Confirmadas ({confirmedAttendances.length})
            </CardTitle>
            <CardDescription>
              Rutas en las que tu participación ha sido confirmada
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {confirmedAttendances.map((attendance: any) => (
                <div key={attendance.id} className="relative">
                  <Badge
                    className={`absolute top-2 right-2 z-10 ${statusColors.confirmed}`}
                  >
                    {statusLabels.confirmed}
                  </Badge>
                  <RouteCard route={attendance.route} locale={locale} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rutas pendientes */}
      {pendingAttendances.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              Rutas Pendientes ({pendingAttendances.length})
            </CardTitle>
            <CardDescription>
              Rutas donde tu participación está pendiente de confirmación
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingAttendances.map((attendance: any) => (
                <div key={attendance.id} className="relative">
                  <Badge
                    className={`absolute top-2 right-2 z-10 ${statusColors.pending}`}
                  >
                    {statusLabels.pending}
                  </Badge>
                  <RouteCard route={attendance.route} locale={locale} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de espera */}
      {waitingListAttendances.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              Lista de Espera ({waitingListAttendances.length})
            </CardTitle>
            <CardDescription>
              Rutas en las que estás en lista de espera
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {waitingListAttendances.map((attendance: any) => (
                <div key={attendance.id} className="relative">
                  <Badge
                    className={`absolute top-2 right-2 z-10 ${statusColors.waiting_list}`}
                  >
                    {statusLabels.waiting_list}
                  </Badge>
                  <RouteCard route={attendance.route} locale={locale} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rutas completadas */}
      {completedAttendances.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-purple-600" />
              Rutas Completadas ({completedAttendances.length})
            </CardTitle>
            <CardDescription>
              Historial de rutas que has completado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {completedAttendances.map((attendance: any) => (
                <div key={attendance.id} className="relative">
                  <Badge
                    className={`absolute top-2 right-2 z-10 ${statusColors.completed}`}
                  >
                    {statusLabels.completed}
                  </Badge>
                  <RouteCard route={attendance.route} locale={locale} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rutas canceladas (opcional, si quieres mostrarlas) */}
      {cancelledAttendances.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              Rutas Canceladas ({cancelledAttendances.length})
            </CardTitle>
            <CardDescription>
              Inscripciones que has cancelado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {cancelledAttendances.map((attendance: any) => (
                <div key={attendance.id} className="relative opacity-60">
                  <Badge
                    className={`absolute top-2 right-2 z-10 ${statusColors.cancelled}`}
                  >
                    {statusLabels.cancelled}
                  </Badge>
                  <RouteCard route={attendance.route} locale={locale} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
