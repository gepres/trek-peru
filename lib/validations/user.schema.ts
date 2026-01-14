import { z } from 'zod';

// Schema para login
export const loginSchema = z.object({
  email: z.string()
    .email('Correo electrónico inválido')
    .min(1, 'El correo electrónico es requerido'),
  password: z.string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres')
    .min(1, 'La contraseña es requerida'),
});

// Schema para registro
export const registerSchema = z.object({
  email: z.string()
    .email('Correo electrónico inválido')
    .min(1, 'El correo electrónico es requerido'),
  password: z.string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres'),
  confirmPassword: z.string()
    .min(1, 'Confirma tu contraseña'),
  full_name: z.string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(200, 'El nombre no puede exceder 200 caracteres'),
  username: z.string()
    .min(3, 'El nombre de usuario debe tener al menos 3 caracteres')
    .max(50, 'El nombre de usuario no puede exceder 50 caracteres')
    .regex(/^[a-zA-Z0-9_-]+$/, 'El nombre de usuario solo puede contener letras, números, guiones y guiones bajos'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

// Schema para actualizar perfil
export const profileSchema = z.object({
  full_name: z.string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(200, 'El nombre no puede exceder 200 caracteres'),
  username: z.string()
    .min(3, 'El nombre de usuario debe tener al menos 3 caracteres')
    .max(50, 'El nombre de usuario no puede exceder 50 caracteres')
    .regex(/^[a-zA-Z0-9_-]+$/, 'El nombre de usuario solo puede contener letras, números, guiones y guiones bajos'),
  bio: z.string().max(500, 'La biografía no puede exceder 500 caracteres').optional(),
  experience_level: z.enum(['beginner', 'intermediate', 'advanced', 'expert']).optional(),
  location: z.string().max(200).optional(),
  phone: z.string().max(20).optional(),
  birth_date: z.string().optional(),
});

// Schema para registro de asistencia
export const attendeeRegistrationSchema = z.object({
  notes: z.string().max(500).optional(),
  experience_level: z.enum(['beginner', 'intermediate', 'advanced', 'expert']).optional(),
  emergency_contact: z.string().max(100).optional(),
  allergies: z.string().max(500).optional(),
  medical_conditions: z.string().max(500).optional(),
});

// Schema para calificación de ruta
export const ratingSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

// Schema para comentario
export const commentSchema = z.object({
  content: z.string()
    .min(1, 'El comentario no puede estar vacío')
    .max(1000, 'El comentario no puede exceder 1000 caracteres'),
  parent_id: z.string().uuid().optional(),
});

// Tipos inferidos
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
export type AttendeeRegistrationInput = z.infer<typeof attendeeRegistrationSchema>;
export type RatingInput = z.infer<typeof ratingSchema>;
export type CommentInput = z.infer<typeof commentSchema>;
