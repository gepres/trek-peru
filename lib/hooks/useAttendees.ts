'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { AttendeeWithUser } from '@/types/route.types';

// Hook para obtener asistentes de una ruta
export function useAttendees(routeId: string) {
  const [attendees, setAttendees] = useState<AttendeeWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    if (routeId) {
      fetchAttendees();
    }
  }, [routeId]);

  async function fetchAttendees() {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('attendees')
        .select(`
          *,
          user:profiles(*)
        `)
        .eq('route_id', routeId)
        .order('registration_date', { ascending: true });

      if (error) throw error;
      setAttendees(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error fetching attendees:', err);
    } finally {
      setLoading(false);
    }
  }

  return { attendees, loading, error, refetch: fetchAttendees };
}

// Hook para obtener las rutas donde el usuario es asistente
export function useMyAttendances() {
  const [attendances, setAttendances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    fetchMyAttendances();
  }, []);

  async function fetchMyAttendances() {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { data, error } = await supabase
        .from('attendees')
        .select(`
          *,
          route:routes(
            *,
            creator:profiles(*)
          )
        `)
        .eq('user_id', user.id)
        .order('registration_date', { ascending: false });

      if (error) throw error;
      setAttendances(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error fetching my attendances:', err);
    } finally {
      setLoading(false);
    }
  }

  return { attendances, loading, error, refetch: fetchMyAttendances };
}

// Hook para verificar si el usuario está inscrito en una ruta
export function useMyAttendance(routeId: string) {
  const [attendance, setAttendance] = useState<AttendeeWithUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    if (routeId) {
      checkAttendance();
    }
  }, [routeId]);

  async function checkAttendance() {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('attendees')
        .select(`
          *,
          user:profiles(*)
        `)
        .eq('route_id', routeId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
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
