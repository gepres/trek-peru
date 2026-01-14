'use client';

import { useAttendees } from '@/lib/hooks/useAttendees';
import { AttendeeCard } from './AttendeeCard';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { Users } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from '@/components/ui/use-toast';

interface AttendeesListProps {
  routeId: string;
  creatorId: string;
  currentUserId?: string;
}

// Componente para mostrar la lista de asistentes de una ruta
export function AttendeesList({ routeId, creatorId, currentUserId }: AttendeesListProps) {
  const { attendees, loading, error, refetch } = useAttendees(routeId);
  const supabase = createClient();
  const isCreator = currentUserId === creatorId;

  // Confirmar asistente
  async function handleConfirm(attendeeId: string) {
    try {
      const { error } = await supabase
        .from('attendees')
        .update({
          status: 'confirmed',
          confirmation_date: new Date().toISOString()
        })
        .eq('id', attendeeId);

      if (error) throw error;

      toast({
        title: 'Asistente confirmado',
        description: 'El asistente ha sido confirmado exitosamente.',
      });

      refetch();
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'No se pudo confirmar el asistente',
        variant: 'destructive',
      });
    }
  }

  // Rechazar asistente
  async function handleReject(attendeeId: string) {
    try {
      const { error } = await supabase
        .from('attendees')
        .update({
          status: 'cancelled',
          cancellation_date: new Date().toISOString()
        })
        .eq('id', attendeeId);

      if (error) throw error;

      toast({
        title: 'Asistente rechazado',
        description: 'El asistente ha sido rechazado.',
      });

      refetch();
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'No se pudo rechazar el asistente',
        variant: 'destructive',
      });
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" text="Cargando asistentes..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-lg bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800">
        <p className="text-sm text-red-600 dark:text-red-400">
          Error al cargar asistentes: {error}
        </p>
      </div>
    );
  }

  if (attendees.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="Aún no hay asistentes"
        description="Sé el primero en inscribirte a esta aventura."
      />
    );
  }

  // Agrupar asistentes por estado
  const confirmedAttendees = attendees.filter(a => a.status === 'confirmed');
  const pendingAttendees = attendees.filter(a => a.status === 'pending');
  const waitingListAttendees = attendees.filter(a => a.status === 'waiting_list');

  return (
    <div className="space-y-6">
      {/* Resumen */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span className="font-medium">
          {attendees.length} {attendees.length === 1 ? 'asistente inscrito' : 'asistentes inscritos'}
        </span>
        {confirmedAttendees.length > 0 && (
          <span className="text-green-600 dark:text-green-400">
            {confirmedAttendees.length} confirmado{confirmedAttendees.length !== 1 ? 's' : ''}
          </span>
        )}
        {pendingAttendees.length > 0 && (
          <span className="text-yellow-600 dark:text-yellow-400">
            {pendingAttendees.length} pendiente{pendingAttendees.length !== 1 ? 's' : ''}
          </span>
        )}
        {waitingListAttendees.length > 0 && (
          <span className="text-blue-600 dark:text-blue-400">
            {waitingListAttendees.length} en lista de espera
          </span>
        )}
      </div>

      {/* Asistentes confirmados */}
      {confirmedAttendees.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Confirmados ({confirmedAttendees.length})
          </h3>
          <div className="space-y-3">
            {confirmedAttendees.map((attendee) => (
              <AttendeeCard
                key={attendee.id}
                attendee={attendee}
                isCreator={isCreator}
                onConfirm={handleConfirm}
                onReject={handleReject}
              />
            ))}
          </div>
        </div>
      )}

      {/* Asistentes pendientes */}
      {pendingAttendees.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Pendientes de Confirmación ({pendingAttendees.length})
          </h3>
          <div className="space-y-3">
            {pendingAttendees.map((attendee) => (
              <AttendeeCard
                key={attendee.id}
                attendee={attendee}
                isCreator={isCreator}
                onConfirm={handleConfirm}
                onReject={handleReject}
              />
            ))}
          </div>
        </div>
      )}

      {/* Lista de espera */}
      {waitingListAttendees.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Lista de Espera ({waitingListAttendees.length})
          </h3>
          <div className="space-y-3">
            {waitingListAttendees.map((attendee) => (
              <AttendeeCard
                key={attendee.id}
                attendee={attendee}
                isCreator={isCreator}
                onConfirm={handleConfirm}
                onReject={handleReject}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
