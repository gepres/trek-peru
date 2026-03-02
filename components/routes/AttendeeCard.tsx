'use client';

import { AttendeeWithUser, PaymentStatus } from '@/types/route.types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Check, X, Calendar, Award, CreditCard } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface AttendeeCardProps {
  attendee: AttendeeWithUser;
  isCreator?: boolean;
  onConfirm?: (attendeeId: string) => void;
  onReject?: (attendeeId: string) => void;
  onUpdatePayment?: (attendeeId: string, paymentStatus: PaymentStatus) => void;
}

// Colores según el estado de inscripción
const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  confirmed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  waiting_list: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  completed: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
};

// Colores según el estado de pago
const paymentColors: Record<string, string> = {
  unpaid: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
  pending_payment: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  paid: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
};

// Etiquetas de estado de inscripción
const statusLabels: Record<string, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  cancelled: 'Cancelado',
  waiting_list: 'Lista de Espera',
  completed: 'Completado',
};

// Etiquetas de estado de pago
const paymentLabels: Record<string, string> = {
  unpaid: 'Sin Pago',
  pending_payment: 'Pago Pendiente',
  paid: 'Pagado',
};

// Etiquetas de nivel de experiencia
const experienceLevels: Record<string, string> = {
  beginner: 'Principiante',
  intermediate: 'Intermedio',
  advanced: 'Avanzado',
  expert: 'Experto',
};

// Obtener iniciales del nombre para el avatar
function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

// Componente para mostrar información de un asistente en la vista pública de una ruta
export function AttendeeCard({
  attendee,
  isCreator = false,
  onConfirm,
  onReject,
  onUpdatePayment,
}: AttendeeCardProps) {
  return (
    <Card>
      <CardContent className="p-4 space-y-3">

        {/* Fila superior: avatar + nombre */}
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 shrink-0">
            <AvatarImage
              src={attendee.user.avatar_url || undefined}
              alt={attendee.user.full_name || ''}
            />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
              {getInitials(attendee.user.full_name || attendee.user.username || 'U')}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <p className="font-semibold text-sm truncate">
              {attendee.user.full_name || attendee.user.username}
            </p>
            {attendee.user.username && attendee.user.full_name && (
              <p className="text-xs text-muted-foreground">
                @{attendee.user.username}
              </p>
            )}
          </div>
        </div>

        {/* Badges: estado de inscripción + estado de pago */}
        <div className="flex flex-wrap gap-2">
          <Badge className={`text-xs ${statusColors[attendee.status] ?? ''}`}>
            {statusLabels[attendee.status] ?? attendee.status}
          </Badge>
          <Badge className={`text-xs ${paymentColors[attendee.payment_status] ?? ''}`}>
            {paymentLabels[attendee.payment_status] ?? attendee.payment_status}
          </Badge>
        </div>

        {/* Detalles secundarios: nivel de experiencia y fecha */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {attendee.experience_level && (
            <div className="flex items-center gap-1">
              <Award className="h-3.5 w-3.5" />
              <span>{experienceLevels[attendee.experience_level] ?? attendee.experience_level}</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            <span>
              {format(new Date(attendee.registration_date), 'dd/MM/yyyy', { locale: es })}
            </span>
          </div>
        </div>

        {/* Notas del asistente */}
        {attendee.notes && (
          <p className="text-xs text-muted-foreground italic line-clamp-2">
            &quot;{attendee.notes}&quot;
          </p>
        )}

        {/* Mensaje del creador (si existe) */}
        {attendee.creator_message && (
          <p className="text-xs text-blue-700 dark:text-blue-300 italic line-clamp-2">
            💬 &quot;{attendee.creator_message}&quot;
          </p>
        )}

        {/* ── Sección exclusiva del creador ── */}
        {isCreator && (
          <div className="pt-2 border-t space-y-2">

            {/* Selector rápido de estado de pago */}
            {onUpdatePayment && (
              <div className="flex items-center gap-2">
                <CreditCard className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <p className="text-xs text-muted-foreground shrink-0">Pago:</p>
                <Select
                  value={attendee.payment_status}
                  onValueChange={(val) =>
                    onUpdatePayment(attendee.id, val as PaymentStatus)
                  }
                >
                  <SelectTrigger className="h-7 text-xs flex-1 min-w-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unpaid" className="text-xs">
                      💸 Sin Pago
                    </SelectItem>
                    <SelectItem value="pending_payment" className="text-xs">
                      ⏳ Pago Pendiente
                    </SelectItem>
                    <SelectItem value="paid" className="text-xs">
                      ✅ Pagado
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Botones Confirmar / Rechazar — solo si está pendiente */}
            {attendee.status === 'pending' && onConfirm && onReject && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1 text-xs gap-1 bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => onConfirm(attendee.id)}
                >
                  <Check className="h-3.5 w-3.5" />
                  Confirmar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 text-xs gap-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30 border-red-200"
                  onClick={() => onReject(attendee.id)}
                >
                  <X className="h-3.5 w-3.5" />
                  Rechazar
                </Button>
              </div>
            )}

          </div>
        )}

      </CardContent>
    </Card>
  );
}
