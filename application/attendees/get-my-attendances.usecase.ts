import { IAttendeeRepository } from '@/domain/attendee/attendee.repository.interface';

// Caso de uso: obtener todas las asistencias del usuario autenticado
export async function getMyAttendances(
  attendeeRepo: IAttendeeRepository,
  userId: string,
): Promise<any[]> {
  return attendeeRepo.findByUserId(userId);
}
