import { SupabaseClient } from '@supabase/supabase-js';
import type {
  TransportSegment,
  TransportSegmentForm,
  TransportOption,
  TransportOptionForm,
  AggregatedAlternative,
  Coordinates,
} from '@/types/transport.types';
import type { ITransportRepository } from '@/domain/transport/transport.repository.interface';

// Postgres devuelve GEOGRAPHY como hex WKB o GeoJSON dependiendo de la query.
// En este repo guardamos puntos sencillos y los exponemos como { lat, lng }.
// El editor enviará coords como objetos { lat, lng } que convertimos a WKT.
function coordsToWkt(coords?: Coordinates): string | null {
  if (!coords) return null;
  return `SRID=4326;POINT(${coords.lng} ${coords.lat})`;
}

// PostGIS puede devolver GEOGRAPHY como GeoJSON (cuando se pide explícitamente
// con ST_AsGeoJSON) o como WKB hex. Como aquí no proyectamos coords todavía
// (solo se usan para futuras integraciones de mapa), devolvemos null si el
// formato es opaco — para Fase 1 las coords no son críticas en la UI.
function wkbToCoords(raw: unknown): Coordinates | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  // Si Supabase devolvió GeoJSON
  const anyRaw = raw as { type?: string; coordinates?: [number, number] };
  if (anyRaw.type === 'Point' && Array.isArray(anyRaw.coordinates)) {
    const [lng, lat] = anyRaw.coordinates;
    return { lat, lng };
  }
  return undefined;
}

// Select base de un segmento con sus opciones — ordenado por order_index
const SEGMENT_SELECT = `
  id,
  route_id,
  order_index,
  title,
  from_label,
  to_label,
  notes,
  created_at,
  updated_at,
  options:route_transport_options(
    id,
    segment_id,
    mode,
    operator,
    class,
    time_mode,
    departure_time,
    arrival_time,
    duration_minutes,
    cost_type,
    cost_min,
    cost_max,
    currency,
    frequency,
    booking_location,
    booking_url,
    is_recommended,
    notes,
    created_at,
    updated_at
  )
`;

function normalizeSegmentRow(row: Record<string, unknown>): TransportSegment {
  return {
    id: row.id as string,
    route_id: row.route_id as string,
    order_index: row.order_index as number,
    title: (row.title as string | null) ?? undefined,
    from_label: row.from_label as string,
    to_label: row.to_label as string,
    from_coordinates: wkbToCoords(row.from_coordinates),
    to_coordinates: wkbToCoords(row.to_coordinates),
    notes: (row.notes as string | null) ?? undefined,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
    options: ((row.options as TransportOption[] | null) ?? [])
      .slice()
      .sort((a, b) => {
        // Recomendado primero, luego por creación
        if (a.is_recommended && !b.is_recommended) return -1;
        if (!a.is_recommended && b.is_recommended) return 1;
        return (
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      }),
  };
}

// Repositorio Supabase para tramos de transporte ("cómo llegar")
export function createTransportRepository(
  supabase: SupabaseClient,
): ITransportRepository {
  return {
    async findByRouteId(routeId: string): Promise<TransportSegment[]> {
      const { data, error } = await supabase
        .from('route_transport_segments')
        .select(SEGMENT_SELECT)
        .eq('route_id', routeId)
        .order('order_index', { ascending: true });

      if (error) throw error;
      return (data ?? []).map((row) =>
        normalizeSegmentRow(row as Record<string, unknown>),
      );
    },

    async createSegment(
      routeId: string,
      data: TransportSegmentForm,
    ): Promise<TransportSegment> {
      // Asignar order_index = (max actual) + 1 para evitar colisiones con UNIQUE
      const { data: existing, error: countError } = await supabase
        .from('route_transport_segments')
        .select('order_index')
        .eq('route_id', routeId)
        .order('order_index', { ascending: false })
        .limit(1);

      if (countError) throw countError;
      const nextOrder =
        existing && existing.length > 0
          ? (existing[0].order_index as number) + 1
          : 1;

      const { data: inserted, error } = await supabase
        .from('route_transport_segments')
        .insert({
          route_id: routeId,
          order_index: nextOrder,
          title: data.title ?? null,
          from_label: data.from_label,
          to_label: data.to_label,
          from_coordinates: coordsToWkt(data.from_coordinates),
          to_coordinates: coordsToWkt(data.to_coordinates),
          notes: data.notes ?? null,
        })
        .select(SEGMENT_SELECT)
        .single();

      if (error) throw error;
      return normalizeSegmentRow(inserted as Record<string, unknown>);
    },

    async updateSegment(
      segmentId: string,
      data: Partial<TransportSegmentForm>,
    ): Promise<TransportSegment> {
      const payload: Record<string, unknown> = {};
      if (data.title !== undefined) payload.title = data.title;
      if (data.from_label !== undefined) payload.from_label = data.from_label;
      if (data.to_label !== undefined) payload.to_label = data.to_label;
      if (data.from_coordinates !== undefined)
        payload.from_coordinates = coordsToWkt(data.from_coordinates);
      if (data.to_coordinates !== undefined)
        payload.to_coordinates = coordsToWkt(data.to_coordinates);
      if (data.notes !== undefined) payload.notes = data.notes;

      const { data: updated, error } = await supabase
        .from('route_transport_segments')
        .update(payload)
        .eq('id', segmentId)
        .select(SEGMENT_SELECT)
        .single();

      if (error) throw error;
      return normalizeSegmentRow(updated as Record<string, unknown>);
    },

    async deleteSegment(segmentId: string): Promise<void> {
      const { error } = await supabase
        .from('route_transport_segments')
        .delete()
        .eq('id', segmentId);
      if (error) throw error;
    },

    async reorderSegments(
      routeId: string,
      orderedIds: string[],
    ): Promise<void> {
      // Estrategia en dos fases para no chocar con UNIQUE(route_id, order_index):
      // 1) mover todos a un rango temporal alto
      // 2) escribir el orden final
      // Hacemos un update por segmento; el volumen esperado es bajo (<20 pasos).
      const TEMP_OFFSET = 10_000;

      for (let i = 0; i < orderedIds.length; i += 1) {
        const { error } = await supabase
          .from('route_transport_segments')
          .update({ order_index: TEMP_OFFSET + i })
          .eq('id', orderedIds[i])
          .eq('route_id', routeId);
        if (error) throw error;
      }

      for (let i = 0; i < orderedIds.length; i += 1) {
        const { error } = await supabase
          .from('route_transport_segments')
          .update({ order_index: i + 1 })
          .eq('id', orderedIds[i])
          .eq('route_id', routeId);
        if (error) throw error;
      }
    },

    async addOption(
      segmentId: string,
      data: TransportOptionForm,
    ): Promise<TransportOption> {
      const { data: inserted, error } = await supabase
        .from('route_transport_options')
        .insert({
          segment_id: segmentId,
          mode: data.mode,
          operator: data.operator ?? null,
          class: data.class ?? null,
          time_mode: data.time_mode,
          departure_time: data.departure_time ?? null,
          arrival_time: data.arrival_time ?? null,
          duration_minutes: data.duration_minutes ?? null,
          cost_type: data.cost_type,
          cost_min: data.cost_min ?? null,
          cost_max: data.cost_max ?? null,
          currency: data.currency,
          frequency: data.frequency ?? null,
          booking_location: data.booking_location ?? null,
          booking_url: data.booking_url ?? null,
          is_recommended: data.is_recommended,
          notes: data.notes ?? null,
        })
        .select('*')
        .single();

      if (error) throw error;
      return inserted as TransportOption;
    },

    async updateOption(
      optionId: string,
      data: Partial<TransportOptionForm>,
    ): Promise<TransportOption> {
      const payload: Record<string, unknown> = {};
      const allowedKeys: (keyof TransportOptionForm)[] = [
        'mode',
        'operator',
        'class',
        'time_mode',
        'departure_time',
        'arrival_time',
        'duration_minutes',
        'cost_type',
        'cost_min',
        'cost_max',
        'currency',
        'frequency',
        'booking_location',
        'booking_url',
        'is_recommended',
        'notes',
      ];

      for (const key of allowedKeys) {
        if (data[key] !== undefined) {
          payload[key] = data[key];
        }
      }

      const { data: updated, error } = await supabase
        .from('route_transport_options')
        .update(payload)
        .eq('id', optionId)
        .select('*')
        .single();

      if (error) throw error;
      return updated as TransportOption;
    },

    async deleteOption(optionId: string): Promise<void> {
      const { error } = await supabase
        .from('route_transport_options')
        .delete()
        .eq('id', optionId);
      if (error) throw error;
    },

    async findAlternativesForLeg(
      fromLabel: string,
      toLabel: string,
      excludeSegmentId?: string,
    ): Promise<AggregatedAlternative[]> {
      const { data, error } = await supabase.rpc(
        'suggest_transport_alternatives',
        {
          p_from_label: fromLabel,
          p_to_label: toLabel,
          p_exclude_segment_id: excludeSegmentId ?? null,
        },
      );

      if (error) throw error;
      return ((data as Record<string, unknown>[] | null) ?? []).map((row) => ({
        mode: row.mode as AggregatedAlternative['mode'],
        operator: (row.operator as string | null) ?? undefined,
        cost_min:
          row.cost_min !== null && row.cost_min !== undefined
            ? Number(row.cost_min)
            : undefined,
        cost_max:
          row.cost_max !== null && row.cost_max !== undefined
            ? Number(row.cost_max)
            : undefined,
        currency: row.currency as AggregatedAlternative['currency'],
        duration_minutes:
          row.duration_minutes !== null && row.duration_minutes !== undefined
            ? Number(row.duration_minutes)
            : undefined,
        sample_size: Number(row.sample_size ?? 0),
        source: (row.source as AggregatedAlternative['source']) ?? 'community',
      }));
    },
  };
}

export type TransportRepository = ReturnType<typeof createTransportRepository>;
