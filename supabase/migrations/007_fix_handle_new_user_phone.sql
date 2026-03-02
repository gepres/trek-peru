-- Migración: Agregar phone al trigger handle_new_user
-- Fecha: 2026-03-01
-- Descripción: El trigger original no incluía el campo phone en el INSERT de profiles.
--              Al crear un usuario con email confirmation activo, el cliente no tiene
--              sesión todavía, por lo que el UPDATE posterior falla silenciosamente
--              por RLS. La solución definitiva es que el trigger (SECURITY DEFINER)
--              inserte el phone directamente desde raw_user_meta_data.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, username, avatar_url, phone)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'username',
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'phone'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
