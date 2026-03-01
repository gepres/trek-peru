import { Attendee, AttendeeWithUser } from '@/types/route.types';
import { AttendeeStatus } from '@/types/database.types';
import { AttendeeCreateData } from '@/infrastructure/supabase/attendee.repository';

// Contrato que cualquier implementación de repositorio de asistentes debe cumplir
export interface IAttendeeRepository {
  findByRouteId(routeId: string): Promise<AttendeeWithUser[]>;
  findByUserId(userId: string): Promise<any[]>;
  findByRouteAndUser(routeId: string, userId: string): Promise<AttendeeWithUser | null>;
  create(routeId: string, userId: string, attendeeData?: AttendeeCreateData): Promise<Attendee>;
  updateStatus(attendeeId: string, status: AttendeeStatus): Promise<Attendee>;
  deleteById(attendeeId: string): Promise<void>;
}
