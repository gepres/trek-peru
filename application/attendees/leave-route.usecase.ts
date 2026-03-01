import { IAttendeeRepository } from '@/domain/attendee/attendee.repository.interface';

// Caso de uso: cancelar la inscripción de un usuario en una ruta
export async function leaveRoute(
  attendeeRepo: IAttendeeRepository,
  attendeeId: string,
): Promise<void> {
  return attendeeRepo.deleteById(attendeeId);
}
