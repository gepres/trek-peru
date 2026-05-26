'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { Loader2, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { Switch } from '@/components/ui/switch';
import {
  transportOptionSchema,
  type TransportOptionInput,
} from '@/lib/validations/transport.schema';
import type {
  TransportOption,
  TransportOptionForm as TOForm,
  TransportMode,
  CostType,
  TimeMode,
  TransportCurrency,
} from '@/types/transport.types';
import { TRANSPORT_MODES } from '@/types/transport.types';

interface TransportOptionFormProps {
  initial?: TransportOption | null;
  isSaving?: boolean;
  onSubmit: (data: TOForm) => Promise<void>;
  onCancel: () => void;
}

const COST_TYPES: CostType[] = ['per_person', 'per_vehicle', 'per_group', 'free'];
const TIME_MODES: TimeMode[] = ['exact', 'approximate', 'range'];
const CURRENCIES: TransportCurrency[] = ['PEN', 'USD'];

export function TransportOptionForm({
  initial,
  isSaving,
  onSubmit,
  onCancel,
}: TransportOptionFormProps) {
  const t = useTranslations('howToGetThere');
  const tForm = useTranslations('howToGetThere.form');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<TransportOptionInput>({
    resolver: zodResolver(transportOptionSchema),
    defaultValues: initial
      ? {
          mode: initial.mode,
          operator: initial.operator,
          class: initial.class,
          time_mode: initial.time_mode,
          departure_time: initial.departure_time,
          arrival_time: initial.arrival_time,
          duration_minutes: initial.duration_minutes,
          cost_type: initial.cost_type,
          cost_min: initial.cost_min,
          cost_max: initial.cost_max,
          currency: initial.currency,
          frequency: initial.frequency,
          booking_location: initial.booking_location,
          booking_url: initial.booking_url,
          is_recommended: initial.is_recommended,
          notes: initial.notes,
        }
      : {
          mode: 'bus',
          time_mode: 'approximate',
          cost_type: 'per_person',
          currency: 'PEN',
          is_recommended: false,
        },
  });

  const mode = watch('mode');
  const timeMode = watch('time_mode');
  const costType = watch('cost_type');
  const currency = watch('currency');
  const isRecommended = watch('is_recommended');

  const handleFormSubmit = handleSubmit(async (raw) => {
    // Re-parseamos con Zod para obtener el tipo OUTPUT (con defaults aplicados
    // y campos opcionales correctamente tipados como string|undefined en vez
    // de unknown). zodResolver ya validó, así que .parse() nunca tirará.
    const parsed = transportOptionSchema.parse(raw);
    await onSubmit(parsed as TOForm);
  });

  return (
    <form
      onSubmit={handleFormSubmit}
      className="space-y-4 p-4 border rounded-lg bg-muted/30"
    >
      {/* Modo + operador */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>{tForm('mode')}</Label>
          <Select
            value={mode}
            onValueChange={(v) => setValue('mode', v as TransportMode)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TRANSPORT_MODES.map((m) => (
                <SelectItem key={m} value={m}>
                  {t(`modes.${m}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>{tForm('operator')}</Label>
          <Input {...register('operator')} placeholder="Cruz del Sur, LATAM…" />
        </div>
      </div>

      {/* Clase + frecuencia */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>{tForm('class')}</Label>
          <Input {...register('class')} placeholder={tForm('classPlaceholder')} />
        </div>
        <div className="space-y-1.5">
          <Label>{tForm('frequency')}</Label>
          <Input
            {...register('frequency')}
            placeholder={tForm('frequencyPlaceholder')}
          />
        </div>
      </div>

      {/* Horarios */}
      <div className="space-y-3">
        <Label>{tForm('schedule')}</Label>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="space-y-1.5 sm:col-span-1">
            <Label className="text-xs text-muted-foreground">
              {tForm('timeMode')}
            </Label>
            <Select
              value={timeMode}
              onValueChange={(v) => setValue('time_mode', v as TimeMode)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIME_MODES.map((tm) => (
                  <SelectItem key={tm} value={tm}>
                    {tForm(`timeModes.${tm}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              {tForm('departureTime')}
            </Label>
            <Input
              {...register('departure_time')}
              placeholder="06:30"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              {tForm('arrivalTime')}
            </Label>
            <Input
              {...register('arrival_time')}
              placeholder="09:30"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              {tForm('durationMinutes')}
            </Label>
            <Input
              type="number"
              {...register('duration_minutes', { valueAsNumber: true })}
              placeholder="180"
            />
          </div>
        </div>
      </div>

      {/* Costo */}
      <div className="space-y-3">
        <Label>{tForm('cost')}</Label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              {tForm('costType')}
            </Label>
            <Select
              value={costType}
              onValueChange={(v) => setValue('cost_type', v as CostType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COST_TYPES.map((ct) => (
                  <SelectItem key={ct} value={ct}>
                    {tForm(`costTypes.${ct}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {costType !== 'free' && (
            <>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  {tForm('costMin')}
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  {...register('cost_min', { valueAsNumber: true })}
                  placeholder="25"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  {tForm('costMax')}
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  {...register('cost_max', { valueAsNumber: true })}
                  placeholder="40"
                />
                {errors.cost_max && (
                  <p className="text-xs text-red-500">
                    {errors.cost_max.message as string}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  {tForm('currency')}
                </Label>
                <Select
                  value={currency}
                  onValueChange={(v) =>
                    setValue('currency', v as TransportCurrency)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Logística: lugar de compra + link */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>{tForm('bookingLocation')}</Label>
          <Input
            {...register('booking_location')}
            placeholder={tForm('bookingLocationPlaceholder')}
          />
        </div>
        <div className="space-y-1.5">
          <Label>{tForm('bookingUrl')}</Label>
          <Input
            {...register('booking_url')}
            placeholder="https://..."
            type="url"
          />
          {errors.booking_url && (
            <p className="text-xs text-red-500">
              {errors.booking_url.message as string}
            </p>
          )}
        </div>
      </div>

      {/* Notas */}
      <div className="space-y-1.5">
        <Label>{tForm('notes')}</Label>
        <Textarea
          {...register('notes')}
          placeholder={tForm('notesPlaceholder')}
          rows={2}
        />
      </div>

      {/* Recomendado */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-background border">
        <div>
          <Label className="cursor-pointer">{tForm('isRecommended')}</Label>
          <p className="text-xs text-muted-foreground">
            {tForm('isRecommendedHint')}
          </p>
        </div>
        <Switch
          checked={isRecommended}
          onCheckedChange={(v) => setValue('is_recommended', v)}
        />
      </div>

      {/* Acciones */}
      <div className="flex justify-end gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSaving}
        >
          <X className="h-4 w-4 mr-2" />
          {tForm('cancel')}
        </Button>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {tForm('save')}
        </Button>
      </div>
    </form>
  );
}
