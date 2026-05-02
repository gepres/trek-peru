-- Traspaso seguro de rutas entre usuarios.
-- Valida que el usuario autenticado sea el creador actual y permite resolver el destino por username o email.

CREATE OR REPLACE FUNCTION public.transfer_route_ownership(
  p_route_id UUID,
  p_recipient TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  current_user_id UUID := auth.uid();
  normalized_recipient TEXT := lower(trim(p_recipient));
  target_user_id UUID;
BEGIN
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Debes iniciar sesion para traspasar una ruta.';
  END IF;

  IF normalized_recipient IS NULL OR normalized_recipient = '' THEN
    RAISE EXCEPTION 'Ingresa un correo o username valido.';
  END IF;

  SELECT p.id
  INTO target_user_id
  FROM public.profiles p
  LEFT JOIN auth.users u ON u.id = p.id
  WHERE lower(coalesce(p.username, '')) = normalized_recipient
     OR lower(coalesce(u.email, '')) = normalized_recipient
  LIMIT 1;

  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'No se encontro un usuario con ese correo o username.';
  END IF;

  IF target_user_id = current_user_id THEN
    RAISE EXCEPTION 'No puedes traspasar una ruta a tu misma cuenta.';
  END IF;

  UPDATE public.routes
  SET creator_id = target_user_id
  WHERE id = p_route_id
    AND creator_id = current_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No tienes permisos para traspasar esta ruta o la ruta no existe.';
  END IF;

  -- TODO: Insertar una notificacion para el nuevo creador cuando exista el modulo de notificaciones.
END;
$$;

REVOKE ALL ON FUNCTION public.transfer_route_ownership(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.transfer_route_ownership(UUID, TEXT) TO authenticated;
