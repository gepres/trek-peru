import { ExperienceLevel, Timestamps } from './database.types';

// Perfil de usuario
export interface Profile extends Timestamps {
  id: string;
  full_name: string;
  username: string;
  avatar_url?: string;
  bio?: string;
  experience_level?: ExperienceLevel;
  location?: string;
  phone?: string;
  birth_date?: string;
}

// Formulario de perfil
export interface ProfileForm {
  full_name: string;
  username: string;
  bio?: string;
  experience_level?: ExperienceLevel;
  location?: string;
  phone?: string;
  birth_date?: string;
}
