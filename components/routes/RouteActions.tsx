'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AttendeesList } from './AttendeesList';
import { JoinRouteModal } from './JoinRouteModal';
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
  currentUserName?: string;
  currentUserPhone?: string;
  creatorPhone?: string;
  isCreator: boolean;
  status: string;
  maxCapacity?: number;
  currentAttendees: number;
  routeTitle: string;
  routeDate?: string;
}

// Componente para manejar las acciones de la ruta (inscripción, cancelación, lista de asistentes)
export function RouteActions({
  routeId,
  routeSlug,
  creatorId,
  currentUserId,
  currentUserName = 'Usuario',
  currentUserPhone,
  creatorPhone,
  isCreator,
  status,
  maxCapacity,
  currentAttendees,
  routeTitle,
  routeDate,
}: RouteActionsProps) {
  const { attendance, loading, refetch } = useMyAttendance(routeId);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const supabase = createClient();

  // Verificar si la ruta está llena
  const isFull = maxCapacity ? currentAttendees >= maxCapacity : false;

  // El usuario tiene una inscripción activa (cualquier estado salvo cancelado)
  const isActiveAttendee = !!attendance && attendance.status !== 'cancelled';

  // Cancelar inscripción
  async function handleCancel() {
    if (!attendance) return;

    try {
      setIsCancelling(true);

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
      setIsCancelling(false);
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
                    {attendance.status === 'confirmed' && '✅ Tu inscripción ha sido confirmada'}
                    {attendance.status === 'pending' && '⏳ Tu inscripción está pendiente de confirmación'}
                    {attendance.status === 'waiting_list' && '🕐 Estás en la lista de espera'}
                  </p>
                  {/* Mostrar estado de pago si está confirmado */}
                  {attendance.status === 'confirmed' && (
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                      {attendance.payment_status === 'paid' && '💚 Pago recibido'}
                      {attendance.payment_status === 'pending_payment' && '💛 Pago pendiente'}
                      {attendance.payment_status === 'unpaid' && '💸 Sin registro de pago aún'}
                    </p>
                  )}
                  {/* Mensaje del creador */}
                  {attendance.creator_message && (
                    <p className="text-xs mt-2 italic text-blue-700 dark:text-blue-300">
                      💬 &quot;{attendance.creator_message}&quot;
                    </p>
                  )}
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  size="lg"
                  onClick={handleCancel}
                  disabled={isCancelling}
                >
                  <UserMinus className="h-5 w-5 mr-2" />
                  Cancelar Inscripción
                </Button>
              </div>
            ) : (
              <Button
                className="w-full"
                size="lg"
                onClick={() => {
                  if (!currentUserId) {
                    toast({
                      title: 'Debes iniciar sesión',
                      description: 'Para inscribirte a una ruta debes tener una cuenta.',
                      variant: 'destructive',
                    });
                    return;
                  }
                  setIsModalOpen(true);
                }}
                disabled={!currentUserId}
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
            isActiveAttendee={isActiveAttendee}
          />
        </CardContent>
      </Card>

      {/* Modal de inscripción detallada */}
      {currentUserId && (
        <JoinRouteModal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          routeId={routeId}
          routeTitle={routeTitle}
          routeDate={routeDate}
          isFull={isFull}
          currentUserId={currentUserId}
          currentUserName={currentUserName}
          currentUserPhone={currentUserPhone}
          creatorPhone={creatorPhone}
          onSuccess={refetch}
        />
      )}
    </div>
  );
}
