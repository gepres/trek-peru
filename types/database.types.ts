// Tipos enumerados de la base de datos
export type Difficulty = 'easy' | 'moderate' | 'hard' | 'extreme';
export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';
export type RouteStatus = 'draft' | 'published' | 'cancelled' | 'completed';
export type RouteVisibility = 'public' | 'private' | 'link';
export type AttendeeStatus = 'pending' | 'confirmed' | 'cancelled' | 'waiting_list' | 'completed';
export type AttendanceStatus = 'attended' | 'absent';

// Tipo para punto de encuentro
export interface MeetingPoint {
  coordinates: {
    latitude: number;
    longitude: number;
  };
  name?: string;
  address?: string;
}

// Tipo para waypoints
export interface Waypoint {
  coordinates: {
    latitude: number;
    longitude: number;
  };
  name: string;
  order: number;
  description?: string;
}

// Tipo base para timestamps
export interface Timestamps {
  created_at: string;
  updated_at: string;
}
