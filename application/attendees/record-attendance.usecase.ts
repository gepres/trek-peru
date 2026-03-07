import { IAttendeeRepository } from '@/domain/attendee/attendee.repository.interface';
import { Attendee } from '@/types/route.types';
import { AttendanceStatus } from '@/types/database.types';

// Registra la asistencia real (asistió / faltó) de un asistente confirmado.
// Solo el creador de la ruta puede ejecutar esta acción.
// Solo aplica a asistentes con status 'confirmed'.
export async function recordAttendance(
  repo: IAttendeeRepository,
  attendeeId: string,
  attendanceStatus: AttendanceStatus | null,
  requesterId: string,
  routeCreatorId: string,
): Promise<Attendee> {
  if (requesterId !== routeCreatorId) {
    throw new Error('Solo el creador de la ruta puede registrar asistencia');
  }

  return repo.updateAttendee(attendeeId, {
    attendance_status: attendanceStatus,
    attendance_recorded_at: attendanceStatus ? new Date().toISOString() : null,
  });
}

// Registra la asistencia de múltiples asistentes en lote.
// Útil para marcar todos como presentes/ausentes de una sola vez.
export async function recordAttendanceBulk(
  repo: IAttendeeRepository,
  attendeeIds: string[],
  attendanceStatus: AttendanceStatus,
  requesterId: string,
  routeCreatorId: string,
): Promise<Attendee[]> {
  if (requesterId !== routeCreatorId) {
    throw new Error('Solo el creador de la ruta puede registrar asistencia');
  }

  const now = new Date().toISOString();
  const results = await Promise.all(
    attendeeIds.map((id) =>
      repo.updateAttendee(id, {
        attendance_status: attendanceStatus,
        attendance_recorded_at: now,
      }),
    ),
  );

  return results;
}
