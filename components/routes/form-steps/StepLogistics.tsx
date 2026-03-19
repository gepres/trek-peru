'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar, Clock, Users, DollarSign } from 'lucide-react';
import { UseFormRegister, FieldErrors, UseFormWatch } from 'react-hook-form';
import { RouteFormInput } from '@/lib/validations/route.schema';
import { useTranslations } from 'next-intl';

interface StepLogisticsProps {
  register: UseFormRegister<RouteFormInput>;
  errors: FieldErrors<RouteFormInput>;
  watch: UseFormWatch<RouteFormInput>;
}

export function StepLogistics({ register, errors, watch }: StepLogisticsProps) {
  const t = useTranslations('routeForm');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('step2Title')}</CardTitle>
          <CardDescription>
            {t('step2Desc')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Fecha de salida */}
            <div className="space-y-2">
              <Label htmlFor="departure_date" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {t('departureDate')}
              </Label>
              <Input
                id="departure_date"
                type="date"
                {...register('departure_date')}
                className={errors.departure_date ? 'border-destructive' : ''}
              />
              {errors.departure_date && (
                <p className="text-sm text-destructive">{errors.departure_date.message}</p>
              )}
            </div>

            {/* Hora de encuentro */}
            <div className="space-y-2">
              <Label htmlFor="meeting_time" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {t('meetingTime')}
              </Label>
              <Input
                id="meeting_time"
                type="time"
                {...register('meeting_time')}
                className={errors.meeting_time ? 'border-destructive' : ''}
              />
              {errors.meeting_time && (
                <p className="text-sm text-destructive">{errors.meeting_time.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Capacidad máxima */}
            <div className="space-y-2">
              <Label htmlFor="max_capacity" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                {t('maxCapacity')}
              </Label>
              <Input
                id="max_capacity"
                type="number"
                min="1"
                {...register('max_capacity', { valueAsNumber: true })}
                placeholder={t('maxCapacityPlaceholder')}
                className={errors.max_capacity ? 'border-destructive' : ''}
              />
              <p className="text-xs text-muted-foreground">
                {t('maxCapacityHint')}
              </p>
              {errors.max_capacity && (
                <p className="text-sm text-destructive">{errors.max_capacity.message}</p>
              )}
            </div>

            {/* Costo */}
            <div className="space-y-2">
              <Label htmlFor="cost" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                {t('costPerPerson')}
              </Label>
              <div className="flex gap-2">
                <Input
                  id="cost"
                  type="number"
                  min="0"
                  step="0.01"
                  {...register('cost', { valueAsNumber: true })}
                  placeholder={t('costPlaceholder')}
                  className={errors.cost ? 'border-destructive' : ''}
                />
                <Select
                  defaultValue={watch('currency')}
                  onValueChange={(value) => {
                    // Note: setValue would need to be passed as prop
                    // For now, using defaultValue
                  }}
                >
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PEN">PEN</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-muted-foreground">
                {t('costFreeHint')}
              </p>
              {errors.cost && (
                <p className="text-sm text-destructive">{errors.cost.message}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
