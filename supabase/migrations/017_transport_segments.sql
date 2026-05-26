-- Feature "Cómo llegar": tramos de transporte definidos por el creador
-- + opciones (alternativas) por tramo + función agregada para sugerencias
-- dinámicas crowdsourced del lado del lector.
--
-- Modelo: 1 ruta → N segmentos (orden importa) → 1..N opciones por segmento.
-- El creador escribe sus tramos manualmente; el lector ve además sugerencias
-- agregadas de otros creadores que hayan documentado el mismo tramo from→to.

CREATE EXTENSION IF NOT EXISTS unaccent;

-- Wrapper IMMUTABLE de unaccent — necesaria para columnas GENERATED ... STORED.
-- unaccent() es STABLE por defecto porque resuelve el diccionario vía search_path;
-- al fijar el diccionario explícitamente ('public.unaccent'::regdictionary) la
-- función se vuelve determinista y podemos declararla IMMUTABLE.
CREATE OR REPLACE FUNCTION public.immutable_unaccent(text)
RETURNS text
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
STRICT
AS $$
  SELECT public.unaccent('public.unaccent'::regdictionary, $1)
$$;

-- =============================================================================
-- Tabla: route_transport_segments
-- Un paso del recorrido (ej. "De Cusco a Tinki").
-- =============================================================================
CREATE TABLE public.route_transport_segments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  route_id UUID NOT NULL REFERENCES public.routes(id) ON DELETE CASCADE,

  order_index INTEGER NOT NULL,
  title VARCHAR(160),                                  -- opcional, "Lima → Cusco"

  from_label VARCHAR(160) NOT NULL,                    -- "Cusco"
  from_coordinates GEOGRAPHY(POINT, 4326),
  to_label VARCHAR(160) NOT NULL,                      -- "Tinki"
  to_coordinates GEOGRAPHY(POINT, 4326),

  -- Columnas generadas para deduplicación / búsqueda de alternativas
  from_normalized TEXT GENERATED ALWAYS AS (
    lower(trim(public.immutable_unaccent(from_label)))
  ) STORED,
  to_normalized TEXT GENERATED ALWAYS AS (
    lower(trim(public.immutable_unaccent(to_label)))
  ) STORED,

  notes TEXT,                                          -- consejos generales del paso

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_route_segment_order UNIQUE (route_id, order_index)
);

CREATE INDEX idx_transport_segments_route
  ON public.route_transport_segments(route_id);

CREATE INDEX idx_transport_segments_from_to_norm
  ON public.route_transport_segments(from_normalized, to_normalized);

CREATE TRIGGER transport_segments_updated_at
BEFORE UPDATE ON public.route_transport_segments
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

COMMENT ON TABLE public.route_transport_segments IS
  'Tramo individual del trayecto "cómo llegar" (paso A→B). Pertenece a una ruta y tiene 1..N opciones de transporte.';
COMMENT ON COLUMN public.route_transport_segments.order_index IS
  'Orden secuencial del paso dentro de la ruta (1, 2, 3...).';
COMMENT ON COLUMN public.route_transport_segments.from_normalized IS
  'Versión normalizada (lowercase + sin acentos) usada para agrupar tramos equivalentes entre rutas.';

-- =============================================================================
-- Tabla: route_transport_options
-- Una alternativa de transporte para un segmento (ej. "Bus Cruz del Sur, 3h, S/25").
-- =============================================================================
CREATE TABLE public.route_transport_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  segment_id UUID NOT NULL REFERENCES public.route_transport_segments(id) ON DELETE CASCADE,

  -- Tipo y proveedor
  mode VARCHAR(20) NOT NULL CHECK (mode IN (
    'bus', 'plane', 'taxi', 'combi', 'colectivo',
    'train', 'motorcycle', 'boat', 'car', 'walk', 'bike', 'other'
  )),
  operator VARCHAR(120),                               -- "Cruz del Sur", "LATAM"
  class VARCHAR(40),                                   -- "cama", "semicama", "economy"

  -- Tiempos
  time_mode VARCHAR(20) NOT NULL DEFAULT 'approximate'
    CHECK (time_mode IN ('exact', 'approximate', 'range')),
  departure_time VARCHAR(40),                          -- "06:30", "mañana", "06:00-08:00"
  arrival_time VARCHAR(40),
  duration_minutes INTEGER CHECK (duration_minutes IS NULL OR duration_minutes >= 0),

  -- Costo (rango opcional, currency obligatoria si hay costo)
  cost_type VARCHAR(20) NOT NULL DEFAULT 'per_person'
    CHECK (cost_type IN ('per_person', 'per_vehicle', 'per_group', 'free')),
  cost_min NUMERIC(10, 2) CHECK (cost_min IS NULL OR cost_min >= 0),
  cost_max NUMERIC(10, 2) CHECK (cost_max IS NULL OR cost_max >= 0),
  currency VARCHAR(3) NOT NULL DEFAULT 'PEN'
    CHECK (currency IN ('PEN', 'USD')),

  -- Logística
  frequency VARCHAR(120),                              -- "cada hora", "06:00 y 14:00 diario"
  booking_location VARCHAR(200),                       -- "Terminal Plaza Norte"
  booking_url TEXT,

  -- Marcadores
  is_recommended BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Coherencia del rango de costo
  CONSTRAINT cost_range_valid CHECK (
    cost_min IS NULL OR cost_max IS NULL OR cost_max >= cost_min
  )
);

CREATE INDEX idx_transport_options_segment
  ON public.route_transport_options(segment_id);

CREATE INDEX idx_transport_options_mode
  ON public.route_transport_options(mode);

CREATE TRIGGER transport_options_updated_at
BEFORE UPDATE ON public.route_transport_options
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

COMMENT ON TABLE public.route_transport_options IS
  'Alternativa de transporte para un segmento. Un segmento puede tener varias opciones (bus o combi o taxi).';
COMMENT ON COLUMN public.route_transport_options.cost_type IS
  'Define a quién aplica el costo: por persona, por vehículo (taxi), por grupo, o gratis.';

-- =============================================================================
-- Función agregada: suggest_transport_alternatives
-- Recibe un from_label / to_label y devuelve opciones agregadas de TODAS las
-- rutas de la plataforma que documenten el mismo tramo (crowdsourcing).
-- Usa mediana de costos y duración, y permite excluir un segmento concreto
-- (para no devolver al propio creador como "alternativa").
-- =============================================================================
CREATE OR REPLACE FUNCTION public.suggest_transport_alternatives(
  p_from_label TEXT,
  p_to_label TEXT,
  p_exclude_segment_id UUID DEFAULT NULL
)
RETURNS TABLE (
  mode VARCHAR(20),
  operator VARCHAR(120),
  cost_min NUMERIC(10, 2),
  cost_max NUMERIC(10, 2),
  currency VARCHAR(3),
  duration_minutes INTEGER,
  sample_size BIGINT,
  source TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    o.mode,
    -- Operador más frecuente (mode statistical); null si no hay claro
    (
      SELECT operator
      FROM public.route_transport_options o2
      JOIN public.route_transport_segments s2 ON s2.id = o2.segment_id
      WHERE s2.from_normalized = lower(trim(public.immutable_unaccent(p_from_label)))
        AND s2.to_normalized   = lower(trim(public.immutable_unaccent(p_to_label)))
        AND o2.mode = o.mode
        AND o2.currency = o.currency
        AND o2.operator IS NOT NULL
        AND (p_exclude_segment_id IS NULL OR s2.id <> p_exclude_segment_id)
      GROUP BY operator
      ORDER BY COUNT(*) DESC
      LIMIT 1
    ) AS operator,
    percentile_cont(0.5) WITHIN GROUP (ORDER BY o.cost_min)::NUMERIC(10, 2) AS cost_min,
    percentile_cont(0.5) WITHIN GROUP (ORDER BY o.cost_max)::NUMERIC(10, 2) AS cost_max,
    o.currency,
    percentile_cont(0.5) WITHIN GROUP (ORDER BY o.duration_minutes)::INTEGER AS duration_minutes,
    COUNT(*) AS sample_size,
    'community'::TEXT AS source
  FROM public.route_transport_options o
  JOIN public.route_transport_segments s ON s.id = o.segment_id
  JOIN public.routes r ON r.id = s.route_id
  WHERE s.from_normalized = lower(trim(public.immutable_unaccent(p_from_label)))
    AND s.to_normalized   = lower(trim(public.immutable_unaccent(p_to_label)))
    AND r.status = 'published'
    AND r.visibility = 'public'
    AND (p_exclude_segment_id IS NULL OR s.id <> p_exclude_segment_id)
  GROUP BY o.mode, o.currency
  HAVING COUNT(*) >= 1
  ORDER BY sample_size DESC, o.mode;
$$;

REVOKE ALL ON FUNCTION public.suggest_transport_alternatives(TEXT, TEXT, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.suggest_transport_alternatives(TEXT, TEXT, UUID) TO anon, authenticated;

COMMENT ON FUNCTION public.suggest_transport_alternatives IS
  'Devuelve alternativas de transporte agregadas (mediana de costo/duración) que otros creadores hayan documentado para el mismo tramo from→to. Sólo considera opciones de rutas publicadas y públicas.';

-- =============================================================================
-- RLS
-- =============================================================================
ALTER TABLE public.route_transport_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.route_transport_options ENABLE ROW LEVEL SECURITY;

-- Segmentos: lectura para rutas publicadas/públicas, o si soy el creador
CREATE POLICY "Transport segments are readable for visible routes"
ON public.route_transport_segments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.routes r
    WHERE r.id = route_id
      AND (
        (r.status = 'published' AND r.visibility = 'public')
        OR r.creator_id = auth.uid()
      )
  )
);

-- Segmentos: insert/update/delete sólo el creador de la ruta
CREATE POLICY "Route creators can insert transport segments"
ON public.route_transport_segments FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.routes r
    WHERE r.id = route_id AND r.creator_id = auth.uid()
  )
);

CREATE POLICY "Route creators can update transport segments"
ON public.route_transport_segments FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.routes r
    WHERE r.id = route_id AND r.creator_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.routes r
    WHERE r.id = route_id AND r.creator_id = auth.uid()
  )
);

CREATE POLICY "Route creators can delete transport segments"
ON public.route_transport_segments FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.routes r
    WHERE r.id = route_id AND r.creator_id = auth.uid()
  )
);

-- Opciones: lectura igual que segmentos
CREATE POLICY "Transport options are readable for visible segments"
ON public.route_transport_options FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.route_transport_segments s
    JOIN public.routes r ON r.id = s.route_id
    WHERE s.id = segment_id
      AND (
        (r.status = 'published' AND r.visibility = 'public')
        OR r.creator_id = auth.uid()
      )
  )
);

CREATE POLICY "Route creators can insert transport options"
ON public.route_transport_options FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.route_transport_segments s
    JOIN public.routes r ON r.id = s.route_id
    WHERE s.id = segment_id AND r.creator_id = auth.uid()
  )
);

CREATE POLICY "Route creators can update transport options"
ON public.route_transport_options FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.route_transport_segments s
    JOIN public.routes r ON r.id = s.route_id
    WHERE s.id = segment_id AND r.creator_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.route_transport_segments s
    JOIN public.routes r ON r.id = s.route_id
    WHERE s.id = segment_id AND r.creator_id = auth.uid()
  )
);

CREATE POLICY "Route creators can delete transport options"
ON public.route_transport_options FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM public.route_transport_segments s
    JOIN public.routes r ON r.id = s.route_id
    WHERE s.id = segment_id AND r.creator_id = auth.uid()
  )
);
