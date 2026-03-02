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

  // Si se está confirmando, agregar la fecha de confirmación automáticamente
  const updatePayload: AttendeeUpdateData = { ...data };
  if (data.status === 'confirmed' && !data.confirmation_date) {
    updatePayload.confirmation_date = new Date().toISOString();
  }
  if (data.status === 'cancelled' && !data.cancellation_date) {
    updatePayload.cancellation_date = new Date().toISOString();
  }

  return repo.updateAttendee(attendeeId, updatePayload);
}
