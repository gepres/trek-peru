import type { Timestamps } from './database.types';

// =============================================================================
// Tipos enumerados — deben coincidir con CHECK constraints de la migración 017
// =============================================================================

export type TransportMode =
  | 'bus'
  | 'plane'
  | 'taxi'
  | 'combi'
  | 'colectivo'
  | 'train'
  | 'motorcycle'
  | 'boat'
  | 'car'
  | 'walk'
  | 'bike'
  | 'other';

export type CostType = 'per_person' | 'per_vehicle' | 'per_group' | 'free';

export type TimeMode = 'exact' | 'approximate' | 'range';

export type TransportCurrency = 'PEN' | 'USD';

export type SuggestionSource = 'community' | 'ai' | 'rome2rio';

// Lista útil para iterar en UI (selectores)
export const TRANSPORT_MODES: TransportMode[] = [
  'bus',
  'plane',
  'taxi',
  'combi',
  'colectivo',
  'train',
  'motorcycle',
  'boat',
  'car',
  'walk',
  'bike',
  'other',
];

// =============================================================================
// Coordenadas (opcional en segmentos)
// =============================================================================

export interface Coordinates {
  lat: number;
  lng: number;
}

// =============================================================================
// Opción de transporte (alternativa concreta dentro de un segmento)
// =============================================================================

export interface TransportOption extends Timestamps {
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
  currency: TransportCurrency;

  frequency?: string;
  booking_location?: string;
  booking_url?: string;

  is_recommended: boolean;
  notes?: string;
}

// Form (sin id ni timestamps ni segment_id — se inyectan al crear)
export interface TransportOptionForm {
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
  currency: TransportCurrency;

  frequency?: string;
  booking_location?: string;
  booking_url?: string;

  is_recommended: boolean;
  notes?: string;
}

// =============================================================================
// Segmento (paso A→B)
// =============================================================================

export interface TransportSegment extends Timestamps {
  id: string;
  route_id: string;

  order_index: number;
  title?: string;

  from_label: string;
  from_coordinates?: Coordinates;
  to_label: string;
  to_coordinates?: Coordinates;

  notes?: string;

  // Eager-loaded en la mayoría de queries
  options: TransportOption[];
}

export interface TransportSegmentForm {
  title?: string;
  from_label: string;
  from_coordinates?: Coordinates;
  to_label: string;
  to_coordinates?: Coordinates;
  notes?: string;
  // order_index se asigna automáticamente al crear (último + 1)
}

// =============================================================================
// Sugerencia agregada — viene de la función SQL suggest_transport_alternatives
// =============================================================================

export interface AggregatedAlternative {
  mode: TransportMode;
  operator?: string;
  cost_min?: number;
  cost_max?: number;
  currency: TransportCurrency;
  duration_minutes?: number;
  sample_size: number;
  source: SuggestionSource;
}
