import { IUserRepository } from '@/domain/user/user.repository.interface';
import { Profile } from '@/types/user.types';

// Caso de uso: obtener el perfil de un usuario
export async function getProfile(
  userRepo: IUserRepository,
  userId: string,
): Promise<Profile | null> {
  return userRepo.findProfileById(userId);
}
