-- Migración: Permitir username NULL para usuarios OAuth (Google)
-- Fecha: 2026-03-10
-- Descripción: El trigger handle_new_user falla con "Database error saving new user"
--              cuando un usuario se registra con Google porque username llega NULL
--              desde raw_user_meta_data, pero la columna tiene NOT NULL constraint.
--              La solución es hacer username nullable (PostgreSQL permite múltiples NULLs
--              en columnas UNIQUE) y actualizar el trigger para insertar NULL en ese caso.
--              La página /complete-profile se encarga de recoger username y phone después.

-- 1. Hacer username nullable (conserva el UNIQUE constraint)
ALTER TABLE public.profiles
  ALTER COLUMN username DROP NOT NULL;

-- 2. Actualizar el trigger para manejar usuarios OAuth sin username
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, username, avatar_url, phone)
  VALUES (
    NEW.id,
    -- Google provee full_name; email/password lo recibe del formulario
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    -- username puede ser NULL para OAuth; se completa en /complete-profile
    NULLIF(NEW.raw_user_meta_data->>'username', ''),
    NEW.raw_user_meta_data->>'avatar_url',
    NULLIF(NEW.raw_user_meta_data->>'phone', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
