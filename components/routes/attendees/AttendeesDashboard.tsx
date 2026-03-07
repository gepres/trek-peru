'use client';

import { useState, useMemo } from 'react';
import { Users, CheckCircle2, Clock, DollarSign, Settings2, UserCheck, UserX, ChevronDown, ChevronUp } from 'lucide-react';
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
import { AttendanceStatus } from '@/types/database.types';
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
  const [isAttendanceSectionOpen, setIsAttendanceSectionOpen] = useState(true);
  const [savingAttendanceId, setSavingAttendanceId] = useState<string | null>(null);

  // Filtros
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPayment, setFilterPayment] = useState<string>('all');

  // Usar datos del servidor inicialmente; el hook actualiza tras refetch
  const allAttendees = attendees.length > 0 ? attendees : initialAttendees;

  // Verificar si la fecha del trek ya pasó
  const isTrekPast = useMemo(() => {
    if (!routeDate) return false;
    return new Date(routeDate) < new Date();
  }, [routeDate]);

  // Asistentes confirmados (candidatos para registro de asistencia)
  const confirmedAttendees = useMemo(
    () => allAttendees.filter((a) => a.status === 'confirmed'),
    [allAttendees],
  );

  // Aplicar filtros
  const filtered = allAttendees.filter((a) => {
    const matchStatus = filterStatus === 'all' || a.status === filterStatus;
    const matchPayment = filterPayment === 'all' || a.payment_status === filterPayment;
    return matchStatus && matchPayment;
  });

  // Estadísticas
  const stats = {
    total: allAttendees.length,
    confirmed: confirmedAttendees.length,
    pending: allAttendees.filter((a) => a.status === 'pending').length,
    paid: allAttendees.filter((a) => a.payment_status === 'paid').length,
    attended: allAttendees.filter((a) => a.attendance_status === 'attended').length,
    absent: allAttendees.filter((a) => a.attendance_status === 'absent').length,
    notRecorded: confirmedAttendees.filter((a) => !a.attendance_status).length,
  };

  function getInitials(name: string) {
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  }

  function handleOpenManage(attendee: AttendeeWithUser) {
    setSelectedAttendee(attendee);
    setIsModalOpen(true);
  }

  // Registrar asistencia de un asistente individual
  async function handleRecordAttendance(attendeeId: string, status: AttendanceStatus | null) {
    try {
      setSavingAttendanceId(attendeeId);
      await updateAttendeeData(
        attendeeId,
        { attendance_status: status, attendance_recorded_at: status ? new Date().toISOString() : null },
        requesterId,
        routeCreatorId,
      );
      toast({ title: status === 'attended' ? '✅ Asistencia registrada' : status === 'absent' ? '❌ Ausencia registrada' : 'Registro eliminado' });
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'No se pudo registrar', variant: 'destructive' });
    } finally {
      setSavingAttendanceId(null);
    }
  }

  // Marcar todos los confirmados con el mismo estado en lote
  async function handleBulkAttendance(status: AttendanceStatus) {
    const targets = confirmedAttendees.filter((a) => a.attendance_status !== status);
    if (targets.length === 0) return;
    try {
      await Promise.all(
        targets.map((a) =>
          updateAttendeeData(
            a.id,
            { attendance_status: status, attendance_recorded_at: new Date().toISOString() },
            requesterId,
            routeCreatorId,
          ),
        ),
      );
      toast({ title: `${status === 'attended' ? '✅' : '❌'} ${targets.length} asistentes actualizados` });
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Error en lote', variant: 'destructive' });
    }
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

      {/* ── Sección de registro de asistencia post-trek ── */}
      {isTrekPast && confirmedAttendees.length > 0 && (
        <div className="rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 overflow-hidden">
          {/* Cabecera colapsable */}
          <button
            type="button"
            className="w-full flex items-center justify-between px-5 py-4 text-left"
            onClick={() => setIsAttendanceSectionOpen((v) => !v)}
          >
            <div className="flex items-center gap-3">
              <UserCheck className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0" />
              <div>
                <p className="font-semibold text-blue-900 dark:text-blue-100">
                  Registro de Asistencia
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  {stats.attended} asistieron · {stats.absent} faltaron · {stats.notRecorded} sin registrar
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Barra de progreso mini */}
              {confirmedAttendees.length > 0 && (
                <div className="hidden sm:flex items-center gap-2">
                  <div className="w-28 h-2 rounded-full bg-blue-200 dark:bg-blue-800 overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full transition-all"
                      style={{ width: `${(stats.attended / confirmedAttendees.length) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                    {Math.round((stats.attended / confirmedAttendees.length) * 100)}%
                  </span>
                </div>
              )}
              {isAttendanceSectionOpen ? (
                <ChevronUp className="h-4 w-4 text-blue-500" />
              ) : (
                <ChevronDown className="h-4 w-4 text-blue-500" />
              )}
            </div>
          </button>

          {/* Contenido colapsable */}
          {isAttendanceSectionOpen && (
            <div className="px-5 pb-5 space-y-3">
              {/* Bulk actions */}
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 border-green-300 text-green-700 hover:bg-green-50 dark:border-green-700 dark:text-green-400 dark:hover:bg-green-950"
                  onClick={() => handleBulkAttendance('attended')}
                >
                  <UserCheck className="h-3.5 w-3.5" />
                  Todos asistieron
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 border-red-300 text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-950"
                  onClick={() => handleBulkAttendance('absent')}
                >
                  <UserX className="h-3.5 w-3.5" />
                  Todos faltaron
                </Button>
              </div>

              {/* Lista de confirmados con botones rápidos */}
              <div className="space-y-2">
                {confirmedAttendees.map((attendee) => {
                  const isSaving = savingAttendanceId === attendee.id;
                  const status = attendee.attendance_status;

                  return (
                    <div
                      key={attendee.id}
                      className="flex items-center justify-between gap-3 rounded-lg bg-white dark:bg-background border px-4 py-2.5"
                    >
                      {/* Avatar + nombre */}
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <Avatar className="h-8 w-8 shrink-0">
                          <AvatarImage src={attendee.user.avatar_url || undefined} alt={attendee.user.full_name || ''} />
                          <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
                            {getInitials(attendee.user.full_name || attendee.user.username || 'U')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            {attendee.user.full_name || attendee.user.username}
                          </p>
                          {attendee.user.phone && (
                            <p className="text-xs text-muted-foreground">📱 {attendee.user.phone}</p>
                          )}
                        </div>
                      </div>

                      {/* Botones ✅ / ❌ */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Button
                          size="sm"
                          variant={status === 'attended' ? 'default' : 'outline'}
                          className={`gap-1 h-8 px-3 ${
                            status === 'attended'
                              ? 'bg-green-600 hover:bg-green-700 text-white border-green-600'
                              : 'border-green-300 text-green-700 hover:bg-green-50 dark:border-green-700 dark:text-green-400'
                          }`}
                          onClick={() =>
                            handleRecordAttendance(attendee.id, status === 'attended' ? null : 'attended')
                          }
                          disabled={isSaving}
                        >
                          <UserCheck className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline text-xs">Asistió</span>
                        </Button>
                        <Button
                          size="sm"
                          variant={status === 'absent' ? 'default' : 'outline'}
                          className={`gap-1 h-8 px-3 ${
                            status === 'absent'
                              ? 'bg-red-600 hover:bg-red-700 text-white border-red-600'
                              : 'border-red-300 text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-400'
                          }`}
                          onClick={() =>
                            handleRecordAttendance(attendee.id, status === 'absent' ? null : 'absent')
                          }
                          disabled={isSaving}
                        >
                          <UserX className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline text-xs">Faltó</span>
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

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
                        {/* Badge de asistencia post-trek */}
                        {isTrekPast && attendee.status === 'confirmed' && (
                          attendee.attendance_status === 'attended' ? (
                            <Badge className="text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                              ✅ Asistió
                            </Badge>
                          ) : attendee.attendance_status === 'absent' ? (
                            <Badge className="text-xs bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                              ❌ Faltó
                            </Badge>
                          ) : (
                            <Badge className="text-xs bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                              Sin registro
                            </Badge>
                          )
                        )}
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
        isTrekPast={isTrekPast}
      />
    </div>
  );
}
