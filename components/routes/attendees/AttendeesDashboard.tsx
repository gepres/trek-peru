'use client';

import { useState } from 'react';
import { Users, CheckCircle2, Clock, DollarSign, Settings2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from '@/components/ui/use-toast';
import { AttendeeWithUser } from '@/types/route.types';
import { AttendeeUpdateInput } from '@/lib/validations/user.schema';
import { AttendeeManageModal } from './AttendeeManageModal';
import { ExportExcelButton } from './ExportExcelButton';
import { useAttendees } from '@/presentation/hooks/useAttendees';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface AttendeesDashboardProps {
  routeId: string;
  routeTitle: string;
  routeDate?: string;
  meetingPoint?: string;
  meetingTime?: string;
  requesterId: string;
  routeCreatorId: string;
  initialAttendees: AttendeeWithUser[];
}

// Colores de badges por estado
const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  confirmed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  waiting_list: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  completed: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  cancelled: 'Cancelado',
  waiting_list: 'En Espera',
  completed: 'Completado',
};

const PAYMENT_COLORS: Record<string, string> = {
  unpaid: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  pending_payment: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  paid: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
};

const PAYMENT_LABELS: Record<string, string> = {
  unpaid: 'Sin Pago',
  pending_payment: 'Pago Pendiente',
  paid: 'Pagado',
};

// Dashboard completo de gestión de asistentes para el creador de una ruta
export function AttendeesDashboard({
  routeId,
  routeTitle,
  routeDate,
  meetingPoint,
  meetingTime,
  requesterId,
  routeCreatorId,
  initialAttendees,
}: AttendeesDashboardProps) {
  const { attendees, refetch, updateAttendeeData } = useAttendees(routeId);
  const [selectedAttendee, setSelectedAttendee] = useState<AttendeeWithUser | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filtros
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPayment, setFilterPayment] = useState<string>('all');

  // Usar datos del servidor inicialmente; el hook actualiza tras refetch
  const allAttendees = attendees.length > 0 ? attendees : initialAttendees;

  // Aplicar filtros
  const filtered = allAttendees.filter((a) => {
    const matchStatus = filterStatus === 'all' || a.status === filterStatus;
    const matchPayment = filterPayment === 'all' || a.payment_status === filterPayment;
    return matchStatus && matchPayment;
  });

  // Estadísticas
  const stats = {
    total: allAttendees.length,
    confirmed: allAttendees.filter((a) => a.status === 'confirmed').length,
    pending: allAttendees.filter((a) => a.status === 'pending').length,
    paid: allAttendees.filter((a) => a.payment_status === 'paid').length,
  };

  function getInitials(name: string) {
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  }

  function handleOpenManage(attendee: AttendeeWithUser) {
    setSelectedAttendee(attendee);
    setIsModalOpen(true);
  }

  async function handleSave(attendeeId: string, data: AttendeeUpdateInput) {
    try {
      await updateAttendeeData(attendeeId, data, requesterId, routeCreatorId);
      toast({ title: '✅ Cambios guardados', description: 'El asistente ha sido actualizado.' });
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'No se pudo actualizar',
        variant: 'destructive',
      });
    }
  }

  return (
    <div className="space-y-6">
      {/* ── Tarjetas de estadísticas ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total Inscritos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{stats.confirmed}</p>
                <p className="text-xs text-muted-foreground">Confirmados</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{stats.pending}</p>
                <p className="text-xs text-muted-foreground">Pendientes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <DollarSign className="h-8 w-8 text-emerald-500" />
              <div>
                <p className="text-2xl font-bold">{stats.paid}</p>
                <p className="text-xs text-muted-foreground">Pagados</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Filtros + Exportar ── */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Filtrar por estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="pending">⏳ Pendientes</SelectItem>
            <SelectItem value="confirmed">✅ Confirmados</SelectItem>
            <SelectItem value="waiting_list">🕐 En Espera</SelectItem>
            <SelectItem value="cancelled">❌ Cancelados</SelectItem>
            <SelectItem value="completed">🏆 Completados</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterPayment} onValueChange={setFilterPayment}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrar por pago" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los pagos</SelectItem>
            <SelectItem value="unpaid">💸 Sin Pago</SelectItem>
            <SelectItem value="pending_payment">⏳ Pago Pendiente</SelectItem>
            <SelectItem value="paid">✅ Pagado</SelectItem>
          </SelectContent>
        </Select>

        <div className="ml-auto">
          <ExportExcelButton attendees={allAttendees} routeTitle={routeTitle} />
        </div>
      </div>

      {/* ── Lista de asistentes (cards responsivos) ── */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No hay asistentes con estos filtros</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((attendee, idx) => (
            <Card key={attendee.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">

                  {/* Izquierda: avatar + info */}
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    {/* Número + Avatar */}
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-muted-foreground w-5 text-right">{idx + 1}</span>
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={attendee.user.avatar_url || undefined}
                          alt={attendee.user.full_name || ''}
                        />
                        <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
                          {getInitials(attendee.user.full_name || attendee.user.username || 'U')}
                        </AvatarFallback>
                      </Avatar>
                    </div>

                    {/* Datos del asistente */}
                    <div className="min-w-0 flex-1">
                      {/* Nombre + badges de estado en la misma fila */}
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <p className="font-medium leading-tight">
                          {attendee.user.full_name || attendee.user.username}
                        </p>
                        <Badge className={`text-xs ${STATUS_COLORS[attendee.status] ?? ''}`}>
                          {STATUS_LABELS[attendee.status] ?? attendee.status}
                        </Badge>
                        <Badge className={`text-xs ${PAYMENT_COLORS[attendee.payment_status] ?? ''}`}>
                          {PAYMENT_LABELS[attendee.payment_status] ?? attendee.payment_status}
                        </Badge>
                      </div>

                      {/* Username */}
                      {attendee.user.username && attendee.user.full_name && (
                        <p className="text-xs text-muted-foreground mb-1.5">
                          @{attendee.user.username}
                        </p>
                      )}

                      {/* Detalles secundarios */}
                      <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                        {attendee.user.phone && (
                          <span>📱 {attendee.user.phone}</span>
                        )}
                        {attendee.registration_date && (
                          <span>
                            📅 {format(new Date(attendee.registration_date), 'dd/MM/yyyy', { locale: es })}
                          </span>
                        )}
                        {attendee.experience_level && (
                          <span>🏔️ {attendee.experience_level}</span>
                        )}
                      </div>

                      {/* Mensaje del creador (si existe) */}
                      {attendee.creator_message && (
                        <p className="text-xs text-muted-foreground mt-1.5 italic line-clamp-1">
                          💬 &quot;{attendee.creator_message}&quot;
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Derecha: botón gestionar */}
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1 shrink-0"
                    onClick={() => handleOpenManage(attendee)}
                  >
                    <Settings2 className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Gestionar</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ── Modal de gestión ── */}
      <AttendeeManageModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        attendee={selectedAttendee}
        routeTitle={routeTitle}
        routeDate={routeDate}
        meetingPoint={meetingPoint}
        meetingTime={meetingTime}
        requesterId={requesterId}
        routeCreatorId={routeCreatorId}
        onSave={handleSave}
      />
    </div>
  );
}
