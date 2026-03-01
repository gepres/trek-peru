import { SupabaseClient } from '@supabase/supabase-js';
import { Profile, ProfileForm } from '@/types/user.types';
import { IUserRepository } from '@/domain/user/user.repository.interface';

// Repositorio de acceso a datos para usuarios y perfiles — implementa IUserRepository
export function createUserRepository(supabase: SupabaseClient): IUserRepository {
  return {
    // Obtener perfil por ID de usuario
    async findProfileById(userId: string): Promise<Profile | null> {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },

    // Actualizar perfil de usuario
    async updateProfile(userId: string, profileData: ProfileForm): Promise<Profile> {
      const { data, error } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    // Verificar si un username ya está en uso
    async isUsernameAvailable(username: string, excludeUserId?: string): Promise<boolean> {
      let query = supabase
        .from('profiles')
        .select('id')
        .eq('username', username);

      if (excludeUserId) {
        query = query.neq('id', excludeUserId);
      }

      const { data, error } = await query.maybeSingle();
      if (error) throw error;
      return data === null;
    },
  };
}

export type UserRepository = ReturnType<typeof createUserRepository>;
