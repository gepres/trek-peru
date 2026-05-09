-- Delete a group and detach all dependent records in one transaction.

CREATE OR REPLACE FUNCTION public.delete_group_with_cleanup(
  p_group_id UUID,
  p_group_name_confirmation TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_group public.groups%ROWTYPE;
BEGIN
  SELECT *
  INTO target_group
  FROM public.groups
  WHERE id = p_group_id
  FOR UPDATE;

  IF target_group.id IS NULL THEN
    RAISE EXCEPTION 'Grupo no encontrado.';
  END IF;

  IF auth.uid() IS NULL OR auth.uid() <> target_group.owner_id THEN
    RAISE EXCEPTION 'Solo el creador puede eliminar este grupo.';
  END IF;

  IF trim(coalesce(p_group_name_confirmation, '')) <> target_group.name THEN
    RAISE EXCEPTION 'Escribe el nombre completo del grupo para confirmar la eliminacion.';
  END IF;

  UPDATE public.routes
  SET
    group_id = NULL,
    show_creator_on_group_routes = false,
    updated_at = NOW()
  WHERE group_id = p_group_id;

  DELETE FROM public.group_followers
  WHERE group_id = p_group_id;

  DELETE FROM public.group_members
  WHERE group_id = p_group_id;

  DELETE FROM public.groups
  WHERE id = p_group_id;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_group_with_cleanup(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_group_with_cleanup(UUID, TEXT) TO authenticated;
