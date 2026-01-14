'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DailyItinerary, type DayItinerary } from '../DailyItinerary';
import { Clock, Calendar } from 'lucide-react';
import { UseFormRegister, FieldErrors, UseFormWatch, UseFormSetValue } from 'react-hook-form';
import { RouteFormInput } from '@/lib/validations/route.schema';

interface StepBasicInfoProps {
  register: UseFormRegister<RouteFormInput>;
  errors: FieldErrors<RouteFormInput>;
  watch: UseFormWatch<RouteFormInput>;
  setValue: UseFormSetValue<RouteFormInput>;
  durationType: 'hours' | 'days';
  durationValue: number;
  onDurationTypeChange: (type: 'hours' | 'days') => void;
  dailyItinerary: DayItinerary[];
  setDailyItinerary: (itinerary: DayItinerary[]) => void;
}

export function StepBasicInfo({
  register,
  errors,
  watch,
  setValue,
  durationType,
  durationValue,
  onDurationTypeChange,
  dailyItinerary,
  setDailyItinerary,
}: StepBasicInfoProps) {
  const regiones = [
    'Cusco', 'Ancash', 'Arequipa', 'Puno', 'Lima', 'Junín', 'Huánuco',
    'Ayacucho', 'Apurímac', 'Huancavelica', 'Cajamarca', 'La Libertad',
    'Amazonas', 'Pasco', 'San Martín', 'Moquegua', 'Tacna', 'Ica'
  ];

  const handleDurationValueChange = (value: number) => {
    setValue('duration_value', value);

    // Si es por días y hay más de 1 día, inicializar itinerario
    if (durationType === 'days' && value > 1) {
      const itinerary: DayItinerary[] = Array.from({ length: value }, (_, i) => {
        const existing = dailyItinerary.find(d => d.day === i + 1);
        return existing || {
          day: i + 1,
          title: `Día ${i + 1}`,
          description: '',
        };
      });
      setDailyItinerary(itinerary);
      setValue('daily_itinerary', itinerary);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>1. Información Básica</CardTitle>
          <CardDescription>
            Completa los datos esenciales de la ruta de trekking
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Título */}
          <div className="space-y-2">
            <Label htmlFor="title">
              Título de la Ruta <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              {...register('title')}
              placeholder="Ej: Camino Inca a Machu Picchu"
              className={errors.title ? 'border-destructive' : ''}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          {/* Descripción */}
          <div className="space-y-2">
            <Label htmlFor="description">
              Descripción <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Describe la ruta, sus atractivos, nivel de dificultad y qué pueden esperar los participantes..."
              rows={5}
              className={errors.description ? 'border-destructive' : ''}
            />
            <p className="text-xs text-muted-foreground">
              Mínimo 20 caracteres. Sé descriptivo para atraer participantes.
            </p>
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Dificultad */}
            <div className="space-y-2">
              <Label htmlFor="difficulty">
                Dificultad <span className="text-destructive">*</span>
              </Label>
              <Select
                defaultValue={watch('difficulty')}
                onValueChange={(value: any) => setValue('difficulty', value)}
              >
                <SelectTrigger className={errors.difficulty ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Selecciona dificultad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Fácil</SelectItem>
                  <SelectItem value="moderate">Moderado</SelectItem>
                  <SelectItem value="hard">Difícil</SelectItem>
                  <SelectItem value="extreme">Extremo</SelectItem>
                </SelectContent>
              </Select>
              {errors.difficulty && (
                <p className="text-sm text-destructive">{errors.difficulty.message}</p>
              )}
            </div>

            {/* Región */}
            <div className="space-y-2">
              <Label htmlFor="region">
                Región <span className="text-destructive">*</span>
              </Label>
              <Select
                defaultValue={watch('region')}
                onValueChange={(value) => setValue('region', value)}
              >
                <SelectTrigger className={errors.region ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Selecciona región" />
                </SelectTrigger>
                <SelectContent>
                  {regiones.map((region) => (
                    <SelectItem key={region} value={region}>
                      {region}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.region && (
                <p className="text-sm text-destructive">{errors.region.message}</p>
              )}
            </div>

            {/* Provincia */}
            <div className="space-y-2">
              <Label htmlFor="province">
                Provincia
              </Label>
              <Input
                id="province"
                {...register('province')}
                placeholder="Ej: Urubamba"
                className={errors.province ? 'border-destructive' : ''}
              />
              {errors.province && (
                <p className="text-sm text-destructive">{errors.province.message}</p>
              )}
            </div>
          </div>

          {/* Duración */}
          <div className="space-y-4">
            <Label>Duración <span className="text-destructive">*</span></Label>

            {/* Selector de tipo */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => onDurationTypeChange('hours')}
                className={`flex-1 p-4 border-2 rounded-lg transition-all ${
                  durationType === 'hours'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Clock className="h-5 w-5" />
                  <span className="font-semibold">Por Horas</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Para caminatas de un día
                </p>
              </button>

              <button
                type="button"
                onClick={() => onDurationTypeChange('days')}
                className={`flex-1 p-4 border-2 rounded-lg transition-all ${
                  durationType === 'days'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Calendar className="h-5 w-5" />
                  <span className="font-semibold">Por Días</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Para expediciones multi-día
                </p>
              </button>
            </div>

            {/* Input de valor */}
            <div className="space-y-2">
              <Label htmlFor="duration_value">
                {durationType === 'hours' ? 'Horas' : 'Días'}
              </Label>
              <Input
                id="duration_value"
                type="number"
                min="1"
                {...register('duration_value', { valueAsNumber: true })}
                onChange={(e) => handleDurationValueChange(Number(e.target.value))}
                placeholder={durationType === 'hours' ? 'Ej: 6' : 'Ej: 4'}
                className={errors.duration_value ? 'border-destructive' : ''}
              />
              {errors.duration_value && (
                <p className="text-sm text-destructive">{errors.duration_value.message}</p>
              )}
            </div>
          </div>

          {/* Itinerario diario (solo si es por días y más de 1 día) */}
          {durationType === 'days' && durationValue > 1 && (
            <div className="mt-6 p-6 border rounded-lg bg-muted/30">
              <DailyItinerary
                totalDays={durationValue}
                value={dailyItinerary}
                onChange={(itinerary) => {
                  setDailyItinerary(itinerary);
                  setValue('daily_itinerary', itinerary);
                }}
              />
              {errors.daily_itinerary && (
                <p className="text-sm text-destructive mt-2">
                  {errors.daily_itinerary.message}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
