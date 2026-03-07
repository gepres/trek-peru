import { IAttendeeRepository } from '@/domain/attendee/attendee.repository.interface';
import { AttendeeStatus } from '@/types/database.types';

// Caso de uso: el asistente cancela su propia inscripción.
//
// Reglas de negocio:
//  - pending / waiting_list  → se elimina el registro (puede reinscribirse libremente)
//  - confirmed               → se marca como cancelled + cancelled_by:'attendee'
//                              (para reinscribirse debe contactar al creador)
export async function leaveRoute(
  attendeeRepo: IAttendeeRepository,
  attendeeId: string,
  currentStatus: AttendeeStatus,
): Promise<void> {
  if (currentStatus === 'pending' || currentStatus === 'waiting_list') {
    // Eliminar el registro: el asistente puede volver a solicitar
    return attendeeRepo.deleteById(attendeeId);
  }

  // Confirmado que cancela: dejar registro para historial del creador
  await attendeeRepo.updateAttendee(attendeeId, {
    status: 'cancelled',
    cancelled_by: 'attendee',
    cancellation_date: new Date().toISOString(),
  });
}
