'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { SlidersHorizontal, Calendar, Route as RouteIcon, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RouteFilters as RouteFiltersType } from '@/types/route.types';

interface RouteFiltersProps {
  onFilterChange: (filters: RouteFiltersType) => void;
  // Callback opcional: se invoca tras "Aplicar Filtros" (útil para cerrar panel en mobile)
  onApplied?: () => void;
}

type Difficulty = 'easy' | 'moderate' | 'hard' | 'extreme';

// Regiones del Perú disponibles para filtrar (misma lista que el formulario de creación)
const PERU_REGIONS = [
  'Amazonas', 'Ancash', 'Apurímac', 'Arequipa', 'Ayacucho',
  'Cajamarca', 'Cusco', 'Huancavelica', 'Huánuco', 'Ica',
  'Junín', 'La Libertad', 'Lima', 'Moquegua', 'Pasco',
  'Puno', 'San Martín', 'Tacna',
];

// Componente de filtros para rutas
export function RouteFilters({ onFilterChange, onApplied }: RouteFiltersProps) {
  const t = useTranslations('routes');

  // Estados locales — solo se envían al padre al pulsar "Aplicar"
  const [selectedDifficulties, setSelectedDifficulties] = useState<Difficulty[]>([]);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [maxAltitude, setMaxAltitude] = useState(6000);
  // Duración en días (la BD almacena en horas, se convierte al aplicar)
  const [maxDuration, setMaxDuration] = useState(15);
  // Distancia en km
  const [maxDistance, setMaxDistance] = useState(100);
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  // Configuración de dificultades
  const difficulties: { value: Difficulty; label: string }[] = [
    { value: 'easy', label: t('difficulty.easy') || 'Fácil' },
    { value: 'moderate', label: t('difficulty.moderate') || 'Moderado' },
    { value: 'hard', label: t('difficulty.hard') || 'Difícil' },
    { value: 'extreme', label: t('difficulty.extreme') || 'Extremo' },
  ];

  // Manejar selección de dificultad (multi-select tipo toggle)
  const toggleDifficulty = (difficulty: Difficulty) => {
    setSelectedDifficulties((prev) =>
      prev.includes(difficulty)
        ? prev.filter((d) => d !== difficulty)
        : [...prev, difficulty]
    );
  };

  // Manejar selección de región (multi-select tipo toggle)
  const toggleRegion = (region: string) => {
    setSelectedRegions((prev) =>
      prev.includes(region)
        ? prev.filter((r) => r !== region)
        : [...prev, region]
    );
  };

  // Aplicar filtros — convierte días → horas para estimated_duration
  const handleApplyFilters = () => {
    const filters: RouteFiltersType = {};

    if (selectedDifficulties.length > 0) {
      filters.difficulties = selectedDifficulties;
    }

    if (selectedRegions.length > 0) {
      filters.regions = selectedRegions;
    }

    // Altitud: solo filtrar si está por debajo del máximo posible
    if (maxAltitude < 6000) {
      filters.max_altitude = maxAltitude;
    }

    // Duración: la BD almacena estimated_duration en HORAS → convertir días × 24
    if (maxDuration < 15) {
      filters.max_duration = maxDuration * 24;
    }

    // Distancia: la BD almacena en km directamente
    if (maxDistance < 100) {
      filters.max_distance = maxDistance;
    }

    if (dateFrom) {
      filters.date_from = dateFrom;
    }
    if (dateTo) {
      filters.date_to = dateTo;
    }

    onFilterChange(filters);
    // Notificar al padre para cerrar el panel en mobile si corresponde
    onApplied?.();
  };

  // Limpiar todos los filtros y emitir objeto vacío
  const handleReset = () => {
    setSelectedDifficulties([]);
    setSelectedRegions([]);
    setMaxAltitude(6000);
    setMaxDuration(15);
    setMaxDistance(100);
    setDateFrom('');
    setDateTo('');
    onFilterChange({});
  };

  // Genera el estilo del slider: fill desde el inicio hasta el valor actual
  const sliderStyle = (value: number, min: number, max: number) => ({
    background: `linear-gradient(to right,
      hsl(var(--primary)) 0%,
      hsl(var(--primary)) ${((value - min) / (max - min)) * 100}%,
      hsl(var(--muted)) ${((value - min) / (max - min)) * 100}%,
      hsl(var(--muted)) 100%)`,
  });

  const sliderClass = `
    w-full h-2 rounded-full appearance-none cursor-pointer
    [&::-webkit-slider-thumb]:appearance-none
    [&::-webkit-slider-thumb]:size-4
    [&::-webkit-slider-thumb]:rounded-full
    [&::-webkit-slider-thumb]:bg-white
    [&::-webkit-slider-thumb]:border-2
    [&::-webkit-slider-thumb]:border-primary
    [&::-webkit-slider-thumb]:shadow
    [&::-webkit-slider-thumb]:cursor-pointer
  `;

  return (
    <div className="bg-card rounded-2xl p-6 border border-border shadow-sm space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-foreground text-xl font-bold flex items-center gap-2">
          <SlidersHorizontal className="h-5 w-5 text-primary" />
          Filtros
        </h3>
        <button
          onClick={handleReset}
          className="text-xs text-muted-foreground hover:text-foreground uppercase font-semibold transition-colors"
        >
          Reset
        </button>
      </div>

      <div className="space-y-8">

        {/* ── Dificultad ── */}
        <div className="space-y-3">
          <p className="text-foreground text-sm font-semibold uppercase tracking-wider opacity-80">
            Dificultad
          </p>
          <div className="flex flex-wrap gap-2">
            {difficulties.map((d) => (
              <label key={d.value} className="cursor-pointer">
                <input
                  type="checkbox"
                  className="peer sr-only"
                  checked={selectedDifficulties.includes(d.value)}
                  onChange={() => toggleDifficulty(d.value)}
                />
                <div className="px-3 py-1.5 rounded-lg border border-border bg-background text-muted-foreground text-sm font-medium peer-checked:bg-primary/20 peer-checked:border-primary peer-checked:text-primary transition-all select-none">
                  {d.label}
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* ── Región ── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-foreground text-sm font-semibold uppercase tracking-wider opacity-80 flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              {t('filters.byRegion') || 'Región'}
            </p>
            {selectedRegions.length > 0 && (
              <button
                onClick={() => setSelectedRegions([])}
                className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
              >
                Limpiar ({selectedRegions.length})
              </button>
            )}
          </div>
          {/* Grid scrollable con todas las regiones */}
          <div className="max-h-48 overflow-y-auto pr-1 space-y-1 scrollbar-thin">
            {PERU_REGIONS.map((region) => {
              const active = selectedRegions.includes(region);
              return (
                <label key={region} className="flex items-center gap-2.5 cursor-pointer group">
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={active}
                    onChange={() => toggleRegion(region)}
                  />
                  {/* Checkbox visual personalizado */}
                  <span className="w-4 h-4 shrink-0 rounded border border-border bg-background flex items-center justify-center peer-checked:bg-primary peer-checked:border-primary transition-colors">
                    {active && (
                      <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 10" fill="none">
                        <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </span>
                  <span className={`text-sm leading-none transition-colors ${active ? 'text-primary font-medium' : 'text-muted-foreground group-hover:text-foreground'}`}>
                    {region}
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        {/* ── Altitud Máxima ── */}
        <div className="space-y-4">
          <div className="flex justify-between items-center text-sm">
            <p className="text-foreground font-semibold uppercase tracking-wider opacity-80">
              Altitud Máxima
            </p>
            <span className="text-primary font-bold">{maxAltitude.toLocaleString()} m</span>
          </div>
          <input
            type="range"
            min="1000"
            max="6000"
            step="100"
            value={maxAltitude}
            onChange={(e) => setMaxAltitude(Number(e.target.value))}
            className={sliderClass}
            style={sliderStyle(maxAltitude, 1000, 6000)}
          />
          <div className="flex justify-between text-xs text-muted-foreground font-medium">
            <span>1,000 m</span>
            <span>6,000 m</span>
          </div>
        </div>

        {/* ── Duración ──
             estimated_duration en BD = HORAS.
             El slider trabaja en días; al aplicar se multiplica ×24. */}
        <div className="space-y-4">
          <div className="flex justify-between items-center text-sm">
            <p className="text-foreground font-semibold uppercase tracking-wider opacity-80">
              Duración
            </p>
            <span className="text-primary font-bold">
              Hasta {maxDuration} {maxDuration === 1 ? 'día' : 'días'}
            </span>
          </div>
          <input
            type="range"
            min="1"
            max="15"
            step="1"
            value={maxDuration}
            onChange={(e) => setMaxDuration(Number(e.target.value))}
            className={sliderClass}
            style={sliderStyle(maxDuration, 1, 15)}
          />
          <div className="flex justify-between text-xs text-muted-foreground font-medium">
            <span>1 día</span>
            <span>15+ días</span>
          </div>
        </div>

        {/* ── Distancia ── */}
        <div className="space-y-4">
          <div className="flex justify-between items-center text-sm">
            <p className="text-foreground font-semibold uppercase tracking-wider opacity-80 flex items-center gap-2">
              <RouteIcon className="h-4 w-4" />
              {t('filters.byDistance') || 'Distancia'}
            </p>
            <span className="text-primary font-bold">Hasta {maxDistance} km</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={maxDistance}
            onChange={(e) => setMaxDistance(Number(e.target.value))}
            className={sliderClass}
            style={sliderStyle(maxDistance, 0, 100)}
          />
          <div className="flex justify-between text-xs text-muted-foreground font-medium">
            <span>0 km</span>
            <span>100+ km</span>
          </div>
        </div>

        {/* ── Fecha de Salida ── */}
        <div className="space-y-4">
          <p className="text-foreground text-sm font-semibold uppercase tracking-wider opacity-80 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {t('filters.byDate') || 'Fecha de Salida'}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="date-from" className="text-xs text-muted-foreground">
                Desde
              </Label>
              <Input
                id="date-from"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="date-to" className="text-xs text-muted-foreground">
                Hasta
              </Label>
              <Input
                id="date-to"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                min={dateFrom || undefined}
                className="text-sm"
              />
            </div>
          </div>
        </div>

        {/* ── Botón Aplicar ── */}
        <Button className="w-full font-bold" onClick={handleApplyFilters}>
          Aplicar Filtros
        </Button>
      </div>
    </div>
  );
}
