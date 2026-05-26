import {
  Bus,
  Plane,
  Car,
  Train,
  Ship,
  Bike,
  Footprints,
  CarTaxiFront,
  type LucideIcon,
} from 'lucide-react';
import type {
  TransportMode,
  CostType,
  TransportCurrency,
  TimeMode,
} from '@/types/transport.types';

// Mapa de modo → ícono lucide. Modos sin ícono directo usan fallback razonable.
export const MODE_ICONS: Record<TransportMode, LucideIcon> = {
  bus: Bus,
  plane: Plane,
  taxi: CarTaxiFront,
  combi: Bus,
  colectivo: Bus,
  train: Train,
  motorcycle: Bike,
  boat: Ship,
  car: Car,
  walk: Footprints,
  bike: Bike,
  other: Car,
};

// Color tonal por modo — usado para el badge de la cabecera
export const MODE_COLORS: Record<TransportMode, string> = {
  bus: 'text-blue-600 bg-blue-500/10 border-blue-500/20',
  plane: 'text-sky-600 bg-sky-500/10 border-sky-500/20',
  taxi: 'text-amber-600 bg-amber-500/10 border-amber-500/20',
  combi: 'text-cyan-600 bg-cyan-500/10 border-cyan-500/20',
  colectivo: 'text-cyan-600 bg-cyan-500/10 border-cyan-500/20',
  train: 'text-indigo-600 bg-indigo-500/10 border-indigo-500/20',
  motorcycle: 'text-rose-600 bg-rose-500/10 border-rose-500/20',
  boat: 'text-teal-600 bg-teal-500/10 border-teal-500/20',
  car: 'text-slate-600 bg-slate-500/10 border-slate-500/20',
  walk: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20',
  bike: 'text-lime-600 bg-lime-500/10 border-lime-500/20',
  other: 'text-slate-600 bg-slate-500/10 border-slate-500/20',
};

// Formatea duración en minutos a "2h 30min" / "45min" / "3h"
// Acepta null porque Supabase devuelve null para columnas vacías.
export function formatDuration(minutes?: number | null): string | null {
  if (minutes == null || minutes <= 0) return null;
  const n = Number(minutes);
  const h = Math.floor(n / 60);
  const m = n % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}

// Formatea costo con rango y moneda. Recibe traducciones del cost_type.
// Acepta null además de undefined porque Supabase devuelve null para columnas vacías.
export function formatCost(opts: {
  costMin?: number | null;
  costMax?: number | null;
  currency: TransportCurrency;
  costType: CostType;
  freeLabel: string;
  perPersonLabel: string;
  perVehicleLabel: string;
  perGroupLabel: string;
}): string | null {
  if (opts.costType === 'free') return opts.freeLabel;

  // Normaliza null → undefined para simplificar el resto del helper
  const min = opts.costMin == null ? undefined : Number(opts.costMin);
  const max = opts.costMax == null ? undefined : Number(opts.costMax);

  if (min === undefined && max === undefined) return null;

  const symbol = opts.currency === 'USD' ? '$' : 'S/';
  const fmt = (n: number) =>
    n % 1 === 0 ? n.toString() : n.toFixed(2).replace(/\.?0+$/, '');

  const range =
    min !== undefined && max !== undefined && min !== max
      ? `${symbol} ${fmt(min)}-${fmt(max)}`
      : `${symbol} ${fmt(min ?? max ?? 0)}`;

  const typeLabel =
    opts.costType === 'per_person'
      ? opts.perPersonLabel
      : opts.costType === 'per_vehicle'
        ? opts.perVehicleLabel
        : opts.perGroupLabel;

  return `${range} ${typeLabel}`;
}

// Prefijo "~" si el modo de tiempo es approximate
export function formatTime(
  time?: string | null,
  mode?: TimeMode,
): string | null {
  if (!time) return null;
  if (mode === 'approximate') return `~${time}`;
  return time;
}
