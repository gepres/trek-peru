# Feature: "¿Cómo llegar?" — Editor manual de tramos de transporte

> **Estado:** ✅ Fase 1 implementada — pendiente de aplicar migración SQL en Supabase
> **Owner:** GEPRES Team
> **Fase MVP:** Manual-First + crowdsourced (Fase 1 de 3 completada)
> **Ubicación UI:** Nuevo tab en `app/[locale]/routes/[id]/page.tsx`

---

## 1. Contexto

Plataformas de referencia como [7lagunasdeausangate.netlify.app](https://7lagunasdeausangate.netlify.app/) y [guileless-chebakia-ab0b76.netlify.app](https://guileless-chebakia-ab0b76.netlify.app/) muestran el flujo "cómo llegar" como **texto plano estático**. Funciona, pero no es escaneable ni reutilizable.

TrekPeru convertirá esa información en **datos estructurados tipo "boleto de avión"** con dos flujos complementarios:

### 1.1 Flujo manual (creador)
El creador define paso a paso los tramos A → B → C: cada uno con hora de salida, hora de llegada, duración, costo (rango), tipo de transporte, operador, etc. **Es la fuente confiable.**

### 1.2 Flujo dinámico (lector / visitante)
Cuando otro usuario ve la ruta, sobre cada tramo definido por el creador se ofrecen **sugerencias automáticas de alternativas** ("También puedes ir en combi", "Hay un vuelo Lima → Cusco más barato a esta hora", etc.). Las sugerencias vienen de:

1. **Corpus propio (crowdsourced):** otros tramos `from → to` que cualquier otro creador haya definido en la plataforma — agrupados y promediados.
2. **Asistente IA (Fase 2):** Claude/GPT propone alternativas conocidas cuando el corpus está vacío.
3. **Rome2Rio (Fase 3):** sólo para tramos interurbanos grandes con cobertura.

El creador NO tiene que escribir todas las alternativas: él pone su recomendado y el sistema enriquece dinámicamente.

### Por qué manual (no API)

Investigación realizada (mayo 2026):

| Opción | Veredicto |
|---|---|
| **Rome2Rio API** | ⚠️ Partner-only, sin precios en vivo (deriva a Skyscanner), cobertura limitada en Perú rural |
| **Google Routes API** | ❌ Solo transit con GTFS, casi inexistente en Perú fuera de Lima |
| **Mapbox Directions** | ❌ Sin perfil transit/multimodal (driving/walking/cycling solamente) |
| **OpenTripPlanner self-hosted** | ❌ Requiere GTFS que no existe; sobreingeniería para MVP |
| **APIs de operadores** (Cruz del Sur, Civa, LATAM) | ❌ Sin APIs públicas abiertas |

Conclusión: **los datos confiables están en la cabeza de los locales**, no en APIs. El creador de la ruta es la mejor fuente. Las APIs vienen en Fase 2/3 como **asistente**, no como fuente primaria.

---

## 2. Roadmap por fases

### ✅ Fase 1 — Manual + Crowdsourced (este documento)
- Editor estructurado para el creador (manual).
- Visualización tipo timeline para el lector.
- **Sugerencias dinámicas desde el corpus propio:** cuando un lector ve un tramo `Cusco → Tinki`, el sistema busca en `route_transport_options` de TODAS las rutas otros tramos con `from`/`to` normalizados que coincidan y muestra alternativas agregadas (sin operador, mediana de precio, modo más común). Sin dependencias externas.

### 🔜 Fase 2 — Asistente IA en runtime
Cuando el corpus tiene <2 alternativas para un tramo, llamar a Claude/GPT con prompt:
> "Tramo Cusco → Tinki en transporte público en Perú. Devuelve 1-3 alternativas realistas (modo, operador típico, duración, costo aproximado en PEN). Marca claramente lo que sea estimación."

Cachear la respuesta por hash `normalize(from)+normalize(to)` por 30 días en una tabla `transport_ai_cache` para no pagar el mismo prompt dos veces.

### ✅ Fase 3 — Mapbox enriquecimiento + Rome2Rio stub
- **Mapbox Geocoding** ([`lib/mapbox/geocoding.ts`](../../lib/mapbox/geocoding.ts)): autocompletar `from_label`/`to_label` con sugerencias geocodificadas + coordenadas. Mejora calidad del corpus para sugerencias crowdsourced y habilita el tramo final.
- **Mapbox Directions** ([`lib/mapbox/directions.ts`](../../lib/mapbox/directions.ts)): auto-cálculo del último tramo `driving`/`walking` desde el `to_coordinates` del último segmento hasta `routes.meeting_point`. Render como bloque azul "Tramo final automático · Mapbox".
- **Rome2Rio:** stub creado en [`infrastructure/external/rome2rio.client.ts`](../../infrastructure/external/rome2rio.client.ts). **Activación pendiente** de aprobación al [Rome2Rio Partner Program](https://www.rome2rio.com/business) (no es self-service). Cuando se tenga la key, reemplazar el stub e integrar en `useTransportAlternatives` con `source='rome2rio'`.

---

## 3. Modelo de datos

### 3.1 Tabla `route_transport_segments` (nueva)

```sql
CREATE TABLE route_transport_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id UUID NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL,                     -- orden del paso (1, 2, 3...)
  title TEXT,                                       -- opcional, "De Cusco a Tinki"
  from_label TEXT NOT NULL,                         -- "Cusco"
  from_coordinates GEOGRAPHY(POINT, 4326),          -- opcional, para futuro mapa
  to_label TEXT NOT NULL,                           -- "Tinki"
  to_coordinates GEOGRAPHY(POINT, 4326),
  notes TEXT,                                       -- consejos generales del paso
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_route_order UNIQUE (route_id, order_index)
);

CREATE INDEX idx_segments_route ON route_transport_segments(route_id);
```

### 3.2 Tabla `route_transport_options` (alternativas por segmento)

```sql
CREATE TYPE transport_mode AS ENUM (
  'bus', 'plane', 'taxi', 'combi', 'colectivo',
  'train', 'motorcycle', 'boat', 'car', 'walk', 'bike', 'other'
);

CREATE TYPE cost_type AS ENUM ('per_person', 'per_vehicle', 'per_group', 'free');
CREATE TYPE time_mode AS ENUM ('exact', 'approximate', 'range');

CREATE TABLE route_transport_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  segment_id UUID NOT NULL REFERENCES route_transport_segments(id) ON DELETE CASCADE,

  -- Tipo y proveedor
  mode transport_mode NOT NULL,
  operator TEXT,                                    -- "Cruz del Sur", "LATAM", "combi local"
  class TEXT,                                       -- "cama", "semicama", "económico"

  -- Tiempos
  time_mode time_mode NOT NULL DEFAULT 'approximate',
  departure_time TEXT,                              -- "06:30" o "mañana" o "06:00-08:00"
  arrival_time TEXT,
  duration_minutes INTEGER,                         -- duración estimada

  -- Costo
  cost_type cost_type NOT NULL DEFAULT 'per_person',
  cost_min NUMERIC(10,2),
  cost_max NUMERIC(10,2),                           -- igual a cost_min si es precio único
  currency TEXT NOT NULL DEFAULT 'PEN',             -- 'PEN' | 'USD'

  -- Logística
  frequency TEXT,                                   -- "cada hora", "06:00 y 14:00 diario"
  booking_location TEXT,                            -- "Terminal Plaza Norte", "Av. Tomasa Tito"
  booking_url TEXT,                                 -- link directo a reserva si existe

  -- Marcadores
  is_recommended BOOLEAN DEFAULT FALSE,             -- el "preferido" del creador
  notes TEXT,                                       -- "Llevar DNI", "regatear el precio"

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_options_segment ON route_transport_options(segment_id);
```

### 3.3 Normalización para el flujo dinámico

Para que el corpus de sugerencias funcione bien, los campos `from_label` / `to_label` necesitan **una versión normalizada** generada automáticamente:

```sql
-- Columnas generadas con normalización (lowercase, sin acentos, sin espacios extra)
ALTER TABLE route_transport_segments
  ADD COLUMN from_normalized TEXT GENERATED ALWAYS AS (
    lower(trim(unaccent(from_label)))
  ) STORED,
  ADD COLUMN to_normalized TEXT GENERATED ALWAYS AS (
    lower(trim(unaccent(to_label)))
  ) STORED;

CREATE INDEX idx_segments_from_to_norm
  ON route_transport_segments(from_normalized, to_normalized);
```

Esto permite que `Cusco → Tinki`, `cusco → tinki`, `Cusco  → Tinki` (espacios) agrupen igual.

### 3.4 Cache de sugerencias IA (Fase 2)

```sql
CREATE TABLE transport_ai_cache (
  cache_key TEXT PRIMARY KEY,                       -- hash sha256("cusco→tinki")
  from_normalized TEXT NOT NULL,
  to_normalized TEXT NOT NULL,
  suggestions JSONB NOT NULL,                       -- array de opciones generadas
  model TEXT NOT NULL,                              -- "claude-haiku-4-5" etc.
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL                   -- now() + 30 days
);
```

### 3.5 RLS

```sql
ALTER TABLE route_transport_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_transport_options ENABLE ROW LEVEL SECURITY;

-- Lectura pública si la ruta es pública
CREATE POLICY "segments_public_read" ON route_transport_segments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM routes
      WHERE routes.id = route_id
        AND routes.status = 'published'
        AND routes.visibility = 'public'
    )
  );

-- Escritura solo creador de la ruta
CREATE POLICY "segments_creator_write" ON route_transport_segments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM routes
      WHERE routes.id = route_id
        AND routes.creator_id = auth.uid()
    )
  );

-- (Políticas equivalentes para route_transport_options)
```

---

## 4. Arquitectura (Clean Architecture Lite)

Sigue el patrón ya establecido del proyecto:

```
domain/transport/
  transport.repository.interface.ts    # ITransportRepository

infrastructure/supabase/
  transport.repository.ts              # createTransportRepository(supabase)

application/transport/
  get-segments.usecase.ts              # listar tramos de una ruta (con opciones del creador)
  create-segment.usecase.ts
  update-segment.usecase.ts
  delete-segment.usecase.ts
  reorder-segments.usecase.ts          # cambiar order_index
  add-option.usecase.ts                # añadir alternativa
  update-option.usecase.ts
  delete-option.usecase.ts
  suggest-alternatives.usecase.ts      # ⭐ FLUJO DINÁMICO: alternativas crowdsourced + IA
  index.ts

presentation/hooks/
  useTransportSegments.ts              # lectura
  useTransportEditor.ts                # mutaciones (creador)

types/
  transport.types.ts                   # TransportSegment, TransportOption, etc.

components/routes/transport/
  HowToGetThere.tsx                    # tab público (read-only timeline)
  TransportSegmentCard.tsx             # card por paso
  TransportOptionBadge.tsx             # mini-card por alternativa
  TransportEditor.tsx                  # editor (solo creador)
  TransportSegmentForm.tsx
  TransportOptionForm.tsx

lib/validations/
  transport.schema.ts                  # Zod schemas
```

### 4.1 Tipos TypeScript

```typescript
// types/transport.types.ts
export type TransportMode =
  | 'bus' | 'plane' | 'taxi' | 'combi' | 'colectivo'
  | 'train' | 'motorcycle' | 'boat' | 'car' | 'walk' | 'bike' | 'other';

export type CostType = 'per_person' | 'per_vehicle' | 'per_group' | 'free';
export type TimeMode = 'exact' | 'approximate' | 'range';

export interface TransportOption {
  id: string;
  segment_id: string;
  mode: TransportMode;
  operator?: string;
  class?: string;
  time_mode: TimeMode;
  departure_time?: string;
  arrival_time?: string;
  duration_minutes?: number;
  cost_type: CostType;
  cost_min?: number;
  cost_max?: number;
  currency: 'PEN' | 'USD';
  frequency?: string;
  booking_location?: string;
  booking_url?: string;
  is_recommended: boolean;
  notes?: string;
}

export interface TransportSegment {
  id: string;
  route_id: string;
  order_index: number;
  title?: string;
  from_label: string;
  from_coordinates?: { lat: number; lng: number };
  to_label: string;
  to_coordinates?: { lat: number; lng: number };
  notes?: string;
  options: TransportOption[];   // 1..N alternativas
}
```

### 4.2 Contrato del repositorio

```typescript
// domain/transport/transport.repository.interface.ts
export interface ITransportRepository {
  findByRouteId(routeId: string): Promise<TransportSegment[]>;

  createSegment(routeId: string, data: SegmentForm): Promise<TransportSegment>;
  updateSegment(id: string, data: Partial<SegmentForm>): Promise<TransportSegment>;
  deleteSegment(id: string): Promise<void>;
  reorderSegments(routeId: string, orderedIds: string[]): Promise<void>;

  addOption(segmentId: string, data: OptionForm): Promise<TransportOption>;
  updateOption(id: string, data: Partial<OptionForm>): Promise<TransportOption>;
  deleteOption(id: string): Promise<void>;

  // FLUJO DINÁMICO — sugerencias crowdsourced
  findAlternativesForLeg(
    fromLabel: string,
    toLabel: string,
    excludeSegmentId?: string,
  ): Promise<AggregatedAlternative[]>;
}

// types/transport.types.ts (adicional)
export interface AggregatedAlternative {
  mode: TransportMode;
  operator?: string;                  // null si hay múltiples operadores agregados
  cost_min?: number;                  // mediana del corpus
  cost_max?: number;
  currency: 'PEN' | 'USD';
  duration_minutes?: number;          // mediana
  sample_size: number;                // cuántas rutas del corpus aportan esta opción
  source: 'community' | 'ai' | 'rome2rio';
}
```

### 4.3 Use-case `suggest-alternatives`

```typescript
// application/transport/suggest-alternatives.usecase.ts
export async function suggestAlternatives(
  transportRepo: ITransportRepository,
  segment: TransportSegment,
): Promise<AggregatedAlternative[]> {
  // 1. Buscar tramos similares en otras rutas (crowdsourced)
  const community = await transportRepo.findAlternativesForLeg(
    segment.from_label,
    segment.to_label,
    segment.id,
  );

  // Filtrar modos ya cubiertos por el creador (no duplicar)
  const creatorModes = new Set(segment.options.map(o => o.mode));
  const filtered = community.filter(alt => !creatorModes.has(alt.mode));

  // 2. (Fase 2) Si hay <2 alternativas, llamar IA
  // 3. (Fase 3) Si tramo es interurbano grande, complementar con Rome2Rio

  return filtered;
}
```

La agregación SQL en el repositorio:

```sql
-- findAlternativesForLeg: agrupa opciones de TODAS las rutas por modo
SELECT
  o.mode,
  -- operador "mayoritario", null si no hay claro ganador
  mode() WITHIN GROUP (ORDER BY o.operator) AS operator,
  percentile_cont(0.5) WITHIN GROUP (ORDER BY o.cost_min) AS cost_min,
  percentile_cont(0.5) WITHIN GROUP (ORDER BY o.cost_max) AS cost_max,
  o.currency,
  percentile_cont(0.5) WITHIN GROUP (ORDER BY o.duration_minutes) AS duration_minutes,
  COUNT(*) AS sample_size,
  'community' AS source
FROM route_transport_options o
JOIN route_transport_segments s ON s.id = o.segment_id
WHERE s.from_normalized = lower(trim(unaccent($1)))
  AND s.to_normalized   = lower(trim(unaccent($2)))
  AND s.id <> COALESCE($3, '00000000-0000-0000-0000-000000000000'::uuid)
GROUP BY o.mode, o.currency
HAVING COUNT(*) >= 1;
```

---

## 5. UX / Componentes

### 5.1 Vista pública (read-only) — combina manual + dinámico

Nuevo tab `tabs.howToGetThere` en `RouteDetailPage`, después de `tabs.itinerary`.

Por cada segmento se muestran:
- **Bloque "Sugerido por el organizador"** — lo que el creador definió (manual).
- **Bloque "Otras alternativas"** (colapsado por defecto) — sugerencias del corpus / IA. Cada item lleva un badge que indica su fuente (`👥 comunidad · 3 rutas`, `🤖 estimación IA`, `🔗 Rome2Rio`).

```
┌──────────────────────────────────────────────────┐
│ 🗺️  ¿Cómo llegar?                               │
├──────────────────────────────────────────────────┤
│                                                  │
│ ① De Cusco a Tinki                               │
│                                                  │
│   Sugerido por el organizador                    │
│ ┌──────────────────────────────────────────────┐ │
│ │ 🚌 Bus  Cruz del Sur          ★ Recomendado  │ │
│ │ 06:30 ──── 3h ────► 09:30                    │ │
│ │ S/ 25 por persona · Cada hora                │ │
│ │ 📍 Terminal Tomasa Tito Condemayta           │ │
│ │ 🔗 Reservar →                                │ │
│ └──────────────────────────────────────────────┘ │
│                                                  │
│   ▼ Otras alternativas (3)                       │
│ ┌──────────────────────────────────────────────┐ │
│ │ 🚐 Colectivo       👥 comunidad · 5 rutas    │ │
│ │ ~2h 30m · S/ 15-20 por persona               │ │
│ └──────────────────────────────────────────────┘ │
│ ┌──────────────────────────────────────────────┐ │
│ │ 🚕 Taxi privado    👥 comunidad · 2 rutas    │ │
│ │ ~2h · S/ 180-220 por vehículo                │ │
│ └──────────────────────────────────────────────┘ │
│ ┌──────────────────────────────────────────────┐ │
│ │ ✈️ Vuelo Lima→Juliaca + bus  🤖 IA estimado  │ │
│ │ ~5h · USD 80-120 + S/ 40                     │ │
│ └──────────────────────────────────────────────┘ │
│                                                  │
│ ② De Tinki a Pacchanta                           │
│   ...                                            │
└──────────────────────────────────────────────────┘
```

Comportamiento dinámico:
- El bloque "Otras alternativas" se hidrata client-side con un `useSWR`/`useQuery` que llama al use-case `suggestAlternatives` por segmento.
- Skeleton mientras carga.
- Si no hay alternativas → no se muestra el bloque (sin estado vacío ruidoso).
- Cache HTTP + revalidación cada 24h por segmento.

### 5.2 Editor (solo creador)

Patrón similar a `DailyItinerary.tsx` (acordeón por paso) + sub-acordeón por alternativa.

Acciones:
- ➕ Agregar paso
- ➕ Agregar alternativa al paso
- ⬆⬇ Reordenar pasos (drag o botones)
- 🗑️ Eliminar

### 5.3 Iconografía por modo

`lucide-react`: Bus → `Bus`, Plane → `Plane`, Car → `Car`, Taxi → `CarTaxiFront`, Train → `TrainFront`, Walk → `Footprints`, Bike → `Bike`, Boat → `Ship`, Motorcycle → `Bike` (no hay icono específico, usar emoji 🛵).

---

## 6. i18n

Agregar a `messages/es.json` y `messages/en.json` bajo `routeDetail.howToGetThere.*`:

```json
{
  "howToGetThere": {
    "title": "¿Cómo llegar?",
    "tab": "Cómo llegar",
    "empty": "El organizador aún no ha publicado la guía de transporte",
    "step": "Paso",
    "recommended": "Recomendado",
    "perPerson": "por persona",
    "perVehicle": "por vehículo",
    "perGroup": "por grupo",
    "free": "Gratis",
    "frequency": "Frecuencia",
    "bookingLocation": "Comprar en",
    "modes": {
      "bus": "Bus",
      "plane": "Avión",
      "taxi": "Taxi",
      "combi": "Combi",
      "colectivo": "Colectivo",
      "train": "Tren",
      "motorcycle": "Moto",
      "boat": "Bote",
      "car": "Auto",
      "walk": "A pie",
      "bike": "Bicicleta",
      "other": "Otro"
    }
  }
}
```

---

## 7. SEO

`components/seo/TransportJsonLd.tsx` es un **server component** que carga los segmentos vía Supabase y emite un `@graph` con un nodo por cada opción de transporte. Cada opción usa el tipo Schema.org más específico disponible:

| Modo | Schema.org type | Endpoints |
|---|---|---|
| `bus`, `combi`, `colectivo` | `BusTrip` | `departureBusStop` / `arrivalBusStop` (BusStation) |
| `plane` | `Flight` | `departureAirport` / `arrivalAirport` (Airport), `airline` |
| `train` | `TrainTrip` | `departureStation` / `arrivalStation` (TrainStation) |
| `boat` | `BoatTrip` | `departureBoatTerminal` / `arrivalBoatTerminal` (BoatTerminal) |
| `taxi`, `car`, `motorcycle`, `walk`, `bike`, `other` | `Trip` (genérico) | `itinerary` con dos `Place` |

Cada nodo lleva:
- `partOfTrip` apuntando al `@id` del `TouristTrip` principal (emitido por `RouteJsonLd`).
- `provider` (Organization) o `airline` (Airline) cuando hay operador.
- `departureTime` / `arrivalTime` en ISO 8601 cuando la opción tiene `time_mode = exact` formato `HH:MM` y la ruta tiene `departure_date`.
- `offers` como `Offer` (precio único) o `AggregateOffer` (`lowPrice` / `highPrice` cuando hay rango).
- `disambiguatingDescription` con las notas del creador y `url` con `booking_url` si existe.

Este enriquecimiento permite que Google reconozca cada tramo como un trayecto real, mejorando la elegibilidad para rich results de viaje y la citación en AI Overviews. La carga server-side garantiza que el JSON-LD esté en el HTML inicial (los crawlers no esperan a JavaScript).

---

## 8. Plan de implementación

| Sprint | Tarea | Archivos | Estado |
|---|---|---|---|
| 1 | Migración SQL (tablas + normalización + RLS + función agregada) | `supabase/migrations/017_transport_segments.sql` | ✅ |
| 1 | Tipos | `types/transport.types.ts` | ✅ |
| 1 | Dominio (interface) | `domain/transport/transport.repository.interface.ts` | ✅ |
| 1 | Infrastructure (Supabase repo) | `infrastructure/supabase/transport.repository.ts` | ✅ |
| 1 | Use-cases CRUD + suggest-alternatives | `application/transport/*` | ✅ |
| 1 | Validaciones Zod | `lib/validations/transport.schema.ts` | ✅ |
| 1 | Hooks de presentation | `presentation/hooks/useTransport{Segments,Editor,Alternatives}.ts` | ✅ |
| 1 | Editor manual (creador) con reordenar por botones ↑↓ | `components/routes/transport/TransportEditor.tsx` + forms | ✅ |
| 1 | Vista pública con flujo dinámico de alternativas crowdsourced | `components/routes/transport/HowToGetThere.tsx`, `TransportSegmentCard.tsx`, `AlternativesPanel.tsx`, `AlternativeBadgeCard.tsx` | ✅ |
| 1 | Wrapper que alterna vista/editor según rol | `components/routes/transport/HowToGetThereTab.tsx` | ✅ |
| 1 | Tab "Cómo llegar" en la página de detalle | `app/[locale]/routes/[id]/page.tsx` | ✅ |
| 1 | i18n completo (ES/EN) | `messages/es.json`, `messages/en.json` | ✅ |
| 2 | Drag-and-drop con `@dnd-kit/sortable` (KeyboardSensor + PointerSensor) | `components/routes/transport/TransportEditor.tsx` | ✅ |
| 2 | JSON-LD enriquecido (BusTrip, Flight, TrainTrip, BoatTrip, Trip + AggregateOffer) | `components/seo/TransportJsonLd.tsx` + integración en `app/[locale]/routes/[id]/page.tsx` | ✅ |
| 2 | Asistente IA en runtime + cache 30d | `supabase/migrations/018_transport_ai_cache.sql`, `app/api/transport/ai-suggest/route.ts`, integración en `useTransportAlternatives` | ✅ |
| 3 | Mapbox Geocoding (autocomplete `from`/`to` con coordenadas) | `lib/mapbox/geocoding.ts`, `components/routes/transport/LocationAutocomplete.tsx`, integración en `TransportSegmentForm` | ✅ |
| 3 | Mapbox tramo final (auto driving/walking hasta `meeting_point`) | `lib/mapbox/directions.ts`, `presentation/hooks/useFinalLegDirection.ts`, `components/routes/transport/FinalLegSuggestion.tsx`, integración en `HowToGetThere` | ✅ |
| 3 (stub) | Rome2Rio cliente — pendiente partnership | `infrastructure/external/rome2rio.client.ts` | 📝 |
| 4 | Mini-mapa del tramo final con `mapbox-gl` (polyline + markers + fit bounds) | `components/routes/transport/FinalLegMap.tsx`, geometry en `useFinalLegDirection` | ✅ |
| 4 | Cron semanal `cleanup_expired_ai_cache()` con `pg_cron` (domingo 03:00 UTC) | `supabase/migrations/019_schedule_ai_cache_cleanup.sql` | ✅ |
| 4 | Geocoding inverso (`geocodeReverse`) | `lib/mapbox/geocoding.ts` | ✅ |
| 4 (manual) | Aplicar al [Rome2Rio Partner Program](https://www.rome2rio.com/business) | acción humana — pendiente | ⏳ |

### Aplicar migración Fase 2

```bash
# desde el repo:
supabase db push   # aplica 018_transport_ai_cache.sql + 019_schedule_ai_cache_cleanup.sql
```

O pegar los SQL en el SQL Editor.

> **Nota sobre `pg_cron`:** en proyectos Supabase nuevos viene preinstalado. En planos antiguos hay que habilitarlo desde Dashboard → Database → Extensions → `pg_cron` antes de aplicar la migración 019.

### Variables de entorno opcionales (asistente IA)

```env
ANTHROPIC_API_KEY=sk-ant-...          # sin esto, el flujo IA se omite gracilmente
SUPABASE_SERVICE_ROLE_KEY=eyJ...      # requerido para escribir cache; sin esto, cada llamada paga al LLM
```

### Comportamiento del flujo IA

1. El hook `useTransportAlternatives` consulta el corpus crowdsourced vía RPC.
2. Si el corpus tiene **menos de 2** alternativas, llama a `POST /api/transport/ai-suggest`.
3. El endpoint busca primero en `transport_ai_cache` (clave SHA-256 de `from_norm + '→' + to_norm`). Si hit válido → respuesta inmediata.
4. Si miss, llama a Claude Haiku (`claude-haiku-4-5-20251001`) con prompt curado que pide JSON estricto (1-4 alternativas realistas), sanitiza la respuesta y la persiste con TTL 30 días.
5. El hook dedupea por `mode + currency` (creador > comunidad > IA) y mergea sin duplicar modos.
6. La UI muestra cada sugerencia con su badge de fuente (`👥 comunidad`, `🤖 IA estimado`).

### Aplicar la migración

Antes de probar en local/producción, aplicar `supabase/migrations/017_transport_segments.sql`:
- **Supabase CLI:** `supabase db push`
- **Dashboard:** copiar/pegar el SQL en SQL Editor y ejecutar.

Requiere la extensión `unaccent` (la migración la crea si no existe).

---

## 9. Decisiones explícitas (mayo 2026)

- ✅ **Editor manual** del creador (paso A → B → C con precio, horarios, modo, operador).
- ✅ **Flujo dinámico** sólo del lado del lector — sugerencias automáticas de alternativas sobre los tramos que el creador definió. **El creador NO ve ni edita las sugerencias.**
- ✅ **Solo creador** edita (mismas reglas RLS que el resto de la ruta).
- ✅ **Costo en rango** (`cost_min` / `cost_max`) + `cost_type` (per_person / per_vehicle / per_group).
- ✅ **Alternativas manuales anidadas** (1 segmento → N opciones que el creador escribe).
- ✅ **Alternativas dinámicas agregadas** desde el corpus de TODA la plataforma (otros tramos `from → to` que otros creadores ya escribieron). Sin duplicar modos ya cubiertos manualmente.
- ✅ **Tiempos flexibles** (`exact` / `approximate` / `range`) — la realidad de combis peruanas no encaja con horarios exactos.
- ✅ **Cada sugerencia dinámica indica su fuente** (`👥 comunidad`, `🤖 IA`, `🔗 Rome2Rio`) para que el usuario entienda confiabilidad.

---

## 10. Referencias externas usadas

- [Rome2Rio Documentation](https://www.rome2rio.com/documentation/1-4/search/)
- [Google Routes API](https://developers.google.com/maps/documentation/routes)
- [Mapbox Directions](https://docs.mapbox.com/api/navigation/directions/)
- [OpenTripPlanner](https://docs.opentripplanner.org/)
- Referencia visual 1: [Laguna de Quillca](https://guileless-chebakia-ab0b76.netlify.app/)
- Referencia visual 2: [7 Lagunas de Ausangate](https://7lagunasdeausangate.netlify.app/)
