# Prompt for Claude Code: TrekPeru - Trekking Routes Platform

## Project Context

Create a collaborative multi-user web platform to share and organize trekking routes in Peru. Users can:
- Create and publish their own trekking routes
- Register as attendees for other users' routes
- View routes on interactive maps
- Manage their profiles and created routes

## Tech Stack

- **Frontend**: Next.js 15 (App Router) + TypeScript + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Storage + Realtime)
- **Maps**: Mapbox GL JS or Leaflet with OpenStreetMap
- **UI Components**: shadcn/ui
- **Forms**: React Hook Form + Zod
- **i18n**: next-intl (multilanguage ES/EN support)
- **State Management**: Zustand (only if necessary)

## Code Conventions

**CRITICAL REQUIREMENT**:
- ✅ **ALL code in ENGLISH**: variables, functions, classes, DB tables, columns, file names
- ✅ **Comments and documentation in SPANISH**: code comments, descriptions, README
- ✅ **UI text with i18n**: use translation system for Spanish/English

```typescript
// ✅ CORRECT
const userName = "John"; // Nombre del usuario
const createRoute = () => {} // Crear nueva ruta
const MAX_PARTICIPANTS = 20; // Número máximo de participantes

// ❌ INCORRECT
const nombreUsuario = "John"; // User name
const crearRuta = () => {} // Create new route
const MAX_PARTICIPANTES = 20; // Maximum participants
```

```sql
-- ✅ CORRECT
CREATE TABLE routes (
  id UUID PRIMARY KEY,
  title VARCHAR(200) NOT NULL, -- Título de la ruta
  difficulty VARCHAR(20) -- Dificultad: easy, moderate, hard, extreme
);

-- ❌ INCORRECT
CREATE TABLE rutas (
  id UUID PRIMARY KEY,
  titulo VARCHAR(200) NOT NULL, -- Route title
  dificultad VARCHAR(20) -- Difficulty: facil, moderada, dificil, extrema
);
```

## Project Structure

```
trek-peru/
├── app/
│   ├── [locale]/                      # i18n routes (es/en)
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   ├── register/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx
│   │   ├── (dashboard)/
│   │   │   ├── routes/
│   │   │   │   ├── page.tsx           # Lista de rutas
│   │   │   │   ├── [id]/
│   │   │   │   │   ├── page.tsx       # Detalle de ruta
│   │   │   │   │   └── edit/page.tsx  # Editar ruta
│   │   │   │   └── new/page.tsx       # Crear ruta
│   │   │   ├── my-routes/
│   │   │   │   └── page.tsx           # Rutas creadas por el usuario
│   │   │   ├── my-attendances/
│   │   │   │   └── page.tsx           # Rutas donde participa
│   │   │   ├── profile/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx
│   │   ├── layout.tsx
│   │   └── page.tsx                   # Landing page
│   └── api/
│       ├── routes/
│       │   └── route.ts
│       └── attendees/
│           └── route.ts
├── components/
│   ├── ui/                            # shadcn components
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   ├── RegisterForm.tsx
│   │   └── AuthGuard.tsx
│   ├── routes/
│   │   ├── RouteCard.tsx
│   │   ├── RouteForm.tsx
│   │   ├── RouteMap.tsx
│   │   ├── RouteMapEditor.tsx
│   │   ├── RouteFilters.tsx
│   │   └── AttendeesList.tsx
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── Sidebar.tsx
│   │   └── LanguageSwitcher.tsx       # Selector de idioma
│   └── shared/
│       ├── LoadingSpinner.tsx
│       └── ErrorBoundary.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts                  # Cliente Supabase
│   │   ├── server.ts                  # Server-side Supabase
│   │   └── middleware.ts
│   ├── validations/
│   │   ├── route.schema.ts
│   │   └── user.schema.ts
│   ├── utils/
│   │   ├── date.ts
│   │   ├── maps.ts
│   │   └── format.ts
│   └── hooks/
│       ├── useAuth.ts
│       ├── useRoutes.ts
│       └── useAttendees.ts
├── types/
│   ├── database.types.ts              # Tipos generados de Supabase
│   ├── route.types.ts
│   └── user.types.ts
├── messages/                          # Traducciones i18n
│   ├── es.json                        # Español
│   └── en.json                        # English
├── supabase/
│   ├── migrations/
│   │   └── 001_initial_schema.sql
│   └── seed.sql
├── public/
│   └── images/
├── i18n.ts                            # Configuración i18n
├── middleware.ts                      # Middleware para i18n + Supabase
├── .env.local.example
├── .env.local
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

## Database Schema (Supabase)

**IMPORTANT**: All table names, columns, and constraints in ENGLISH. Comments in SPANISH.

### 1. Table: `profiles` (User profiles)

```sql
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

-- RLS Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by everyone" 
ON profiles FOR SELECT 
USING (true);

CREATE POLICY "Users can update own profile" 
ON profiles FOR UPDATE 
USING (auth.uid() = id);
```

### 2. Table: `routes` (Trekking routes)

```sql
-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS postgis;

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

-- Índices para performance
CREATE INDEX idx_routes_creator ON routes(creator_id);
CREATE INDEX idx_routes_status ON routes(status);
CREATE INDEX idx_routes_difficulty ON routes(difficulty);
CREATE INDEX idx_routes_departure_date ON routes(departure_date);
CREATE INDEX idx_routes_region ON routes(region);
CREATE INDEX idx_routes_search ON routes USING GIN(search_vector);
CREATE INDEX idx_routes_coordinates ON routes USING GIST(route_coordinates);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER routes_updated_at
BEFORE UPDATE ON routes
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Trigger para generar slug
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

-- Trigger para búsqueda de texto
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

-- RLS Policies
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public routes are viewable by everyone"
ON routes FOR SELECT
USING (
  visibility = 'public' AND status = 'published'
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
```

### 3. Table: `attendees` (Route participants)

```sql
CREATE TABLE attendees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  route_id UUID NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Estado de participación
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'waiting_list', 'completed')),
  
  -- Información adicional
  notes TEXT, -- Ej: "Llevo cámara", "Primera vez en trekking"
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

-- Índices
CREATE INDEX idx_attendees_route ON attendees(route_id);
CREATE INDEX idx_attendees_user ON attendees(user_id);
CREATE INDEX idx_attendees_status ON attendees(status);

-- Trigger para updated_at
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

-- RLS Policies
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
```

### 4. Table: `favorites`

```sql
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
```

### 5. Table: `comments`

```sql
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  route_id UUID NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE, -- Para respuestas
  
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
```

### 6. Storage Buckets

```sql
-- Crear buckets en Supabase Storage
-- avatars: Fotos de perfil (public)
-- route-images: Imágenes de rutas (public)
-- route-gpx: Archivos GPX (public)
```

### 7. Database Functions

```sql
-- Función para obtener rutas con detalles de asistentes
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
    AND ST_DWithin(
      r.route_coordinates::geography,
      ST_Point(lng, lat)::geography,
      radius_km * 1000
    )
  ORDER BY distance_km;
END;
$$ LANGUAGE plpgsql;
```

## TypeScript Types

```typescript
// types/database.types.ts
export type Difficulty = 'easy' | 'moderate' | 'hard' | 'extreme';
export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';
export type RouteStatus = 'draft' | 'published' | 'cancelled' | 'completed';
export type RouteVisibility = 'public' | 'private' | 'link';
export type AttendeeStatus = 'pending' | 'confirmed' | 'cancelled' | 'waiting_list' | 'completed';

// types/route.types.ts
export interface Route {
  id: string;
  creator_id: string;
  title: string;
  description?: string;
  slug: string;
  difficulty: Difficulty;
  distance?: number;
  elevation_gain?: number;
  elevation_loss?: number;
  estimated_duration?: number;
  min_altitude?: number;
  max_altitude?: number;
  terrain_type?: string[];
  meeting_point?: {
    name: string;
    lat: number;
    lng: number;
    instructions?: string;
  };
  route_coordinates?: any; // GeoJSON
  waypoints?: Array<{
    name: string;
    lat: number;
    lng: number;
    description?: string;
  }>;
  region?: string;
  province?: string;
  departure_date?: string;
  meeting_time?: string;
  min_capacity?: number;
  max_capacity?: number;
  cost?: number;
  currency?: string;
  includes?: string[];
  not_includes?: string[];
  requirements?: string[];
  required_equipment?: string[];
  optional_equipment?: string[];
  technical_level?: string;
  risks?: string[];
  emergency_contact?: string;
  best_season?: string[];
  expected_weather?: string;
  water_available?: boolean;
  shelters?: boolean;
  mobile_signal?: boolean;
  featured_image?: string;
  images?: string[];
  gpx_file?: string;
  video_url?: string;
  status: RouteStatus;
  visibility: RouteVisibility;
  featured?: boolean;
  verified?: boolean;
  views?: number;
  favorites?: number;
  average_rating?: number;
  total_ratings?: number;
  created_at: string;
  updated_at: string;
  published_at?: string;
}

export interface RouteWithCreator extends Route {
  creator: Profile;
  total_attendees?: number;
  is_favorite?: boolean;
  my_attendance?: Attendee;
}

export interface Attendee {
  id: string;
  route_id: string;
  user_id: string;
  status: AttendeeStatus;
  notes?: string;
  experience_level?: ExperienceLevel;
  emergency_contact?: string;
  allergies?: string;
  medical_conditions?: string;
  rating?: number;
  comment?: string;
  registration_date: string;
  confirmation_date?: string;
  cancellation_date?: string;
  created_at: string;
  updated_at: string;
}

export interface AttendeeWithUser extends Attendee {
  user: Profile;
}

export interface Profile {
  id: string;
  full_name: string;
  username: string;
  avatar_url?: string;
  bio?: string;
  experience_level?: ExperienceLevel;
  location?: string;
  phone?: string;
  birth_date?: string;
  created_at: string;
  updated_at: string;
}
```

## Main Components Examples

### RouteForm.tsx (Create/Edit form)

```typescript
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import RouteMapEditor from './RouteMapEditor';

const routeSchema = z.object({
  title: z.string().min(5, 'Minimum 5 characters').max(200),
  description: z.string().optional(),
  difficulty: z.enum(['easy', 'moderate', 'hard', 'extreme']),
  distance: z.number().positive().optional(),
  estimated_duration: z.number().positive().optional(),
  // ... más validaciones
});

export default function RouteForm({ route, onSubmit }: any) {
  const t = useTranslations('routes');
  
  const form = useForm({
    resolver: zodResolver(routeSchema),
    defaultValues: route || {}
  });
  
  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <label>{t('form.title')}</label>
        <Input {...form.register('title')} />
        {form.formState.errors.title && (
          <p className="text-red-500">{form.formState.errors.title.message}</p>
        )}
      </div>

      <div>
        <label>{t('form.difficulty')}</label>
        <Select {...form.register('difficulty')}>
          <option value="easy">{t('difficulty.easy')}</option>
          <option value="moderate">{t('difficulty.moderate')}</option>
          <option value="hard">{t('difficulty.hard')}</option>
          <option value="extreme">{t('difficulty.extreme')}</option>
        </Select>
      </div>
      
      <RouteMapEditor 
        onChange={(coords) => form.setValue('route_coordinates', coords)}
      />
      
      <Button type="submit">{t('form.save')}</Button>
    </form>
  );
}
```

### RouteCard.tsx (Route card)

```typescript
import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Users, Clock, TrendingUp } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { RouteWithCreator } from '@/types/route.types';
import { Badge } from '@/components/ui/badge';

interface RouteCardProps {
  route: RouteWithCreator;
  locale: string;
}

export default function RouteCard({ route, locale }: RouteCardProps) {
  const t = useTranslations('routes');
  
  return (
    <Link href={`/${locale}/routes/${route.slug}`}>
      <div className="border rounded-lg overflow-hidden hover:shadow-lg transition">
        <div className="relative h-48">
          <Image
            src={route.featured_image || '/placeholder.jpg'}
            alt={route.title}
            fill
            className="object-cover"
          />
          <Badge className="absolute top-2 right-2">
            {t(`difficulty.${route.difficulty}`)}
          </Badge>
        </div>
        
        <div className="p-4">
          <h3 className="font-bold text-lg mb-2">{route.title}</h3>
          
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {route.distance}km
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {route.estimated_duration}h
            </span>
            <span className="flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              {route.elevation_gain}m
            </span>
          </div>
          
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2">
              <Image
                src={route.creator.avatar_url || '/avatar-default.png'}
                alt={route.creator.full_name}
                width={24}
                height={24}
                className="rounded-full"
              />
              <span className="text-sm">{route.creator.full_name}</span>
            </div>
            
            {route.total_attendees && (
              <span className="flex items-center gap-1 text-sm">
                <Users className="w-4 h-4" />
                {route.total_attendees}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
```

### RouteMap.tsx (Map visualization)

```typescript
'use client';

import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface RouteMapProps {
  coordinates: any; // GeoJSON LineString
  waypoints?: Array<{ name: string; lat: number; lng: number }>;
  meetingPoint?: { lat: number; lng: number };
}

export default function RouteMap({ coordinates, waypoints, meetingPoint }: RouteMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/outdoors-v12',
      center: [-77.0428, -12.0464], // Lima, Perú
      zoom: 9
    });

    // Agregar la ruta
    if (coordinates) {
      map.current.on('load', () => {
        map.current!.addSource('route', {
          type: 'geojson',
          data: coordinates
        });

        map.current!.addLayer({
          id: 'route-line',
          type: 'line',
          source: 'route',
          paint: {
            'line-color': '#3b82f6',
            'line-width': 3
          }
        });

        // Ajustar vista a la ruta
        const bounds = new mapboxgl.LngLatBounds();
        coordinates.coordinates.forEach((coord: [number, number]) => {
          bounds.extend(coord);
        });
        map.current!.fitBounds(bounds, { padding: 50 });
      });
    }

    // Agregar waypoints
    waypoints?.forEach((wp) => {
      new mapboxgl.Marker({ color: '#f59e0b' })
        .setLngLat([wp.lng, wp.lat])
        .setPopup(new mapboxgl.Popup().setHTML(`<h3>${wp.name}</h3>`))
        .addTo(map.current!);
    });

    // Agregar punto de encuentro
    if (meetingPoint) {
      new mapboxgl.Marker({ color: '#10b981' })
        .setLngLat([meetingPoint.lng, meetingPoint.lat])
        .addTo(map.current!);
    }

    return () => map.current?.remove();
  }, [coordinates, waypoints, meetingPoint]);

  return <div ref={mapContainer} className="w-full h-[500px] rounded-lg" />;
}
```

## Custom Hooks

### useRoutes.ts

```typescript
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { RouteWithCreator } from '@/types/route.types';

export function useRoutes(filters?: {
  difficulty?: string;
  region?: string;
  search?: string;
}) {
  const [routes, setRoutes] = useState<RouteWithCreator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRoutes();
  }, [filters]);

  async function fetchRoutes() {
    try {
      setLoading(true);
      
      let query = supabase
        .from('routes')
        .select(`
          *,
          creator:profiles(*),
          attendees(count)
        `)
        .eq('status', 'published')
        .eq('visibility', 'public')
        .order('created_at', { ascending: false });

      if (filters?.difficulty) {
        query = query.eq('difficulty', filters.difficulty);
      }

      if (filters?.region) {
        query = query.eq('region', filters.region);
      }

      if (filters?.search) {
        query = query.textSearch('search_vector', filters.search);
      }

      const { data, error } = await query;

      if (error) throw error;
      setRoutes(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  return { routes, loading, error, refetch: fetchRoutes };
}
```

### useAuth.ts

```typescript
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import { Profile } from '@/types/route.types';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Obtener sesión actual
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchProfile(session.user.id);
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  return { user, profile, loading, signOut };
}
```

## i18n Configuration

### i18n.ts

```typescript
import { getRequestConfig } from 'next-intl/server';

export const locales = ['es', 'en'] as const;
export const defaultLocale = 'es' as const;

export type Locale = (typeof locales)[number];

export default getRequestConfig(async ({ locale }) => ({
  messages: (await import(`./messages/${locale}.json`)).default
}));
```

### middleware.ts

```typescript
import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './i18n';

export default createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always'
});

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};
```

### messages/es.json

```json
{
  "routes": {
    "title": "Rutas de Trekking",
    "newRoute": "Nueva Ruta",
    "myRoutes": "Mis Rutas",
    "form": {
      "title": "Título",
      "description": "Descripción",
      "difficulty": "Dificultad",
      "distance": "Distancia (km)",
      "duration": "Duración (horas)",
      "save": "Guardar"
    },
    "difficulty": {
      "easy": "Fácil",
      "moderate": "Moderada",
      "hard": "Difícil",
      "extreme": "Extrema"
    },
    "status": {
      "draft": "Borrador",
      "published": "Publicada",
      "cancelled": "Cancelada",
      "completed": "Completada"
    }
  },
  "auth": {
    "login": "Iniciar Sesión",
    "register": "Registrarse",
    "logout": "Cerrar Sesión",
    "email": "Correo electrónico",
    "password": "Contraseña"
  }
}
```

### messages/en.json

```json
{
  "routes": {
    "title": "Trekking Routes",
    "newRoute": "New Route",
    "myRoutes": "My Routes",
    "form": {
      "title": "Title",
      "description": "Description",
      "difficulty": "Difficulty",
      "distance": "Distance (km)",
      "duration": "Duration (hours)",
      "save": "Save"
    },
    "difficulty": {
      "easy": "Easy",
      "moderate": "Moderate",
      "hard": "Hard",
      "extreme": "Extreme"
    },
    "status": {
      "draft": "Draft",
      "published": "Published",
      "cancelled": "Cancelled",
      "completed": "Completed"
    }
  },
  "auth": {
    "login": "Login",
    "register": "Register",
    "logout": "Logout",
    "email": "Email",
    "password": "Password"
  }
}
```

## Supabase Configuration

```typescript
// lib/supabase/client.ts
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export const supabase = createClientComponentClient();

// lib/supabase/server.ts
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const createClient = () => {
  const cookieStore = cookies();
  return createServerComponentClient({ cookies: () => cookieStore });
};
```

## Environment Variables (.env.local)

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your-anon-key

# Mapbox
NEXT_PUBLIC_MAPBOX_TOKEN=your-mapbox-token

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Specific Features to Implement

### 1. Authentication
- Register with email/password
- Login
- OAuth with Google (optional)
- Password recovery
- Profile update

### 2. Routes CRUD
- Create new route with multi-step form
- Edit existing route (only creator)
- Delete route (only creator)
- Publish/unpublish route
- Upload multiple images
- Upload GPX file

### 3. Attendees Management
- Register for a route
- Cancel attendance
- View attendees list (route creator)
- Confirm/reject attendees (route creator)
- Status change notifications

### 4. Search and Filters
- Text search (title, description)
- Filter by difficulty
- Filter by region
- Filter by date range
- Filter by distance
- Geographic search (nearby routes)

### 5. Interactive Map
- View all routes on map
- Draw route on map when creating/editing
- Add waypoints
- Mark meeting point
- Export route to GPX

### 6. Favorites System
- Mark route as favorite
- View my favorite routes
- Favorites counter

### 7. Comments and Ratings
- Comment on routes
- Reply to comments
- Rate route (1-5 stars)
- View average ratings

### 8. Personal Dashboard
- My created routes
- Routes I'm attending
- Completed routes history
- Personal statistics

### 9. Responsive Design
- Mobile-first
- Tablet optimized
- Full desktop

### 10. Performance
- Server-side rendering for SEO
- Image lazy loading
- Infinite scroll in listings
- Caching with React Query or SWR

## Installation Instructions

```bash
# Crear proyecto Next.js
npx create-next-app@latest trek-peru --typescript --tailwind --app

# Instalar dependencias
cd trek-peru
npm install @supabase/auth-helpers-nextjs @supabase/supabase-js
npm install mapbox-gl @types/mapbox-gl
npm install react-hook-form @hookform/resolvers zod
npm install next-intl
npm install date-fns
npm install lucide-react
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu
npm install class-variance-authority clsx tailwind-merge

# Instalar shadcn/ui
npx shadcn-ui@latest init
npx shadcn-ui@latest add button input textarea select card badge dialog dropdown-menu

# Configurar Supabase
# 1. Crear proyecto en supabase.com
# 2. Copiar URL y anon key a .env.local
# 3. Ejecutar migraciones SQL en el SQL Editor

# Ejecutar desarrollo
npm run dev
```

## Development Priorities

### Phase 1 - MVP (1-2 weeks)
1. ✅ Initial project setup
2. ✅ Database schema
3. ✅ Basic authentication system
4. ✅ Routes CRUD (without map)
5. ✅ Routes listing and detail
6. ✅ Basic attendees system

### Phase 2 - Core Features (2-3 weeks)
1. ✅ Maps integration (Mapbox)
2. ✅ Image upload
3. ✅ Search and filters
4. ✅ Personal dashboard
5. ✅ Favorites system

### Phase 3 - Improvements (2-3 weeks)
1. ✅ Comments and ratings
2. ✅ Notifications
3. ✅ Export GPX
4. ✅ Performance optimizations
5. ✅ Testing

## Important Notes

- **SEO**: Use generateMetadata on each page
- **Images**: Optimize with Next/Image
- **Security**: Always validate with Supabase RLS
- **Performance**: Use React.lazy for heavy components
- **Accessibility**: Follow WCAG practices
- **Responsive**: Mobile-first approach
- **Errors**: Implement error boundaries
- **Loading**: Loading states in all async operations
- **i18n**: All UI text must use translations
- **Code**: ALL code in English, comments in Spanish

## Testing

```bash
# Instalar dependencias de testing
npm install -D @testing-library/react @testing-library/jest-dom jest jest-environment-jsdom

# Ejecutar tests
npm run test
```

---

**Objective**: Create a robust, scalable, and easy-to-use platform for the trekking community in Peru.

**Stack**: Next.js 15 + Supabase + TypeScript + Tailwind CSS + shadcn/ui + Mapbox + next-intl

**Estimated timeline**: 6-8 weeks for complete version

**Hosting cost**: $0-25/month (Vercel free + Supabase $25/month when scaling)
