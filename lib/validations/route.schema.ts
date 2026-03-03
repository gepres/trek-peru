import { z } from 'zod';

// Schema para punto de encuentro
export const meetingPointSchema = z.object({
  name: z.string().trim().min(1, 'El nombre del punto de encuentro es requerido'),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  instructions: z.string().trim().optional(),
});

// Schema para waypoints
export const waypointSchema = z.object({
  name: z.string().trim().min(1, 'El nombre del waypoint es requerido'),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  description: z.string().trim().optional(),
});

// Schema para itinerario diario
export const dailyItinerarySchema = z.object({
  day: z.number().int().positive(),
  title: z.string().trim().min(1, 'El título del día es requerido'),
  description: z.string().trim().optional(),
});

// Helper: convierte NaN/vacío/null a undefined para campos numéricos opcionales.
// Es necesario porque <input type="number"> registrado con { valueAsNumber: true }
// devuelve NaN cuando está vacío, y z.number() fallaría con el mensaje en inglés
// "Expected number, received nan" antes de llegar a los mensajes personalizados.
const nanToUndefined = (val: unknown): unknown =>
  val === '' ||
  val === null ||
  val === undefined ||
  (typeof val === 'number' && isNaN(val))
    ? undefined
    : val;

// Envuelve un ZodNumber en un preprocess que limpia NaN → undefined
const optionalNum = (inner: z.ZodNumber) =>
  z.preprocess(nanToUndefined, inner.optional());

// Helper: para campos de URL opcionales — hace trim y convierte string vacío
// o solo espacios a undefined, evitando el error "Expected string, received..."
// y permitiendo que .url() valide solo cuando hay contenido real.
const trimUrl = (val: unknown): unknown => {
  if (typeof val !== 'string') return val;
  const trimmed = val.trim();
  return trimmed === '' ? undefined : trimmed;
};

// Schema principal para crear/editar rutas
export const routeFormSchema = z.object({
  // 1. Información básica (REQUERIDOS)
  // .trim() elimina espacios al inicio/fin antes de validar longitud
  title: z.string()
    .trim()
    .min(5, 'El título debe tener al menos 5 caracteres')
    .max(200, 'El título no puede exceder 200 caracteres'),
  description: z.string()
    .trim()
    .min(20, 'La descripción debe tener al menos 20 caracteres')
    .max(2000, 'La descripción no puede exceder 2000 caracteres'),
  difficulty: z.enum(['easy', 'moderate', 'hard', 'extreme'], {
    required_error: 'La dificultad es requerida',
  }),
  region: z.string({
    required_error: 'La región es requerida',
  })
    .min(1, 'La región es requerida')
    .max(100),

  // Duración (REQUERIDO) — preprocess convierte NaN a undefined para mostrar
  // el mensaje en español en lugar del default "Expected number, received nan"
  duration_type: z.enum(['hours', 'days'], {
    required_error: 'El tipo de duración es requerido',
  }),
  duration_value: z.preprocess(
    nanToUndefined,
    z.number({
      required_error: 'La duración es requerida',
      invalid_type_error: 'Ingresa un número válido para la duración',
    })
      .positive('La duración debe ser un número positivo')
      .min(1, 'La duración mínima es 1'),
  ),

  // Itinerario diario (solo si duration_type es 'days')
  daily_itinerary: z.array(dailyItinerarySchema).optional(),

  // 2. Logística y Capacidad
  departure_date: z.string().optional(),
  meeting_time: z.string().optional(),
  max_capacity: optionalNum(
    z.number().int().positive('La capacidad máxima debe ser un número entero positivo'),
  ),
  cost: optionalNum(
    z.number().nonnegative('El costo no puede ser negativo'),
  ),
  currency: z.string().length(3).default('PEN'),

  // 3. Publicación
  status: z.enum(['draft', 'published', 'cancelled', 'completed']).default('draft'),
  visibility: z.enum(['public', 'private', 'link']).default('public'),

  // 4. Detalles Técnicos (OPCIONALES)
  distance: optionalNum(
    z.number().positive('La distancia debe ser positiva'),
  ),
  elevation_gain: optionalNum(
    z.number().nonnegative('El desnivel positivo debe ser mayor o igual a 0'),
  ),
  elevation_loss: optionalNum(
    z.number().nonnegative('El desnivel negativo debe ser mayor o igual a 0'),
  ),
  min_altitude: optionalNum(z.number()),
  max_altitude: optionalNum(z.number()),
  terrain_type: z.array(z.string()).optional(),
  // Trim en campos de texto opcionales escritos por el usuario
  province: z.string().trim().max(100).optional(),

  // Equipo esencial
  essential_equipment: z.array(z.string()).optional(),

  // Link de Google Maps — trim + vacío/whitespace → undefined antes de validar la URL
  google_maps_link: z.preprocess(
    trimUrl,
    z.string().url('Debe ser un link válido').optional(),
  ),

  // Información adicional
  best_season: z.array(z.string()).optional(),
  expected_weather: z.string().trim().max(50).optional(),
  water_available: z.boolean().default(false),
  shelters: z.boolean().default(false),
  mobile_signal: z.boolean().default(false),
  emergency_contact: z.string().trim().max(100).optional(),
  risks: z.array(z.string()).optional(),

  // 5. Mapa de la Ruta
  meeting_point: meetingPointSchema.optional(),
  route_coordinates: z.any().optional(), // GeoJSON
  waypoints: z.array(waypointSchema).optional(),

  // 6. Imágenes
  // featured_image y gpx_file vienen de uploads, no de texto manual → sin trim
  featured_image: z.string().url().optional().or(z.literal('')),
  images: z.array(z.string()).optional(),
  gpx_file: z.string().optional(),
  // video_url sí es escrito por el usuario → trim + vacío/whitespace → undefined
  video_url: z.preprocess(
    trimUrl,
    z.string().url('Debe ser una URL de video válida').optional(),
  ),

  // Campos legacy (mantener compatibilidad)
  estimated_duration: optionalNum(z.number().positive()),
  includes: z.array(z.string()).optional(),
  not_includes: z.array(z.string()).optional(),
  requirements: z.array(z.string()).optional(),
  required_equipment: z.array(z.string()).optional(),
  optional_equipment: z.array(z.string()).optional(),
  technical_level: z.string().trim().max(50).optional(),
  min_capacity: z.number().int().positive().default(1),
}).refine(
  (data) => !data.max_capacity || !data.min_capacity || data.max_capacity >= data.min_capacity,
  {
    message: 'La capacidad máxima debe ser mayor o igual a la capacidad mínima',
    path: ['max_capacity'],
  },
).refine(
  (data) => !data.max_altitude || !data.min_altitude || data.max_altitude >= data.min_altitude,
  {
    message: 'La altitud máxima debe ser mayor o igual a la altitud mínima',
    path: ['max_altitude'],
  },
).refine(
  (data) => {
    // Si duration_type es 'days' y duration_value > 1, debería tener itinerario
    if (data.duration_type === 'days' && data.duration_value > 1) {
      return data.daily_itinerary && data.daily_itinerary.length === data.duration_value;
    }
    return true;
  },
  {
    message: 'Debes completar el itinerario para cada día del trekking',
    path: ['daily_itinerary'],
  },
);

// Schema para filtros de rutas
export const routeFiltersSchema = z.object({
  difficulty: z.enum(['easy', 'moderate', 'hard', 'extreme']).optional(),
  region: z.string().optional(),
  search: z.string().optional(),
  min_distance: z.number().positive().optional(),
  max_distance: z.number().positive().optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
});

// Tipo inferido del schema
export type RouteFormInput = z.infer<typeof routeFormSchema>;
export type RouteFiltersInput = z.infer<typeof routeFiltersSchema>;
