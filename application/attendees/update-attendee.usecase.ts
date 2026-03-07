import { IAttendeeRepository } from '@/domain/attendee/attendee.repository.interface';
import { Attendee } from '@/types/route.types';
import { AttendeeUpdateData } from '@/infrastructure/supabase/attendee.repository';

// Actualiza el estado, pago y/o mensaje de un asistente.
// Solo el creador de la ruta puede ejecutar esta acción.
export async function updateAttendee(
  repo: IAttendeeRepository,
  attendeeId: string,
  data: AttendeeUpdateData,
  requesterId: string,
  routeCreatorId: string,
): Promise<Attendee> {
  // Validar que quien hace la solicitud es el creador de la ruta
  if (requesterId !== routeCreatorId) {
    throw new Error('Solo el creador de la ruta puede gestionar asistentes');
  }

  // Enriquecer el payload con fechas y el origen de la cancelación
  const updatePayload: AttendeeUpdateData = { ...data };
  if (data.status === 'confirmed' && !data.confirmation_date) {
    updatePayload.confirmation_date = new Date().toISOString();
  }
  if (data.status === 'cancelled') {
    if (!data.cancellation_date) updatePayload.cancellation_date = new Date().toISOString();
    // El creador siempre es quien rechaza desde este use case
    updatePayload.cancelled_by = 'creator';
  }

  return repo.updateAttendee(attendeeId, updatePayload);
}
