'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { Loader2, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  transportSegmentSchema,
  type TransportSegmentInput,
} from '@/lib/validations/transport.schema';
import type {
  TransportSegment,
  TransportSegmentForm as TSForm,
  Coordinates,
} from '@/types/transport.types';
import { LocationAutocomplete } from './LocationAutocomplete';

interface TransportSegmentFormProps {
  initial?: TransportSegment | null;
  isSaving?: boolean;
  onSubmit: (data: TSForm) => Promise<void>;
  onCancel: () => void;
}

// Form para crear/editar un segmento.
// from_label / to_label usan LocationAutocomplete con Mapbox Geocoding —
// captura coordenadas opcionales que se persisten en from_coordinates / to_coordinates
// para habilitar el tramo final automático con Mapbox Directions.
export function TransportSegmentForm({
  initial,
  isSaving,
  onSubmit,
  onCancel,
}: TransportSegmentFormProps) {
  const tForm = useTranslations('howToGetThere.form');

  // Coordenadas en estado local — RHF maneja los labels, el form las inyecta al submit
  const [fromCoords, setFromCoords] = useState<Coordinates | undefined>(
    initial?.from_coordinates,
  );
  const [toCoords, setToCoords] = useState<Coordinates | undefined>(
    initial?.to_coordinates,
  );

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TransportSegmentInput>({
    resolver: zodResolver(transportSegmentSchema),
    defaultValues: initial
      ? {
          title: initial.title,
          from_label: initial.from_label,
          to_label: initial.to_label,
          notes: initial.notes,
        }
      : { from_label: '', to_label: '' },
  });

  const fromLabel = watch('from_label') ?? '';
  const toLabel = watch('to_label') ?? '';

  const submit = handleSubmit(async (raw) => {
    const parsed = transportSegmentSchema.parse(raw);
    await onSubmit({
      ...parsed,
      from_coordinates: fromCoords,
      to_coordinates: toCoords,
    } as TSForm);
  });

  return (
    <form
      onSubmit={submit}
      className="space-y-4 p-4 border rounded-lg bg-muted/30"
    >
      <div className="space-y-1.5">
        <Label>{tForm('segmentTitle')}</Label>
        <Input
          {...register('title')}
          placeholder={tForm('segmentTitlePlaceholder')}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="seg-from">
            {tForm('from')} <span className="text-red-500">*</span>
          </Label>
          <LocationAutocomplete
            inputId="seg-from"
            value={fromLabel}
            initialCoordinates={initial?.from_coordinates}
            onChange={(label, coords) => {
              setValue('from_label', label, { shouldValidate: true });
              setFromCoords(coords);
            }}
            placeholder="Cusco"
            disabled={isSaving}
          />
          {errors.from_label && (
            <p className="text-xs text-red-500">
              {errors.from_label.message as string}
            </p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="seg-to">
            {tForm('to')} <span className="text-red-500">*</span>
          </Label>
          <LocationAutocomplete
            inputId="seg-to"
            value={toLabel}
            initialCoordinates={initial?.to_coordinates}
            // Priorizar resultados cercanos al origen si ya hay coords
            proximity={fromCoords}
            onChange={(label, coords) => {
              setValue('to_label', label, { shouldValidate: true });
              setToCoords(coords);
            }}
            placeholder="Tinki"
            disabled={isSaving}
          />
          {errors.to_label && (
            <p className="text-xs text-red-500">
              {errors.to_label.message as string}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>{tForm('segmentNotes')}</Label>
        <Textarea
          {...register('notes')}
          placeholder={tForm('segmentNotesPlaceholder')}
          rows={2}
        />
      </div>

      <div className="flex justify-end gap-2">
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
