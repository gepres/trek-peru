-- Foundation for groups/communities and route association.
-- Existing routes remain personal because routes.group_id is nullable.

CREATE TABLE public.groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  name VARCHAR(120) NOT NULL,
  slug VARCHAR(80) NOT NULL UNIQUE,
  slogan VARCHAR(160),
  description TEXT,
  logo_url TEXT,
  cover_image_url TEXT,

  type VARCHAR(20) NOT NULL DEFAULT 'community'
    CHECK (type IN ('community', 'company')),
  visibility VARCHAR(20) NOT NULL DEFAULT 'public'
    CHECK (visibility IN ('public', 'private')),

  legal_name VARCHAR(200),
  tax_id VARCHAR(30),
  business_email VARCHAR(200),
  business_phone VARCHAR(30),
  website TEXT,
  address TEXT,
  certificate_url TEXT,
  verification_status VARCHAR(20) NOT NULL DEFAULT 'none'
    CHECK (verification_status IN ('none', 'pending', 'verified', 'rejected')),
  verification_notes TEXT,
  verified_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT groups_slug_format CHECK (slug ~ '^[a-z0-9][a-z0-9-]{2,79}$'),
  CONSTRAINT groups_company_fields CHECK (
    type <> 'company'
    OR (
      legal_name IS NOT NULL
      AND tax_id IS NOT NULL
      AND business_email IS NOT NULL
    )
  )
);

CREATE TABLE public.group_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL DEFAULT 'member'
    CHECK (role IN ('owner', 'admin', 'organizer', 'member')),
  invited_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(group_id, user_id)
);

CREATE TABLE public.group_followers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(group_id, user_id)
);

ALTER TABLE public.routes
  ADD COLUMN group_id UUID REFERENCES public.groups(id) ON DELETE SET NULL,
  ADD COLUMN show_creator_on_group_routes BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX idx_groups_owner ON public.groups(owner_id);
CREATE INDEX idx_groups_slug ON public.groups(slug);
CREATE INDEX idx_groups_type ON public.groups(type);
CREATE INDEX idx_groups_verification_status ON public.groups(verification_status);
CREATE INDEX idx_group_members_group ON public.group_members(group_id);
CREATE INDEX idx_group_members_user ON public.group_members(user_id);
CREATE INDEX idx_group_members_role ON public.group_members(group_id, role);
CREATE INDEX idx_group_followers_group ON public.group_followers(group_id);
CREATE INDEX idx_group_followers_user ON public.group_followers(user_id);
CREATE INDEX idx_routes_group ON public.routes(group_id);

CREATE TRIGGER groups_updated_at
BEFORE UPDATE ON public.groups
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER group_members_updated_at
BEFORE UPDATE ON public.group_members
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE FUNCTION public.is_group_member(
  p_group_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.group_members gm
    WHERE gm.group_id = p_group_id
      AND gm.user_id = p_user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.can_manage_group(
  p_group_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.groups g
    WHERE g.id = p_group_id
      AND g.owner_id = p_user_id
  )
  OR EXISTS (
    SELECT 1
    FROM public.group_members gm
    WHERE gm.group_id = p_group_id
      AND gm.user_id = p_user_id
      AND gm.role IN ('owner', 'admin')
  );
$$;

CREATE OR REPLACE FUNCTION public.can_organize_group_route(
  p_group_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.groups g
    WHERE g.id = p_group_id
      AND g.owner_id = p_user_id
  )
  OR EXISTS (
    SELECT 1
    FROM public.group_members gm
    WHERE gm.group_id = p_group_id
      AND gm.user_id = p_user_id
      AND gm.role IN ('owner', 'admin', 'organizer')
  );
$$;

REVOKE ALL ON FUNCTION public.is_group_member(UUID, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.can_manage_group(UUID, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.can_organize_group_route(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_group_member(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_manage_group(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_organize_group_route(UUID, UUID) TO authenticated;

ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_followers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Groups are viewable by everyone"
ON public.groups FOR SELECT
USING (
  visibility = 'public'
  OR public.is_group_member(id, auth.uid())
);

CREATE POLICY "Users can create owned groups"
ON public.groups FOR INSERT
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Group managers can update groups"
ON public.groups FOR UPDATE
USING (public.can_manage_group(id, auth.uid()))
WITH CHECK (public.can_manage_group(id, auth.uid()));

CREATE POLICY "Group owners can delete groups"
ON public.groups FOR DELETE
USING (auth.uid() = owner_id);

CREATE POLICY "Group members are viewable for visible groups"
ON public.group_members FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.groups g
    WHERE g.id = group_id
      AND (
        g.visibility = 'public'
        OR public.is_group_member(g.id, auth.uid())
      )
  )
);

CREATE POLICY "Group managers can add members"
ON public.group_members FOR INSERT
WITH CHECK (public.can_manage_group(group_id, auth.uid()));

CREATE POLICY "Group managers can update members"
ON public.group_members FOR UPDATE
USING (public.can_manage_group(group_id, auth.uid()))
WITH CHECK (public.can_manage_group(group_id, auth.uid()));

CREATE POLICY "Group managers can remove members"
ON public.group_members FOR DELETE
USING (
  public.can_manage_group(group_id, auth.uid())
  AND role <> 'owner'
);

CREATE POLICY "Group followers are viewable by everyone"
ON public.group_followers FOR SELECT
USING (true);

CREATE POLICY "Users can follow groups"
ON public.group_followers FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unfollow groups"
ON public.group_followers FOR DELETE
USING (
  auth.uid() = user_id
  OR public.can_manage_group(group_id, auth.uid())
);

DROP POLICY IF EXISTS "Users can create routes" ON public.routes;
CREATE POLICY "Users can create routes"
ON public.routes FOR INSERT
WITH CHECK (
  auth.uid() = creator_id
  AND (
    group_id IS NULL
    OR public.can_organize_group_route(group_id, auth.uid())
  )
);

DROP POLICY IF EXISTS "Users can update their routes" ON public.routes;
CREATE POLICY "Users can update their routes"
ON public.routes FOR UPDATE
USING (auth.uid() = creator_id)
WITH CHECK (
  auth.uid() = creator_id
  AND (
    group_id IS NULL
    OR public.can_organize_group_route(group_id, auth.uid())
  )
);

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
  SET
    creator_id = target_user_id,
    group_id = NULL,
    show_creator_on_group_routes = false
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
