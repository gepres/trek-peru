'use client';

import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { createUserRepository } from '@/infrastructure/supabase';
import { getProfile } from '@/application/auth';
import { Profile } from '@/types/user.types';

// Hook para autenticación y gestión de usuario
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    // Obtener sesión actual
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchProfile(session.user.id);
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Obtener perfil del usuario via use-case
  async function fetchProfile(userId: string) {
    try {
      const repository = createUserRepository(supabase);
      const data = await getProfile(repository, userId);
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  }

  // Cerrar sesión
  async function signOut() {
    await supabase.auth.signOut();
  }

  return { user, profile, loading, signOut, refetchProfile: () => user && fetchProfile(user.id) };
}
