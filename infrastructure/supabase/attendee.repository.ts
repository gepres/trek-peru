import { SupabaseClient } from '@supabase/supabase-js';
import { Attendee, AttendeeWithUser } from '@/types/route.types';
import { AttendeeStatus, ExperienceLevel } from '@/types/database.types';
import { IAttendeeRepository } from '@/domain/attendee/attendee.repository.interface';

// Datos para registrar un asistente
export interface AttendeeCreateData {
  notes?: string;
  experience_level?: ExperienceLevel;
  emergency_contact?: string;
  allergies?: string;
  medical_conditions?: string;
}

// Repositorio de acceso a datos para asistentes — implementa IAttendeeRepository
export function createAttendeeRepository(supabase: SupabaseClient): IAttendeeRepository {
  const BASE_SELECT = `
    *,
    user:profiles(*)
  `;

  return {
    // Obtener todos los asistentes de una ruta
    async findByRouteId(routeId: string): Promise<AttendeeWithUser[]> {
      const { data, error } = await supabase
        .from('attendees')
        .select(BASE_SELECT)
        .eq('route_id', routeId)
        .order('registration_date', { ascending: true });

      if (error) throw error;
      return data || [];
    },

    // Obtener todas las asistencias de un usuario con el detalle de cada ruta
    async findByUserId(userId: string): Promise<any[]> {
      const { data, error } = await supabase
        .from('attendees')
        .select(`
          *,
          route:routes(
            *,
            creator:profiles(*)
          )
        `)
        .eq('user_id', userId)
        .order('registration_date', { ascending: false });

      if (error) throw error;
      return data || [];
    },

    // Obtener la asistencia de un usuario en una ruta específica
    async findByRouteAndUser(routeId: string, userId: string): Promise<AttendeeWithUser | null> {
      const { data, error } = await supabase
        .from('attendees')
        .select(BASE_SELECT)
        .eq('route_id', routeId)
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },

    // Registrar un usuario como asistente a una ruta
    async create(routeId: string, userId: string, attendeeData?: AttendeeCreateData): Promise<Attendee> {
      const { data, error } = await supabase
        .from('attendees')
        .insert({
          route_id: routeId,
          user_id: userId,
          status: 'pending' as AttendeeStatus,
          ...attendeeData,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    // Actualizar el estado de una asistencia
    async updateStatus(attendeeId: string, status: AttendeeStatus): Promise<Attendee> {
      const { data, error } = await supabase
        .from('attendees')
        .update({ status })
        .eq('id', attendeeId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    // Cancelar / eliminar una asistencia
    async deleteById(attendeeId: string): Promise<void> {
      const { error } = await supabase
        .from('attendees')
        .delete()
        .eq('id', attendeeId);

      if (error) throw error;
    },
  };
}

export type AttendeeRepository = ReturnType<typeof createAttendeeRepository>;
