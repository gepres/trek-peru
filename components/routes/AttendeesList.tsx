'use client';

import { useState, useEffect } from 'react';
import { useAttendees } from '@/presentation/hooks/useAttendees';
import { AttendeeCard } from './AttendeeCard';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { Users, Lock } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { PaymentStatus } from '@/types/route.types';

interface AttendeesListProps {
  routeId: string;
  creatorId: string;
  currentUserId?: string;
  // Viene de RouteActions: true si el usuario tiene inscripción activa (status != cancelled)
  isActiveAttendee?: boolean;
}

// Máximo de skeleton cards borrosos visibles para usuarios sin acceso
const MAX_BLURRED_CARDS = 3;

// Variaciones de ancho para que los skeletons parezcan nombres reales distintos
const NAME_WIDTHS = ['w-28', 'w-32', 'w-24'];
const DETAIL_WIDTHS = ['w-36', 'w-44', 'w-32'];

// ── Skeleton card falso (no expone datos reales) ─────────────────────────────
function FakeAttendeeCard({ index }: { index: number }) {
  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      {/* Avatar + nombre */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-muted-foreground/20 shrink-0" />
        <div className="space-y-1.5 flex-1">
          <div className={`h-3.5 bg-muted-foreground/20 rounded ${NAME_WIDTHS[index % NAME_WIDTHS.length]}`} />
          <div className="h-2.5 w-16 bg-muted-foreground/20 rounded" />
        </div>
      </div>
      {/* Badges */}
      <div className="flex gap-2">
        <div className="h-5 w-20 bg-muted-foreground/20 rounded-full" />
        <div className="h-5 w-16 bg-muted-foreground/20 rounded-full" />
      </div>
      {/* Detalles */}
      <div className={`h-2.5 bg-muted-foreground/20 rounded ${DETAIL_WIDTHS[index % DETAIL_WIDTHS.length]}`} />
    </div>
  );
}

// ── Vista borrosa con skeletons falsos + overlay ─────────────────────────────
function BlurredAttendeesView({ count }: { count: number }) {
  const previewCount = Math.min(count, MAX_BLURRED_CARDS);
  const hiddenCount = count - previewCount;

  return (
    <div className="relative">
      {/* Skeleton cards con blur — cantidad real de personas */}
      <div
        className="space-y-3 select-none pointer-events-none"
        style={{ filter: 'blur(7px)', userSelect: 'none' }}
        aria-hidden="true"
      >
        {Array.from({ length: previewCount }).map((_, i) => (
          <FakeAttendeeCard key={i} index={i} />
        ))}
      </div>

      {/* Overlay CTA */}
      <div className="absolute inset-0 flex flex-col items-center justify-center rounded-lg">
        <div className="bg-background/90 dark:bg-background/95 backdrop-blur-sm rounded-2xl px-6 py-5 text-center shadow-lg border max-w-[220px]">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 mx-auto mb-3">
            <Lock className="h-5 w-5 text-primary" />
          </div>
          <p className="text-sm font-semibold">
            {count} {count === 1 ? 'persona inscrita' : 'personas inscritas'}
          </p>
          {hiddenCount > 0 && (
            <p className="text-xs text-muted-foreground mt-0.5">
              +{hiddenCount} más
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
            Inscríbete para ver quién asiste
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Componente principal ─────────────────────────────────────────────────────
export function AttendeesList({
  routeId,
  creatorId,
  currentUserId,
  isActiveAttendee = false,
}: AttendeesListProps) {
  const supabase = createClient();
  const isCreator = currentUserId === creatorId;

  // Solo el creador y los asistentes activos pueden ver la lista completa
  const canSeeFullList = isCreator || isActiveAttendee;

  // Conteo público obtenido vía SECURITY DEFINER (bypasea RLS)
  // null = cargando, 0 = nadie inscrito, N = hay N asistentes
  const [publicCount, setPublicCount] = useState<number | null>(null);

  useEffect(() => {
    if (!canSeeFullList) {
      supabase
        .rpc('get_route_attendee_count', { p_route_id: routeId })
        .then(({ data }) => {
          setPublicCount(data !== null ? (data as number) : 0);
        });
    }
  }, [routeId, canSeeFullList]);

  // ── Rama: usuario SIN acceso a la lista completa ──────────────────────────
  if (!canSeeFullList) {
    // Cargando conteo público
    if (publicCount === null) {
      return (
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner size="lg" text="Cargando asistentes..." />
        </div>
      );
    }

    // No hay nadie inscrito aún
    if (publicCount === 0) {
      return (
        <EmptyState
          icon={Users}
          title="Aún no hay asistentes"
          description="Sé el primero en inscribirte a esta aventura."
        />
      );
    }

    // Hay asistentes → mostrar skeletons borrosos
    return <BlurredAttendeesView count={publicCount} />;
  }

  // ── Rama: usuario CON acceso (creador o asistente activo) ─────────────────
  return <FullAttendeesList routeId={routeId} isCreator={isCreator} currentUserId={currentUserId} supabase={supabase} />;
}

// ── Lista completa para usuarios con acceso ──────────────────────────────────
function FullAttendeesList({
  routeId,
  isCreator,
  currentUserId,
  supabase,
}: {
  routeId: string;
  isCreator: boolean;
  currentUserId?: string;
  supabase: ReturnType<typeof createClient>;
}) {
  const { attendees, loading, error, refetch } = useAttendees(routeId);

  // Confirmar asistente
  async function handleConfirm(attendeeId: string) {
    try {
      const { error } = await supabase
        .from('attendees')
        .update({ status: 'confirmed', confirmation_date: new Date().toISOString() })
        .eq('id', attendeeId);
      if (error) throw error;
      toast({ title: 'Asistente confirmado', description: 'El asistente ha sido confirmado exitosamente.' });
      refetch();
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'No se pudo confirmar el asistente', variant: 'destructive' });
    }
  }

  // Actualizar estado de pago
  async function handleUpdatePayment(attendeeId: string, paymentStatus: PaymentStatus) {
    try {
      const { error } = await supabase
        .from('attendees')
        .update({ payment_status: paymentStatus })
        .eq('id', attendeeId);
      if (error) throw error;
      const labels: Record<PaymentStatus, string> = { unpaid: 'Sin Pago', pending_payment: 'Pago Pendiente', paid: 'Pagado' };
      toast({ title: 'Pago actualizado', description: `Estado de pago cambiado a "${labels[paymentStatus]}".` });
      refetch();
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'No se pudo actualizar el pago', variant: 'destructive' });
    }
  }

  // Rechazar asistente
  async function handleReject(attendeeId: string) {
    try {
      const { error } = await supabase
        .from('attendees')
        .update({ status: 'cancelled', cancelled_by: 'creator', cancellation_date: new Date().toISOString() })
        .eq('id', attendeeId);
      if (error) throw error;
      toast({ title: 'Asistente rechazado', description: 'El asistente ha sido rechazado.' });
      refetch();
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'No se pudo rechazar el asistente', variant: 'destructive' });
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner size="lg" text="Cargando asistentes..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-lg bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800">
        <p className="text-sm text-red-600 dark:text-red-400">Error al cargar asistentes: {error}</p>
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

  const confirmedAttendees = attendees.filter((a) => a.status === 'confirmed');
  const pendingAttendees = attendees.filter((a) => a.status === 'pending');
  const waitingListAttendees = attendees.filter((a) => a.status === 'waiting_list');
  const cancelledAttendees = attendees.filter((a) => a.status === 'cancelled');
  // Total activo: excluye cancelados (no ocupan cupo visible)
  const activeCount = confirmedAttendees.length + pendingAttendees.length + waitingListAttendees.length;

  return (
    <div className="space-y-6">
      {/* Resumen */}
      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
        <span className="font-medium text-foreground">
          {activeCount} {activeCount === 1 ? 'asistente activo' : 'asistentes activos'}
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
            {waitingListAttendees.length} en espera
          </span>
        )}
        {cancelledAttendees.length > 0 && (
          <span className="text-red-500 dark:text-red-400">
            {cancelledAttendees.length} cancelado{cancelledAttendees.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Confirmados */}
      {confirmedAttendees.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Confirmados ({confirmedAttendees.length})
          </h3>
          <div className="space-y-3">
            {confirmedAttendees.map((attendee) => (
              <AttendeeCard
                key={attendee.id}
                attendee={attendee}
                isCreator={isCreator}
                currentUserId={currentUserId}
                onConfirm={handleConfirm}
                onReject={handleReject}
                onUpdatePayment={isCreator ? handleUpdatePayment : undefined}
              />
            ))}
          </div>
        </div>
      )}

      {/* Pendientes */}
      {pendingAttendees.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Pendientes ({pendingAttendees.length})
          </h3>
          <div className="space-y-3">
            {pendingAttendees.map((attendee) => (
              <AttendeeCard
                key={attendee.id}
                attendee={attendee}
                isCreator={isCreator}
                currentUserId={currentUserId}
                onConfirm={handleConfirm}
                onReject={handleReject}
                onUpdatePayment={isCreator ? handleUpdatePayment : undefined}
              />
            ))}
          </div>
        </div>
      )}

      {/* Lista de espera */}
      {waitingListAttendees.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Lista de Espera ({waitingListAttendees.length})
          </h3>
          <div className="space-y-3">
            {waitingListAttendees.map((attendee) => (
              <AttendeeCard
                key={attendee.id}
                attendee={attendee}
                isCreator={isCreator}
                currentUserId={currentUserId}
                onConfirm={handleConfirm}
                onReject={handleReject}
                onUpdatePayment={isCreator ? handleUpdatePayment : undefined}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
