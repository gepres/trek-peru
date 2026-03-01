import { Profile, ProfileForm } from '@/types/user.types';

// Contrato que cualquier implementación de repositorio de usuarios debe cumplir
export interface IUserRepository {
  findProfileById(userId: string): Promise<Profile | null>;
  updateProfile(userId: string, profileData: ProfileForm): Promise<Profile>;
  isUsernameAvailable(username: string, excludeUserId?: string): Promise<boolean>;
}
