'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AttendeesList } from './AttendeesList';
import { useMyAttendance } from '@/presentation/hooks/useAttendees';
import { createClient } from '@/lib/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Users, UserPlus, UserMinus } from 'lucide-react';

interface RouteActionsProps {
  routeId: string;
  routeSlug: string;
  creatorId: string;
  currentUserId?: string;
  isCreator: boolean;
  status: string;
  maxCapacity?: number;
  currentAttendees: number;
}

// Componente para manejar las acciones de la ruta (inscripción, cancelación, lista de asistentes)
export function RouteActions({
  routeId,
  routeSlug,
  creatorId,
  currentUserId,
  isCreator,
  status,
  maxCapacity,
  currentAttendees,
}: RouteActionsProps) {
  const { attendance, loading, refetch } = useMyAttendance(routeId);
  const [isRegistering, setIsRegistering] = useState(false);
  const supabase = createClient();

  // Verificar si la ruta está llena
  const isFull = maxCapacity ? currentAttendees >= maxCapacity : false;

  // Inscribirse a la ruta
  async function handleRegister() {
    if (!currentUserId) {
      toast({
        title: 'Debes iniciar sesión',
        description: 'Para inscribirte a una ruta debes tener una cuenta.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsRegistering(true);

      // Determinar el estado inicial basado en la capacidad
      const initialStatus = isFull ? 'waiting_list' : 'pending';

      const { error } = await supabase.from('attendees').insert({
        route_id: routeId,
        user_id: currentUserId,
        status: initialStatus,
        registration_date: new Date().toISOString(),
      });

      if (error) {
        // Si el error es por duplicado, mostrar mensaje específico
        if (error.code === '23505') {
          toast({
            title: 'Ya estás inscrito',
            description: 'Ya te has inscrito a esta ruta.',
            variant: 'destructive',
          });
        } else {
          throw error;
        }
      } else {
        toast({
          title: isFull ? 'Agregado a lista de espera' : 'Inscripción exitosa',
          description: isFull
            ? 'Has sido agregado a la lista de espera. El organizador te notificará si hay un lugar disponible.'
            : 'Tu inscripción ha sido registrada. El organizador la revisará pronto.',
        });
        refetch();
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'No se pudo completar la inscripción',
        variant: 'destructive',
      });
    } finally {
      setIsRegistering(false);
    }
  }

  // Cancelar inscripción
  async function handleCancel() {
    if (!attendance) return;

    try {
      setIsRegistering(true);

      const { error } = await supabase
        .from('attendees')
        .update({
          status: 'cancelled',
          cancellation_date: new Date().toISOString(),
        })
        .eq('id', attendance.id);

      if (error) throw error;

      toast({
        title: 'Inscripción cancelada',
        description: 'Tu inscripción ha sido cancelada.',
      });

      refetch();
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'No se pudo cancelar la inscripción',
        variant: 'destructive',
      });
    } finally {
      setIsRegistering(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Botón de inscripción/cancelación para no creadores */}
      {!isCreator && status === 'published' && (
        <Card>
          <CardContent className="pt-6">
            {loading ? (
              <Button className="w-full" size="lg" disabled>
                Cargando...
              </Button>
            ) : attendance && attendance.status !== 'cancelled' ? (
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-800 dark:text-blue-300 font-medium">
                    {attendance.status === 'confirmed' && 'Tu inscripción ha sido confirmada'}
                    {attendance.status === 'pending' && 'Tu inscripción está pendiente de confirmación'}
                    {attendance.status === 'waiting_list' && 'Estás en la lista de espera'}
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  size="lg"
                  onClick={handleCancel}
                  disabled={isRegistering}
                >
                  <UserMinus className="h-5 w-5 mr-2" />
                  Cancelar Inscripción
                </Button>
              </div>
            ) : (
              <Button
                className="w-full"
                size="lg"
                onClick={handleRegister}
                disabled={isRegistering || !currentUserId}
              >
                <UserPlus className="h-5 w-5 mr-2" />
                {isFull ? 'Unirme a Lista de Espera' : 'Inscribirse a la Ruta'}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Lista de asistentes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Asistentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AttendeesList
            routeId={routeId}
            creatorId={creatorId}
            currentUserId={currentUserId}
          />
        </CardContent>
      </Card>
    </div>
  );
}
