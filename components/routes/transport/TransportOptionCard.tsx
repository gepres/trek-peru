'use client';

import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { Star, Clock, MapPin, ExternalLink, Calendar, Info } from 'lucide-react';
import type { TransportOption } from '@/types/transport.types';
import {
  MODE_ICONS,
  MODE_COLORS,
  formatCost,
  formatDuration,
  formatTime,
} from './transport-helpers';
import { cn } from '@/lib/utils/cn';

interface TransportOptionCardProps {
  option: TransportOption;
}

// Card individual de una opción de transporte (vista pública, read-only).
export function TransportOptionCard({ option }: TransportOptionCardProps) {
  const t = useTranslations('howToGetThere');
  const Icon = MODE_ICONS[option.mode];

  const duration = formatDuration(option.duration_minutes);
  const dep = formatTime(option.departure_time, option.time_mode);
  const arr = formatTime(option.arrival_time, option.time_mode);

  const cost = formatCost({
    costMin: option.cost_min,
    costMax: option.cost_max,
    currency: option.currency,
    costType: option.cost_type,
    freeLabel: t('free'),
    perPersonLabel: t('perPerson'),
    perVehicleLabel: t('perVehicle'),
    perGroupLabel: t('perGroup'),
  });

  return (
    <div
      className={cn(
        'rounded-xl border bg-card p-4 transition-shadow hover:shadow-sm',
        option.is_recommended && 'border-emerald-500/40 ring-1 ring-emerald-500/20',
      )}
    >
      {/* Cabecera: modo + operador + recomendado */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className={cn(
              'h-9 w-9 rounded-lg border flex items-center justify-center shrink-0',
              MODE_COLORS[option.mode],
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm leading-tight">
              {t(`modes.${option.mode}`)}
              {option.operator && (
                <span className="text-muted-foreground font-normal">
                  {' · '}
                  {option.operator}
                </span>
              )}
            </p>
            {option.class && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {option.class}
              </p>
            )}
          </div>
        </div>
        {option.is_recommended && (
          <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 border shrink-0">
            <Star className="h-3 w-3 mr-1 fill-current" />
            {t('recommended')}
          </Badge>
        )}
      </div>

      {/* Línea de tiempo: salida → duración → llegada */}
      {(dep || arr || duration) && (
        <div className="flex items-center gap-2 text-sm mb-3">
          {dep && <span className="font-medium">{dep}</span>}
          <span className="flex-1 flex items-center gap-1 text-muted-foreground">
            <span className="flex-1 border-t border-dashed border-muted-foreground/30" />
            {duration && (
              <span className="text-xs whitespace-nowrap px-2 py-0.5 rounded bg-muted">
                <Clock className="h-3 w-3 inline mr-1" />
                {duration}
              </span>
            )}
            <span className="flex-1 border-t border-dashed border-muted-foreground/30" />
          </span>
          {arr && <span className="font-medium">{arr}</span>}
        </div>
      )}

      {/* Costo + frecuencia */}
      {(cost || option.frequency) && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm mb-2">
          {cost && (
            <span className="font-semibold text-foreground">{cost}</span>
          )}
          {option.frequency && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {option.frequency}
            </span>
          )}
        </div>
      )}

      {/* Lugar de compra + link */}
      {(option.booking_location || option.booking_url) && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground mb-2">
          {option.booking_location && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {option.booking_location}
            </span>
          )}
          {option.booking_url && (
            <a
              href={option.booking_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary hover:underline"
            >
              <ExternalLink className="h-3 w-3" />
              {t('book')}
            </a>
          )}
        </div>
      )}

      {/* Notas */}
      {option.notes && (
        <div className="flex items-start gap-2 text-xs text-muted-foreground mt-2 pt-2 border-t">
          <Info className="h-3 w-3 mt-0.5 shrink-0" />
          <span className="whitespace-pre-wrap">{option.notes}</span>
        </div>
      )}
    </div>
  );
}
