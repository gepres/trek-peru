'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AttendeesList } from './AttendeesList';
import { JoinRouteModal } from './JoinRouteModal';
import { useMyAttendance } from '@/presentation/hooks/useAttendees';
import { createClient } from '@/lib/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Users, UserPlus, UserMinus, MessageCircle } from 'lucide-react';
import { buildWaLink, buildReinstatementMessage } from '@/lib/utils/whatsapp';

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

  // Cancelar inscripción — comportamiento según el estado previo:
  // pending/waiting_list → eliminar registro (puede reinscribirse)
  // confirmed            → marcar cancelled_by:'attendee' (necesita contactar al creador)
  async function handleCancel() {
    if (!attendance) return;

    try {
      setIsCancelling(true);

      if (attendance.status === 'pending' || attendance.status === 'waiting_list') {
        // Eliminar el registro: queda libre para reinscribirse
        const { error } = await supabase
          .from('attendees')
          .delete()
          .eq('id', attendance.id);
        if (error) throw error;
        toast({ title: 'Solicitud cancelada', description: 'Puedes volver a inscribirte cuando quieras.' });
      } else {
        // Confirmado que cancela: dejar registro para historial del creador
        const { error } = await supabase
          .from('attendees')
          .update({
            status: 'cancelled',
            cancelled_by: 'attendee',
            cancellation_date: new Date().toISOString(),
          })
          .eq('id', attendance.id);
        if (error) throw error;
        toast({
          title: 'Inscripción cancelada',
          description: 'Para volver a inscribirte contacta al creador de la ruta.',
        });
      }

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

  // Link de WhatsApp al creador (para mensajes de contacto del asistente)
  function buildCreatorWaLink(message: string): string | null {
    if (!creatorPhone) return null;
    return buildWaLink(creatorPhone, message);
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

            ) : attendance?.status === 'cancelled' && attendance.cancelled_by === 'creator' ? (
              /* ── Rechazado por el creador ── */
              <div className="space-y-3">
                <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                  <p className="text-sm font-semibold text-red-800 dark:text-red-300">
                    ❌ El creador rechazó tu solicitud
                  </p>
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                    No puedes volver a inscribirte. Si crees que es un error, contáctate con el organizador.
                  </p>
                </div>
                {creatorPhone && (
                  <a
                    href={buildCreatorWaLink(`Hola, fui rechazado en la ruta *${routeTitle}*. ¿Podrías explicarme el motivo? Gracias.`) ?? '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="outline" className="w-full gap-2 border-green-300 text-green-700 hover:bg-green-50 dark:border-green-700 dark:text-green-400">
                      <MessageCircle className="h-4 w-4" />
                      Contactar al organizador por WhatsApp
                    </Button>
                  </a>
                )}
              </div>

            ) : attendance?.status === 'cancelled' && attendance.cancelled_by === 'attendee' ? (
              /* ── El asistente canceló estando confirmado ── */
              <div className="space-y-3">
                <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                  <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-300">
                    Cancelaste tu inscripción confirmada
                  </p>
                  <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-1">
                    Para volver a inscribirte necesitas que el organizador reactive tu lugar.
                  </p>
                </div>
                {creatorPhone && (
                  <a
                    href={buildCreatorWaLink(
                      buildReinstatementMessage({ userName: currentUserName, routeTitle, routeDate }),
                    ) ?? '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="outline" className="w-full gap-2 border-green-300 text-green-700 hover:bg-green-50 dark:border-green-700 dark:text-green-400">
                      <MessageCircle className="h-4 w-4" />
                      Pedir reactivación por WhatsApp
                    </Button>
                  </a>
                )}
              </div>

            ) : attendance && attendance.status !== 'cancelled' ? (
              /* ── Inscripción activa ── */
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-800 dark:text-blue-300 font-medium">
                    {attendance.status === 'confirmed' && '✅ Tu inscripción ha sido confirmada'}
                    {attendance.status === 'pending' && '⏳ Tu inscripción está pendiente de confirmación'}
                    {attendance.status === 'waiting_list' && '🕐 Estás en la lista de espera'}
                  </p>
                  {attendance.status === 'confirmed' && (
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                      {attendance.payment_status === 'paid' && '💚 Pago recibido'}
                      {attendance.payment_status === 'pending_payment' && '💛 Pago pendiente'}
                      {attendance.payment_status === 'unpaid' && '💸 Sin registro de pago aún'}
                    </p>
                  )}
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
                  {attendance.status === 'confirmed' ? 'Cancelar inscripción confirmada' : 'Cancelar solicitud'}
                </Button>
              </div>

            ) : (
              /* ── Sin inscripción / canceló siendo pendiente ── */
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
