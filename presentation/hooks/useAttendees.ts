'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { createAttendeeRepository } from '@/infrastructure/supabase';
import { getAttendees, getMyAttendances, getMyAttendance, updateAttendee } from '@/application/attendees';
import { AttendeeWithUser } from '@/types/route.types';
import { AttendeeUpdateData } from '@/infrastructure/supabase/attendee.repository';

// Hook para obtener asistentes de una ruta
export function useAttendees(routeId: string) {
  const [attendees, setAttendees] = useState<AttendeeWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (routeId) {
      fetchAttendees();
    }
  }, [routeId]);

  async function fetchAttendees() {
    try {
      setLoading(true);
      setError(null);

      const repository = createAttendeeRepository(createClient());
      const data = await getAttendees(repository, routeId);
      setAttendees(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error fetching attendees:', err);
    } finally {
      setLoading(false);
    }
  }

  // Actualizar estado, pago y/o mensaje de un asistente (solo creador)
  async function updateAttendeeData(
    attendeeId: string,
    data: AttendeeUpdateData,
    requesterId: string,
    routeCreatorId: string,
  ) {
    const repository = createAttendeeRepository(createClient());
    const updated = await updateAttendee(repository, attendeeId, data, requesterId, routeCreatorId);
    // Refrescar la lista local
    await fetchAttendees();
    return updated;
  }

  return { attendees, loading, error, refetch: fetchAttendees, updateAttendeeData };
}

// Hook para obtener las rutas donde el usuario autenticado es asistente
export function useMyAttendances() {
  const [attendances, setAttendances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMyAttendances();
  }, []);

  async function fetchMyAttendances() {
    try {
      setLoading(true);
      setError(null);

      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const repository = createAttendeeRepository(supabase);
      const data = await getMyAttendances(repository, user.id);
      setAttendances(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error fetching my attendances:', err);
    } finally {
      setLoading(false);
    }
  }

  return { attendances, loading, error, refetch: fetchMyAttendances };
}

// Hook para verificar si el usuario autenticado está inscrito en una ruta
export function useMyAttendance(routeId: string) {
  const [attendance, setAttendance] = useState<AttendeeWithUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (routeId) {
      checkAttendance();
    }
  }, [routeId]);

  async function checkAttendance() {
    try {
      setLoading(true);
      setError(null);

      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const repository = createAttendeeRepository(supabase);
      const data = await getMyAttendance(repository, routeId, user.id);
      setAttendance(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error checking attendance:', err);
    } finally {
      setLoading(false);
    }
  }

  return { attendance, loading, error, refetch: checkAttendance };
}
