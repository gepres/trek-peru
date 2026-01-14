import { z } from 'zod';

// Schema para punto de encuentro
export const meetingPointSchema = z.object({
  name: z.string().min(1, 'El nombre del punto de encuentro es requerido'),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  instructions: z.string().optional(),
});

// Schema para waypoints
export const waypointSchema = z.object({
  name: z.string().min(1, 'El nombre del waypoint es requerido'),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  description: z.string().optional(),
});

// Schema para itinerario diario
export const dailyItinerarySchema = z.object({
  day: z.number().int().positive(),
  title: z.string().min(1, 'El título del día es requerido'),
  description: z.string().optional(),
});

// Schema principal para crear/editar rutas
export const routeFormSchema = z.object({
  // 1. Información básica (REQUERIDOS)
  title: z.string()
    .min(5, 'El título debe tener al menos 5 caracteres')
    .max(200, 'El título no puede exceder 200 caracteres'),
  description: z.string()
    .min(20, 'La descripción debe tener al menos 20 caracteres')
    .max(2000, 'La descripción no puede exceder 2000 caracteres'),
  difficulty: z.enum(['easy', 'moderate', 'hard', 'extreme'], {
    required_error: 'La dificultad es requerida'
  }),
  region: z.string()
    .min(1, 'La región es requerida')
    .max(100),

  // Duración (REQUERIDO)
  duration_type: z.enum(['hours', 'days'], {
    required_error: 'El tipo de duración es requerido'
  }),
  duration_value: z.number()
    .positive('La duración debe ser un número positivo')
    .min(1, 'La duración mínima es 1'),

  // Itinerario diario (solo si duration_type es 'days')
  daily_itinerary: z.array(dailyItinerarySchema).optional(),

  // 2. Logística y Capacidad
  departure_date: z.string().optional(),
  meeting_time: z.string().optional(),
  max_capacity: z.number().int().positive().optional(),
  cost: z.number().nonnegative().optional(),
  currency: z.string().length(3).default('PEN'),

  // 3. Publicación
  status: z.enum(['draft', 'published', 'cancelled', 'completed']).default('draft'),
  visibility: z.enum(['public', 'private', 'link']).default('public'),

  // 4. Detalles Técnicos (OPCIONALES)
  distance: z.number().positive('La distancia debe ser positiva').optional(),
  elevation_gain: z.number().nonnegative('El desnivel positivo debe ser mayor o igual a 0').optional(),
  elevation_loss: z.number().nonnegative('El desnivel negativo debe ser mayor o igual a 0').optional(),
  min_altitude: z.number().optional(),
  max_altitude: z.number().optional(),
  terrain_type: z.array(z.string()).optional(),
  province: z.string().max(100).optional(),

  // Equipo esencial
  essential_equipment: z.array(z.string()).optional(),

  // Link de Google Maps (opcional)
  google_maps_link: z.string().url('Debe ser un link válido').optional().or(z.literal('')),

  // Información adicional
  best_season: z.array(z.string()).optional(),
  expected_weather: z.string().max(50).optional(),
  water_available: z.boolean().default(false),
  shelters: z.boolean().default(false),
  mobile_signal: z.boolean().default(false),
  emergency_contact: z.string().max(100).optional(),
  risks: z.array(z.string()).optional(),

  // 5. Mapa de la Ruta
  meeting_point: meetingPointSchema.optional(),
  route_coordinates: z.any().optional(), // GeoJSON
  waypoints: z.array(waypointSchema).optional(),

  // 6. Imágenes
  featured_image: z.string().url().optional().or(z.literal('')),
  images: z.array(z.string()).optional(),
  gpx_file: z.string().optional(),
  video_url: z.string().url().optional().or(z.literal('')),

  // Campos legacy (mantener compatibilidad)
  estimated_duration: z.number().positive().optional(),
  includes: z.array(z.string()).optional(),
  not_includes: z.array(z.string()).optional(),
  requirements: z.array(z.string()).optional(),
  required_equipment: z.array(z.string()).optional(),
  optional_equipment: z.array(z.string()).optional(),
  technical_level: z.string().max(50).optional(),
  min_capacity: z.number().int().positive().default(1),
}).refine(
  (data) => !data.max_capacity || !data.min_capacity || data.max_capacity >= data.min_capacity,
  {
    message: 'La capacidad máxima debe ser mayor o igual a la capacidad mínima',
    path: ['max_capacity'],
  }
).refine(
  (data) => !data.max_altitude || !data.min_altitude || data.max_altitude >= data.min_altitude,
  {
    message: 'La altitud máxima debe ser mayor o igual a la altitud mínima',
    path: ['max_altitude'],
  }
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
  }
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
