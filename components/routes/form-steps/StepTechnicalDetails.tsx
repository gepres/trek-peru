'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EquipmentList } from '../EquipmentList';
import {
  Mountain, Ruler, TrendingUp, TrendingDown, Link as LinkIcon, AlertCircle, Backpack,
  Droplets, Home, Signal, Thermometer, Footprints, Gauge
} from 'lucide-react';
import { UseFormRegister, FieldErrors, UseFormSetValue, UseFormWatch, Controller, Control } from 'react-hook-form';
import { RouteFormInput } from '@/lib/validations/route.schema';

interface StepTechnicalDetailsProps {
  register: UseFormRegister<RouteFormInput>;
  errors: FieldErrors<RouteFormInput>;
  equipment: string[];
  setEquipment: (equipment: string[]) => void;
  setValue: UseFormSetValue<RouteFormInput>;
  watch: UseFormWatch<RouteFormInput>;
  control: Control<RouteFormInput>;
}

const TERRAIN_TYPES = [
  'Sendero',
  'Bosque',
  'Montaña',
  'Roca',
  'Nieve',
  'Arena',
  'Lodo',
  'Río/Agua',
  'Glaciar',
  'Desierto',
  'Selva',
  'Pradera',
];

const TECHNICAL_LEVELS = [
  { value: 'none', label: 'Sin requerimiento técnico' },
  { value: 'basic', label: 'Básico - Caminata simple' },
  { value: 'intermediate', label: 'Intermedio - Terreno irregular' },
  { value: 'advanced', label: 'Avanzado - Uso de cuerdas/equipos' },
  { value: 'expert', label: 'Experto - Alta montaña/técnico' },
];

export function StepTechnicalDetails({
  register,
  errors,
  equipment,
  setEquipment,
  setValue,
  watch,
  control,
}: StepTechnicalDetailsProps) {
  const waterAvailable = watch('water_available');
  const shelters = watch('shelters');
  const mobileSignal = watch('mobile_signal');
  const terrainType = watch('terrain_type') || [];

  const toggleTerrainType = (terrain: string) => {
    const current = terrainType || [];
    if (current.includes(terrain)) {
      setValue('terrain_type', current.filter(t => t !== terrain));
    } else {
      setValue('terrain_type', [...current, terrain]);
    }
  };
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>4. Detalles Técnicos</CardTitle>
          <CardDescription>
            Información adicional sobre la ruta (todos los campos son opcionales)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Distancia y elevación */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Distancia */}
            <div className="space-y-2">
              <Label htmlFor="distance" className="flex items-center gap-2">
                <Ruler className="h-4 w-4" />
                Distancia (km)
              </Label>
              <Input
                id="distance"
                type="number"
                min="0"
                step="0.1"
                {...register('distance', { valueAsNumber: true })}
                placeholder="Ej: 12.5"
                className={errors.distance ? 'border-destructive' : ''}
              />
              {errors.distance && (
                <p className="text-sm text-destructive">{errors.distance.message}</p>
              )}
            </div>

            {/* Desnivel positivo */}
            <div className="space-y-2">
              <Label htmlFor="elevation_gain" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                Desnivel + (m)
              </Label>
              <Input
                id="elevation_gain"
                type="number"
                min="0"
                {...register('elevation_gain', { valueAsNumber: true })}
                placeholder="Ej: 800"
                className={errors.elevation_gain ? 'border-destructive' : ''}
              />
              {errors.elevation_gain && (
                <p className="text-sm text-destructive">{errors.elevation_gain.message}</p>
              )}
            </div>

            {/* Desnivel negativo */}
            <div className="space-y-2">
              <Label htmlFor="elevation_loss" className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-red-500" />
                Desnivel - (m)
              </Label>
              <Input
                id="elevation_loss"
                type="number"
                min="0"
                {...register('elevation_loss', { valueAsNumber: true })}
                placeholder="Ej: 600"
                className={errors.elevation_loss ? 'border-destructive' : ''}
              />
              {errors.elevation_loss && (
                <p className="text-sm text-destructive">{errors.elevation_loss.message}</p>
              )}
            </div>
          </div>

          {/* Altitudes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Altitud mínima */}
            <div className="space-y-2">
              <Label htmlFor="min_altitude" className="flex items-center gap-2">
                <Mountain className="h-4 w-4" />
                Altitud Mínima (m.s.n.m)
              </Label>
              <Input
                id="min_altitude"
                type="number"
                min="0"
                {...register('min_altitude', { valueAsNumber: true })}
                placeholder="Ej: 2800"
                className={errors.min_altitude ? 'border-destructive' : ''}
              />
              {errors.min_altitude && (
                <p className="text-sm text-destructive">{errors.min_altitude.message}</p>
              )}
            </div>

            {/* Altitud máxima */}
            <div className="space-y-2">
              <Label htmlFor="max_altitude" className="flex items-center gap-2">
                <Mountain className="h-4 w-4" />
                Altitud Máxima (m.s.n.m)
              </Label>
              <Input
                id="max_altitude"
                type="number"
                min="0"
                {...register('max_altitude', { valueAsNumber: true })}
                placeholder="Ej: 4200"
                className={errors.max_altitude ? 'border-destructive' : ''}
              />
              {errors.max_altitude && (
                <p className="text-sm text-destructive">{errors.max_altitude.message}</p>
              )}
            </div>
          </div>

          {/* Google Maps Link */}
          <div className="space-y-2">
            <Label htmlFor="google_maps_link" className="flex items-center gap-2">
              <LinkIcon className="h-4 w-4" />
              Link de Google Maps
            </Label>
            <Input
              id="google_maps_link"
              type="url"
              {...register('google_maps_link')}
              placeholder="https://maps.google.com/..."
              className={errors.google_maps_link ? 'border-destructive' : ''}
            />
            <p className="text-xs text-muted-foreground">
              Link directo a Google Maps con la ubicación o ruta trazada
            </p>
            {errors.google_maps_link && (
              <p className="text-sm text-destructive">{errors.google_maps_link.message}</p>
            )}
          </div>

          {/* Equipo esencial */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Backpack className="h-4 w-4" />
              Equipo Esencial
            </Label>
            <EquipmentList
              value={equipment}
              onChange={(items) => {
                setEquipment(items);
                setValue('essential_equipment', items);
              }}
            />
            <p className="text-xs text-muted-foreground">
              Lista de equipo recomendado o requerido para el trekking
            </p>
          </div>

          {/* Contacto de emergencia */}
          <div className="space-y-2">
            <Label htmlFor="emergency_contact" className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Contacto de Emergencia
            </Label>
            <Input
              id="emergency_contact"
              type="text"
              {...register('emergency_contact')}
              placeholder="Nombre y teléfono: Juan Pérez - +51 987 654 321"
              className={errors.emergency_contact ? 'border-destructive' : ''}
            />
            <p className="text-xs text-muted-foreground">
              Persona de contacto en caso de emergencia durante la ruta
            </p>
            {errors.emergency_contact && (
              <p className="text-sm text-destructive">{errors.emergency_contact.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Condiciones y Servicios */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Thermometer className="h-5 w-5 text-amber-500" />
            Condiciones y Servicios
          </CardTitle>
          <CardDescription>
            Información sobre servicios disponibles en la ruta
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Switches de servicios */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Agua disponible */}
            <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${waterAvailable ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted text-muted-foreground'}`}>
                  <Droplets className="h-5 w-5" />
                </div>
                <div>
                  <Label htmlFor="water_available" className="font-medium cursor-pointer">
                    Agua Disponible
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Fuentes de agua en la ruta
                  </p>
                </div>
              </div>
              <Switch
                id="water_available"
                checked={waterAvailable}
                onCheckedChange={(checked) => setValue('water_available', checked)}
              />
            </div>

            {/* Refugios */}
            <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${shelters ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted text-muted-foreground'}`}>
                  <Home className="h-5 w-5" />
                </div>
                <div>
                  <Label htmlFor="shelters" className="font-medium cursor-pointer">
                    Refugios
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Refugios o zonas de descanso
                  </p>
                </div>
              </div>
              <Switch
                id="shelters"
                checked={shelters}
                onCheckedChange={(checked) => setValue('shelters', checked)}
              />
            </div>

            {/* Señal móvil */}
            <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${mobileSignal ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted text-muted-foreground'}`}>
                  <Signal className="h-5 w-5" />
                </div>
                <div>
                  <Label htmlFor="mobile_signal" className="font-medium cursor-pointer">
                    Señal Móvil
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Cobertura de señal celular
                  </p>
                </div>
              </div>
              <Switch
                id="mobile_signal"
                checked={mobileSignal}
                onCheckedChange={(checked) => setValue('mobile_signal', checked)}
              />
            </div>
          </div>

          {/* Clima esperado */}
          <div className="space-y-2">
            <Label htmlFor="expected_weather" className="flex items-center gap-2">
              <Thermometer className="h-4 w-4" />
              Clima Esperado
            </Label>
            <Input
              id="expected_weather"
              type="text"
              {...register('expected_weather')}
              placeholder="Ej: Soleado con nubes, 15-20°C"
              className={errors.expected_weather ? 'border-destructive' : ''}
            />
            <p className="text-xs text-muted-foreground">
              Condiciones climáticas típicas durante la ruta
            </p>
          </div>

          {/* Tipo de terreno */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Footprints className="h-4 w-4" />
              Tipo de Terreno
            </Label>
            <div className="flex flex-wrap gap-2">
              {TERRAIN_TYPES.map((terrain) => (
                <button
                  key={terrain}
                  type="button"
                  onClick={() => toggleTerrainType(terrain)}
                  className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${
                    terrainType.includes(terrain)
                      ? 'bg-primary/10 border-primary text-primary'
                      : 'bg-background border-border text-muted-foreground hover:border-primary/50'
                  }`}
                >
                  {terrain}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Selecciona los tipos de terreno que encontrarás en la ruta
            </p>
          </div>

          {/* Nivel técnico */}
          <div className="space-y-2">
            <Label htmlFor="technical_level" className="flex items-center gap-2">
              <Gauge className="h-4 w-4" />
              Nivel Técnico Requerido
            </Label>
            <Controller
              control={control}
              name="technical_level"
              render={({ field }) => (
                <Select value={field.value || ''} onValueChange={field.onChange}>
                  <SelectTrigger className={errors.technical_level ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Selecciona el nivel técnico" />
                  </SelectTrigger>
                  <SelectContent>
                    {TECHNICAL_LEVELS.map((level) => (
                      <SelectItem key={level.value} value={level.value}>
                        {level.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <p className="text-xs text-muted-foreground">
              Nivel de habilidades técnicas necesarias para completar la ruta
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
