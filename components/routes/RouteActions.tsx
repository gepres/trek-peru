'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
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
  const t = useTranslations('attendees');
  const tc = useTranslations('common');
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
        toast({ title: t('requestCancelled'), description: t('canRejoin') });
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
          title: t('registrationCancelled'),
          description: t('contactCreatorToRejoin'),
        });
      }

      refetch();
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : t('cancelFailed'),
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
                {tc('loading')}
              </Button>

            ) : attendance?.status === 'cancelled' && attendance.cancelled_by === 'creator' ? (
              /* ── Rechazado por el creador ── */
              <div className="space-y-3">
                <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                  <p className="text-sm font-semibold text-red-800 dark:text-red-300">
                    ❌ {t('creatorRejected')}
                  </p>
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                    {t('cannotRejoin')}
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
                      {t('contactOrganizer')}
                    </Button>
                  </a>
                )}
              </div>

            ) : attendance?.status === 'cancelled' && attendance.cancelled_by === 'attendee' ? (
              /* ── El asistente canceló estando confirmado ── */
              <div className="space-y-3">
                <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                  <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-300">
                    {t('cancelledConfirmed')}
                  </p>
                  <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-1">
                    {t('needReactivation')}
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
                      {t('requestReactivation')}
                    </Button>
                  </a>
                )}
              </div>

            ) : attendance && attendance.status !== 'cancelled' ? (
              /* ── Inscripción activa ── */
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-800 dark:text-blue-300 font-medium">
                    {attendance.status === 'confirmed' && <>✅ {t('confirmedStatus')}</>}
                    {attendance.status === 'pending' && <>⏳ {t('pendingStatus')}</>}
                    {attendance.status === 'waiting_list' && <>🕐 {t('waitlistStatus')}</>}
                  </p>
                  {attendance.status === 'confirmed' && (
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                      {attendance.payment_status === 'paid' && <>💚 {t('paymentReceived')}</>}
                      {attendance.payment_status === 'pending_payment' && <>💛 {t('paymentPendingStatus')}</>}
                      {attendance.payment_status === 'unpaid' && <>💸 {t('noPaymentRecord')}</>}
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
                  {attendance.status === 'confirmed' ? t('cancelConfirmedBtn') : t('cancelRequest')}
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
                      title: t('mustLogin'),
                      description: t('mustLoginDesc'),
                      variant: 'destructive',
                    });
                    return;
                  }
                  setIsModalOpen(true);
                }}
                // disabled={!currentUserId}
              >
                <UserPlus className="h-5 w-5 mr-2" />
                {isFull ? t('joinWaitingList') : t('joinRoute')}
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
            {t('title')}
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
