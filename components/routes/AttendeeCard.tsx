'use client';

import { AttendeeWithUser } from '@/types/route.types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Check, X, Calendar, Award } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface AttendeeCardProps {
  attendee: AttendeeWithUser;
  isCreator?: boolean;
  onConfirm?: (attendeeId: string) => void;
  onReject?: (attendeeId: string) => void;
}

// Componente para mostrar información de un asistente
export function AttendeeCard({
  attendee,
  isCreator = false,
  onConfirm,
  onReject
}: AttendeeCardProps) {
  // Colores según el estado del asistente
  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    confirmed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    waiting_list: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    completed: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  };

  // Traducciones de estado
  const statusLabels: Record<string, string> = {
    pending: 'Pendiente',
    confirmed: 'Confirmado',
    cancelled: 'Cancelado',
    waiting_list: 'Lista de Espera',
    completed: 'Completado',
  };

  // Traducciones de nivel de experiencia
  const experienceLevels: Record<string, string> = {
    beginner: 'Principiante',
    intermediate: 'Intermedio',
    advanced: 'Avanzado',
    expert: 'Experto',
  };

  // Obtener iniciales del nombre para el avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          {/* Información del usuario */}
          <div className="flex items-start gap-3 flex-1">
            <Avatar className="h-12 w-12">
              <AvatarImage src={attendee.user.avatar_url || undefined} alt={attendee.user.full_name || ''} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {getInitials(attendee.user.full_name || attendee.user.username || 'U')}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                  {attendee.user.full_name || attendee.user.username}
                </h4>
                <Badge className={statusColors[attendee.status] || statusColors.pending}>
                  {statusLabels[attendee.status] || attendee.status}
                </Badge>
              </div>

              {attendee.user.username && attendee.user.full_name && (
                <p className="text-sm text-muted-foreground mb-2">
                  @{attendee.user.username}
                </p>
              )}

              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                {/* Nivel de experiencia */}
                {attendee.experience_level && (
                  <div className="flex items-center gap-1">
                    <Award className="h-4 w-4" />
                    <span>{experienceLevels[attendee.experience_level] || attendee.experience_level}</span>
                  </div>
                )}

                {/* Fecha de inscripción */}
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Inscrito el {format(new Date(attendee.registration_date), 'dd/MM/yyyy', { locale: es })}
                  </span>
                </div>
              </div>

              {/* Notas del asistente */}
              {attendee.notes && (
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 italic">
                  &quot;{attendee.notes}&quot;
                </p>
              )}
            </div>
          </div>

          {/* Botones de acción (solo para creadores con asistentes pendientes) */}
          {isCreator && attendee.status === 'pending' && onConfirm && onReject && (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onConfirm(attendee.id)}
                className="text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/30"
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onReject(attendee.id)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
