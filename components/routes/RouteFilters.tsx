'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { SlidersHorizontal, Calendar, Route as RouteIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RouteFilters as RouteFiltersType } from '@/types/route.types';

interface RouteFiltersProps {
  onFilterChange: (filters: RouteFiltersType) => void;
}

type Difficulty = 'easy' | 'moderate' | 'hard' | 'extreme';

// Componente de filtros para rutas - Diseño de code.html
export function RouteFilters({ onFilterChange }: RouteFiltersProps) {
  const t = useTranslations('routes');

  // Estados
  const [selectedDifficulties, setSelectedDifficulties] = useState<Difficulty[]>([]);
  const [maxAltitude, setMaxAltitude] = useState(6000);
  const [durationRange, setDurationRange] = useState<[number, number]>([1, 15]);
  const [distanceRange, setDistanceRange] = useState<[number, number]>([0, 100]);
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  // Configuración de dificultades
  const difficulties: { value: Difficulty; label: string }[] = [
    { value: 'easy', label: t('difficulty.easy') || 'Fácil' },
    { value: 'moderate', label: t('difficulty.moderate') || 'Moderado' },
    { value: 'hard', label: t('difficulty.hard') || 'Difícil' },
    { value: 'extreme', label: t('difficulty.extreme') || 'Extremo' },
  ];

  // Manejar cambio de dificultad
  const toggleDifficulty = (difficulty: Difficulty) => {
    setSelectedDifficulties((prev) =>
      prev.includes(difficulty)
        ? prev.filter((d) => d !== difficulty)
        : [...prev, difficulty]
    );
  };

  // Aplicar filtros
  const handleApplyFilters = () => {
    const filters: RouteFiltersType = {};

    if (selectedDifficulties.length > 0) {
      filters.difficulties = selectedDifficulties;
    }

    if (maxAltitude < 6000) {
      filters.max_altitude = maxAltitude;
    }

    if (durationRange[0] > 1) {
      filters.min_duration = durationRange[0];
    }
    if (durationRange[1] < 15) {
      filters.max_duration = durationRange[1];
    }

    if (distanceRange[0] > 0) {
      filters.min_distance = distanceRange[0];
    }
    if (distanceRange[1] < 100) {
      filters.max_distance = distanceRange[1];
    }

    if (dateFrom) {
      filters.date_from = dateFrom;
    }
    if (dateTo) {
      filters.date_to = dateTo;
    }

    onFilterChange(filters);
  };

  // Limpiar filtros
  const handleReset = () => {
    setSelectedDifficulties([]);
    setMaxAltitude(6000);
    setDurationRange([1, 15]);
    setDistanceRange([0, 100]);
    setDateFrom('');
    setDateTo('');
    onFilterChange({});
  };

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
        {/* Difficulty */}
        <div className="space-y-3">
          <p className="text-foreground text-sm font-semibold uppercase tracking-wider opacity-80">
            Dificultad
          </p>
          <div className="flex flex-wrap gap-2">
            {difficulties.map((difficulty) => (
              <label key={difficulty.value} className="cursor-pointer">
                <input
                  type="checkbox"
                  className="peer sr-only"
                  checked={selectedDifficulties.includes(difficulty.value)}
                  onChange={() => toggleDifficulty(difficulty.value)}
                />
                <div className="px-3 py-1.5 rounded-lg border border-border bg-background text-muted-foreground text-sm font-medium peer-checked:bg-primary/20 peer-checked:border-primary peer-checked:text-primary transition-all">
                  {difficulty.label}
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Altitude Slider */}
        <div className="space-y-4">
          <div className="flex justify-between items-center text-sm">
            <p className="text-foreground font-semibold uppercase tracking-wider opacity-80">
              Altitud Máxima
            </p>
            <span className="text-primary font-bold">{maxAltitude.toLocaleString()}m</span>
          </div>
          <div className="relative">
            <input
              type="range"
              min="1000"
              max="6000"
              step="100"
              value={maxAltitude}
              onChange={(e) => setMaxAltitude(Number(e.target.value))}
              className="w-full h-2 bg-muted rounded-full appearance-none cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none
                [&::-webkit-slider-thumb]:size-4
                [&::-webkit-slider-thumb]:rounded-full
                [&::-webkit-slider-thumb]:bg-white
                [&::-webkit-slider-thumb]:border-2
                [&::-webkit-slider-thumb]:border-primary
                [&::-webkit-slider-thumb]:shadow
                [&::-webkit-slider-thumb]:cursor-pointer"
              style={{
                background: `linear-gradient(to right, hsl(var(--primary)) 0%, hsl(var(--primary)) ${((maxAltitude - 1000) / 5000) * 100}%, hsl(var(--muted)) ${((maxAltitude - 1000) / 5000) * 100}%, hsl(var(--muted)) 100%)`,
              }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground font-medium">
            <span>1,000m</span>
            <span>6,000m</span>
          </div>
        </div>

        {/* Duration Range Slider */}
        <div className="space-y-4">
          <div className="flex justify-between items-center text-sm">
            <p className="text-foreground font-semibold uppercase tracking-wider opacity-80">
              Duración
            </p>
            <span className="text-primary font-bold">
              {durationRange[0]}-{durationRange[1]} Días
            </span>
          </div>
          <div className="relative">
            <input
              type="range"
              min="1"
              max="15"
              step="1"
              value={durationRange[1]}
              onChange={(e) => setDurationRange([durationRange[0], Number(e.target.value)])}
              className="w-full h-2 bg-muted rounded-full appearance-none cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none
                [&::-webkit-slider-thumb]:size-4
                [&::-webkit-slider-thumb]:rounded-full
                [&::-webkit-slider-thumb]:bg-white
                [&::-webkit-slider-thumb]:border-2
                [&::-webkit-slider-thumb]:border-primary
                [&::-webkit-slider-thumb]:shadow
                [&::-webkit-slider-thumb]:cursor-pointer"
              style={{
                background: `linear-gradient(to right, hsl(var(--muted)) 0%, hsl(var(--muted)) ${((durationRange[0] - 1) / 14) * 100}%, hsl(var(--primary)) ${((durationRange[0] - 1) / 14) * 100}%, hsl(var(--primary)) ${((durationRange[1] - 1) / 14) * 100}%, hsl(var(--muted)) ${((durationRange[1] - 1) / 14) * 100}%, hsl(var(--muted)) 100%)`,
              }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground font-medium">
            <span>1 Día</span>
            <span>15+ Días</span>
          </div>
        </div>

        {/* Distance Range Slider */}
        <div className="space-y-4">
          <div className="flex justify-between items-center text-sm">
            <p className="text-foreground font-semibold uppercase tracking-wider opacity-80 flex items-center gap-2">
              <RouteIcon className="h-4 w-4" />
              {t('filters.byDistance') || 'Distancia'}
            </p>
            <span className="text-primary font-bold">
              {distanceRange[0]}-{distanceRange[1]} km
            </span>
          </div>
          <div className="relative">
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={distanceRange[1]}
              onChange={(e) => setDistanceRange([distanceRange[0], Number(e.target.value)])}
              className="w-full h-2 bg-muted rounded-full appearance-none cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none
                [&::-webkit-slider-thumb]:size-4
                [&::-webkit-slider-thumb]:rounded-full
                [&::-webkit-slider-thumb]:bg-white
                [&::-webkit-slider-thumb]:border-2
                [&::-webkit-slider-thumb]:border-primary
                [&::-webkit-slider-thumb]:shadow
                [&::-webkit-slider-thumb]:cursor-pointer"
              style={{
                background: `linear-gradient(to right, hsl(var(--muted)) 0%, hsl(var(--muted)) ${(distanceRange[0] / 100) * 100}%, hsl(var(--primary)) ${(distanceRange[0] / 100) * 100}%, hsl(var(--primary)) ${(distanceRange[1] / 100) * 100}%, hsl(var(--muted)) ${(distanceRange[1] / 100) * 100}%, hsl(var(--muted)) 100%)`,
              }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground font-medium">
            <span>0 km</span>
            <span>100+ km</span>
          </div>
        </div>

        {/* Date Filter */}
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

        {/* Apply Button */}
        <Button
          className="w-full font-bold"
          onClick={handleApplyFilters}
        >
          Aplicar Filtros
        </Button>
      </div>
    </div>
  );
}
