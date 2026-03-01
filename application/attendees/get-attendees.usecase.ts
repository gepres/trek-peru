import { IAttendeeRepository } from '@/domain/attendee/attendee.repository.interface';
import { AttendeeWithUser } from '@/types/route.types';

// Caso de uso: obtener asistentes de una ruta
export async function getAttendees(
  attendeeRepo: IAttendeeRepository,
  routeId: string,
): Promise<AttendeeWithUser[]> {
  return attendeeRepo.findByRouteId(routeId);
}
