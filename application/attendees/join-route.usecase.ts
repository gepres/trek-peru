import { IAttendeeRepository } from '@/domain/attendee/attendee.repository.interface';
import { Attendee } from '@/types/route.types';
import { AttendeeCreateData } from '@/infrastructure/supabase/attendee.repository';

// Caso de uso: inscribir un usuario en una ruta
// Lanza error si el usuario ya está inscrito
export async function joinRoute(
  attendeeRepo: IAttendeeRepository,
  routeId: string,
  userId: string,
  attendeeData?: AttendeeCreateData,
): Promise<Attendee> {
  const existing = await attendeeRepo.findByRouteAndUser(routeId, userId);
  if (existing) {
    throw new Error('Ya estás inscrito en esta ruta');
  }

  return attendeeRepo.create(routeId, userId, attendeeData);
}
