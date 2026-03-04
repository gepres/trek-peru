import {
  Difficulty,
  RouteStatus,
  RouteVisibility,
  AttendeeStatus,
  ExperienceLevel,
  MeetingPoint,
  Waypoint,
  Timestamps
} from './database.types';
import { Profile } from './user.types';

// Estado de pago de un asistente
export type PaymentStatus = 'unpaid' | 'pending_payment' | 'paid';

// Ruta base
export interface Route extends Timestamps {
  id: string;
  creator_id: string;

  // Información básica
  title: string;
  description?: string;
  slug: string;

  // Detalles técnicos
  difficulty: Difficulty;
  distance?: number;
  elevation_gain?: number;
  elevation_loss?: number;
  estimated_duration?: number;
  duration_type?: 'hours' | 'days';
  duration_value?: number;
  daily_itinerary?: any; // JSON array
  min_altitude?: number;
  max_altitude?: number;
  terrain_type?: string[];
  google_maps_link?: string;

  // Geolocalización
  meeting_point?: MeetingPoint;
  route_coordinates?: any; // GeoJSON
  waypoints?: Waypoint[];
  region?: string;
  province?: string;

  // Logística
  departure_date?: string;
  meeting_time?: string;
  min_capacity?: number;
  max_capacity?: number;
  cost?: number;
  currency?: string;
  includes?: string[];
  not_includes?: string[];

  // Requisitos y seguridad
  requirements?: string[];
  required_equipment?: string[];
  optional_equipment?: string[];
  technical_level?: string;
  risks?: string[];
  emergency_contact?: string;

  // Información adicional
  best_season?: string[];
  expected_weather?: string;
  water_available?: boolean;
  shelters?: boolean;
  mobile_signal?: boolean;

  // Media
  featured_image?: string;
  images?: string[];
  gpx_file?: string;
  video_url?: string;

  // Estado y visibilidad
  status: RouteStatus;
  visibility: RouteVisibility;
  featured?: boolean;
  verified?: boolean;
  comments_enabled?: boolean;

  // Estadísticas
  views?: number;
  favorites?: number;
  average_rating?: number;
  total_ratings?: number;

  published_at?: string;
}

// Ruta con información del creador
export interface RouteWithCreator extends Route {
  creator: Profile;
  total_attendees?: number;
  is_favorite?: boolean;
  my_attendance?: Attendee;
}

// Asistente
export interface Attendee extends Timestamps {
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
  // Campos de pago y mensaje del creador (agregados en migración)
  payment_status: PaymentStatus;
  creator_message?: string;
}

// Asistente con información de usuario
export interface AttendeeWithUser extends Attendee {
  user: Profile;
}

// Comentario
export interface Comment extends Timestamps {
  id: string;
  route_id: string;
  user_id: string;
  parent_id?: string;
  content: string;
  image_url?: string;
  is_edited?: boolean;
  edited_at?: string;
}

// Comentario con información de usuario
export interface CommentWithUser extends Comment {
  user: Profile;
  replies?: CommentWithUser[];
  can_edit?: boolean;
  can_delete?: boolean;
}

// Favorito
export interface Favorite {
  id: string;
  user_id: string;
  route_id: string;
  created_at: string;
}

// Formulario de ruta
export interface RouteForm {
  title: string;
  description?: string;
  difficulty: Difficulty;
  distance?: number;
  elevation_gain?: number;
  elevation_loss?: number;
  estimated_duration?: number;
  min_altitude?: number;
  max_altitude?: number;
  terrain_type?: string[];
  meeting_point?: MeetingPoint;
  route_coordinates?: any;
  waypoints?: Waypoint[];
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
  status?: RouteStatus;
  visibility?: RouteVisibility;
}

// Filtros de rutas
export interface RouteFilters {
  difficulties?: Difficulty[];
  regions?: string[];   // multi-select de regiones (antes era region?: string)
  search?: string;
  min_distance?: number;
  max_distance?: number;
  date_from?: string;
  date_to?: string;
  max_altitude?: number;
  min_duration?: number;
  max_duration?: number;
}
