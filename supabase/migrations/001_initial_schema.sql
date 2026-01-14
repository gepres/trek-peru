-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS postgis;

-- =====================================================
-- TABLA: profiles
-- Descripción: Perfiles de usuario
-- =====================================================

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name VARCHAR(200) NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  experience_level VARCHAR(20) CHECK (experience_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
  location VARCHAR(200),
  phone VARCHAR(20),
  birth_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para profiles
CREATE INDEX idx_profiles_username ON profiles(username);

-- RLS Policies para profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by everyone"
ON profiles FOR SELECT
USING (true);

CREATE POLICY "Users can insert own profile"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);

-- =====================================================
-- TABLA: routes
-- Descripción: Rutas de trekking
-- =====================================================

CREATE TABLE routes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Información básica
  title VARCHAR(200) NOT NULL,
  description TEXT,
  slug VARCHAR(250) UNIQUE,

  -- Detalles técnicos
  difficulty VARCHAR(20) NOT NULL CHECK (difficulty IN ('easy', 'moderate', 'hard', 'extreme')),
  distance DECIMAL(10,2), -- en kilómetros
  elevation_gain INTEGER, -- desnivel positivo en metros
  elevation_loss INTEGER, -- desnivel negativo en metros
  estimated_duration DECIMAL(5,2), -- duración en horas
  min_altitude INTEGER,
  max_altitude INTEGER,
  terrain_type VARCHAR(100)[], -- array: ['mountain', 'forest', 'coast']

  -- Geolocalización
  meeting_point JSONB, -- {name, lat, lng, instructions}
  route_coordinates GEOGRAPHY(LINESTRING, 4326), -- ruta completa
  waypoints JSONB[], -- [{name, lat, lng, description}]
  region VARCHAR(100),
  province VARCHAR(100),

  -- Logística
  departure_date TIMESTAMPTZ,
  meeting_time TIME,
  min_capacity INTEGER DEFAULT 1,
  max_capacity INTEGER,
  cost DECIMAL(10,2),
  currency VARCHAR(3) DEFAULT 'PEN',
  includes TEXT[], -- ['transport', 'food', 'guide']
  not_includes TEXT[],

  -- Requisitos y seguridad
  requirements TEXT[],
  required_equipment TEXT[],
  optional_equipment TEXT[],
  technical_level VARCHAR(50),
  risks TEXT[],
  emergency_contact VARCHAR(100),

  -- Información adicional
  best_season VARCHAR(100)[], -- ['may', 'june', 'july']
  expected_weather VARCHAR(50),
  water_available BOOLEAN DEFAULT false,
  shelters BOOLEAN DEFAULT false,
  mobile_signal BOOLEAN DEFAULT false,

  -- Media
  featured_image TEXT,
  images TEXT[],
  gpx_file TEXT,
  video_url TEXT,

  -- Estado y visibilidad
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'cancelled', 'completed')),
  visibility VARCHAR(20) DEFAULT 'public' CHECK (visibility IN ('public', 'private', 'link')),
  featured BOOLEAN DEFAULT false,
  verified BOOLEAN DEFAULT false,

  -- Estadísticas
  views INTEGER DEFAULT 0,
  favorites INTEGER DEFAULT 0,
  average_rating DECIMAL(3,2) DEFAULT 0,
  total_ratings INTEGER DEFAULT 0,

  -- Búsqueda de texto
  search_vector TSVECTOR,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ,

  -- Constraints
  CONSTRAINT valid_capacity CHECK (max_capacity IS NULL OR max_capacity >= min_capacity)
);

-- Índices para performance en routes
CREATE INDEX idx_routes_creator ON routes(creator_id);
CREATE INDEX idx_routes_status ON routes(status);
CREATE INDEX idx_routes_difficulty ON routes(difficulty);
CREATE INDEX idx_routes_departure_date ON routes(departure_date);
CREATE INDEX idx_routes_region ON routes(region);
CREATE INDEX idx_routes_search ON routes USING GIN(search_vector);
CREATE INDEX idx_routes_coordinates ON routes USING GIST(route_coordinates);

-- =====================================================
-- FUNCIONES Y TRIGGERS
-- =====================================================

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para routes
CREATE TRIGGER routes_updated_at
BEFORE UPDATE ON routes
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Trigger para profiles
CREATE TRIGGER profiles_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Función para generar slug
CREATE OR REPLACE FUNCTION generate_slug()
RETURNS TRIGGER AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 1;
BEGIN
  -- Generar slug base desde el título
  base_slug := lower(regexp_replace(NEW.title, '[^a-zA-Z0-9\s]', '', 'g'));
  base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
  base_slug := substring(base_slug, 1, 200);

  final_slug := base_slug;

  -- Si el slug ya existe, agregar número
  WHILE EXISTS (SELECT 1 FROM routes WHERE slug = final_slug AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)) LOOP
    final_slug := base_slug || '-' || counter;
    counter := counter + 1;
  END LOOP;

  NEW.slug := final_slug;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER routes_generate_slug
BEFORE INSERT OR UPDATE OF title ON routes
FOR EACH ROW EXECUTE FUNCTION generate_slug();

-- Función para búsqueda de texto
CREATE OR REPLACE FUNCTION update_routes_search()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('spanish', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('spanish', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('spanish', COALESCE(NEW.region, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER routes_search_update
BEFORE INSERT OR UPDATE ON routes
FOR EACH ROW EXECUTE FUNCTION update_routes_search();

-- RLS Policies para routes
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public routes are viewable by everyone"
ON routes FOR SELECT
USING (
  (visibility = 'public' AND status = 'published')
  OR creator_id = auth.uid()
);

CREATE POLICY "Users can create routes"
ON routes FOR INSERT
WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Users can update their routes"
ON routes FOR UPDATE
USING (auth.uid() = creator_id);

CREATE POLICY "Users can delete their routes"
ON routes FOR DELETE
USING (auth.uid() = creator_id);

-- =====================================================
-- TABLA: attendees
-- Descripción: Participantes de rutas
-- =====================================================

CREATE TABLE attendees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  route_id UUID NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Estado de participación
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'waiting_list', 'completed')),

  -- Información adicional
  notes TEXT,
  experience_level VARCHAR(20),
  emergency_contact VARCHAR(100),
  allergies TEXT,
  medical_conditions TEXT,

  -- Valoración post-ruta
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,

  -- Timestamps
  registration_date TIMESTAMPTZ DEFAULT NOW(),
  confirmation_date TIMESTAMPTZ,
  cancellation_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraint: un usuario solo puede registrarse una vez por ruta
  UNIQUE(route_id, user_id)
);

-- Índices para attendees
CREATE INDEX idx_attendees_route ON attendees(route_id);
CREATE INDEX idx_attendees_user ON attendees(user_id);
CREATE INDEX idx_attendees_status ON attendees(status);

-- Trigger para updated_at en attendees
CREATE TRIGGER attendees_updated_at
BEFORE UPDATE ON attendees
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Función para verificar capacidad
CREATE OR REPLACE FUNCTION check_capacity()
RETURNS TRIGGER AS $$
DECLARE
  confirmed_count INTEGER;
  max_cap INTEGER;
BEGIN
  -- Obtener capacidad máxima de la ruta
  SELECT max_capacity INTO max_cap
  FROM routes
  WHERE id = NEW.route_id;

  -- Si no hay límite de capacidad, permitir
  IF max_cap IS NULL THEN
    RETURN NEW;
  END IF;

  -- Contar asistentes confirmados
  SELECT COUNT(*) INTO confirmed_count
  FROM attendees
  WHERE route_id = NEW.route_id
    AND status = 'confirmed'
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);

  -- Si se excede capacidad, poner en lista de espera
  IF confirmed_count >= max_cap AND NEW.status = 'confirmed' THEN
    NEW.status := 'waiting_list';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_capacity_trigger
BEFORE INSERT OR UPDATE ON attendees
FOR EACH ROW EXECUTE FUNCTION check_capacity();

-- RLS Policies para attendees
ALTER TABLE attendees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Attendees are viewable by route creators and participants"
ON attendees FOR SELECT
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM routes
    WHERE routes.id = attendees.route_id
    AND routes.creator_id = auth.uid()
  )
);

CREATE POLICY "Users can register as attendees"
ON attendees FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their attendance"
ON attendees FOR UPDATE
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM routes
    WHERE routes.id = attendees.route_id
    AND routes.creator_id = auth.uid()
  )
);

CREATE POLICY "Users can cancel their attendance"
ON attendees FOR DELETE
USING (auth.uid() = user_id);

-- =====================================================
-- TABLA: favorites
-- Descripción: Rutas favoritas de usuarios
-- =====================================================

CREATE TABLE favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  route_id UUID NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, route_id)
);

CREATE INDEX idx_favorites_user ON favorites(user_id);
CREATE INDEX idx_favorites_route ON favorites(route_id);

ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their favorites"
ON favorites FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can add favorites"
ON favorites FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their favorites"
ON favorites FOR DELETE
USING (auth.uid() = user_id);

-- =====================================================
-- TABLA: comments
-- Descripción: Comentarios en rutas
-- =====================================================

CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  route_id UUID NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,

  content TEXT NOT NULL,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT content_not_empty CHECK (length(trim(content)) > 0)
);

CREATE INDEX idx_comments_route ON comments(route_id);
CREATE INDEX idx_comments_user ON comments(user_id);
CREATE INDEX idx_comments_parent ON comments(parent_id);

CREATE TRIGGER comments_updated_at
BEFORE UPDATE ON comments
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comments are viewable by everyone"
ON comments FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can comment"
ON comments FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can edit their comments"
ON comments FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their comments"
ON comments FOR DELETE
USING (auth.uid() = user_id);

-- =====================================================
-- FUNCIONES DE UTILIDAD
-- =====================================================

-- Función para obtener rutas con detalles completos
CREATE OR REPLACE FUNCTION get_route_with_details(route_uuid UUID)
RETURNS TABLE (
  route_data JSONB,
  creator_data JSONB,
  attendees_data JSONB,
  total_attendees BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    to_jsonb(r.*) as route_data,
    to_jsonb(p.*) as creator_data,
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', a.id,
          'status', a.status,
          'user', to_jsonb(u.*)
        )
      )
      FROM attendees a
      JOIN profiles u ON a.user_id = u.id
      WHERE a.route_id = r.id
    ) as attendees_data,
    (
      SELECT COUNT(*)
      FROM attendees a
      WHERE a.route_id = r.id AND a.status = 'confirmed'
    ) as total_attendees
  FROM routes r
  JOIN profiles p ON r.creator_id = p.id
  WHERE r.id = route_uuid;
END;
$$ LANGUAGE plpgsql;

-- Función para buscar rutas cercanas (geospatial)
CREATE OR REPLACE FUNCTION search_nearby_routes(
  lat FLOAT,
  lng FLOAT,
  radius_km INTEGER DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  title VARCHAR,
  distance_km FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.id,
    r.title,
    ST_Distance(
      r.route_coordinates::geography,
      ST_Point(lng, lat)::geography
    ) / 1000 as distance_km
  FROM routes r
  WHERE r.status = 'published'
    AND r.visibility = 'public'
    AND r.route_coordinates IS NOT NULL
    AND ST_DWithin(
      r.route_coordinates::geography,
      ST_Point(lng, lat)::geography,
      radius_km * 1000
    )
  ORDER BY distance_km;
END;
$$ LANGUAGE plpgsql;
