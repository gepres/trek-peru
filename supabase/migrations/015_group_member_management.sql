-- Secure group member management helpers.
-- These functions let managers add users by username/email without exposing auth.users to the client.

CREATE OR REPLACE FUNCTION public.add_group_member_by_identifier(
  p_group_id UUID,
  p_identifier TEXT,
  p_role TEXT DEFAULT 'member'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  normalized_identifier TEXT := lower(trim(p_identifier));
  target_user_id UUID;
  normalized_role TEXT := lower(trim(p_role));
BEGIN
  IF NOT public.can_manage_group(p_group_id, auth.uid()) THEN
    RAISE EXCEPTION 'No tienes permisos para agregar miembros a este grupo.';
  END IF;

  IF normalized_identifier IS NULL OR normalized_identifier = '' THEN
    RAISE EXCEPTION 'Ingresa un correo o username valido.';
  END IF;

  IF normalized_role NOT IN ('admin', 'organizer', 'member') THEN
    RAISE EXCEPTION 'Rol de grupo invalido.';
  END IF;

  SELECT p.id
  INTO target_user_id
  FROM public.profiles p
  LEFT JOIN auth.users u ON u.id = p.id
  WHERE lower(coalesce(p.username, '')) = normalized_identifier
     OR lower(coalesce(u.email, '')) = normalized_identifier
  LIMIT 1;

  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'No se encontro un usuario con ese correo o username.';
  END IF;

  INSERT INTO public.group_members (group_id, user_id, role, invited_by)
  VALUES (p_group_id, target_user_id, normalized_role, auth.uid())
  ON CONFLICT (group_id, user_id)
  DO UPDATE SET
    role = CASE
      WHEN public.group_members.role = 'owner' THEN public.group_members.role
      ELSE EXCLUDED.role
    END,
    updated_at = NOW();
END;
$$;

CREATE OR REPLACE FUNCTION public.update_group_member_role(
  p_member_id UUID,
  p_role TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_group_id UUID;
  target_role TEXT;
  normalized_role TEXT := lower(trim(p_role));
BEGIN
  SELECT group_id, role
  INTO target_group_id, target_role
  FROM public.group_members
  WHERE id = p_member_id;

  IF target_group_id IS NULL THEN
    RAISE EXCEPTION 'Miembro no encontrado.';
  END IF;

  IF NOT public.can_manage_group(target_group_id, auth.uid()) THEN
    RAISE EXCEPTION 'No tienes permisos para cambiar roles en este grupo.';
  END IF;

  IF target_role = 'owner' THEN
    RAISE EXCEPTION 'No puedes cambiar el rol del creador del grupo.';
  END IF;

  IF normalized_role NOT IN ('admin', 'organizer', 'member') THEN
    RAISE EXCEPTION 'Rol de grupo invalido.';
  END IF;

  UPDATE public.group_members
  SET role = normalized_role, updated_at = NOW()
  WHERE id = p_member_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.remove_group_member(
  p_member_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_group_id UUID;
  target_role TEXT;
BEGIN
  SELECT group_id, role
  INTO target_group_id, target_role
  FROM public.group_members
  WHERE id = p_member_id;

  IF target_group_id IS NULL THEN
    RAISE EXCEPTION 'Miembro no encontrado.';
  END IF;

  IF NOT public.can_manage_group(target_group_id, auth.uid()) THEN
    RAISE EXCEPTION 'No tienes permisos para quitar miembros de este grupo.';
  END IF;

  IF target_role = 'owner' THEN
    RAISE EXCEPTION 'No puedes quitar al creador del grupo.';
  END IF;

  DELETE FROM public.group_members
  WHERE id = p_member_id;
END;
$$;

REVOKE ALL ON FUNCTION public.add_group_member_by_identifier(UUID, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.update_group_member_role(UUID, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.remove_group_member(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.add_group_member_by_identifier(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_group_member_role(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.remove_group_member(UUID) TO authenticated;
