import { IAttendeeRepository } from '@/domain/attendee/attendee.repository.interface';
import { AttendeeWithUser } from '@/types/route.types';

// Caso de uso: verificar si un usuario está inscrito en una ruta específica
export async function getMyAttendance(
  attendeeRepo: IAttendeeRepository,
  routeId: string,
  userId: string,
): Promise<AttendeeWithUser | null> {
  return attendeeRepo.findByRouteAndUser(routeId, userId);
}
