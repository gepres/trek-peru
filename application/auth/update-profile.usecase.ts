import { IUserRepository } from '@/domain/user/user.repository.interface';
import { Profile, ProfileForm } from '@/types/user.types';

// Caso de uso: actualizar el perfil del usuario autenticado
export async function updateProfile(
  userRepo: IUserRepository,
  userId: string,
  profileData: ProfileForm,
): Promise<Profile> {
  // Verificar disponibilidad de username si cambió
  const isAvailable = await userRepo.isUsernameAvailable(profileData.username, userId);
  if (!isAvailable) {
    throw new Error('El nombre de usuario ya está en uso');
  }

  return userRepo.updateProfile(userId, profileData);
}
