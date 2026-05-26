'use client';

import { useTranslations } from 'next-intl';
import { Car, Footprints, Loader2, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useFinalLegDirection } from '@/presentation/hooks/useFinalLegDirection';
import type { Coordinates } from '@/types/transport.types';
import type { DirectionsProfile } from '@/lib/mapbox/directions';
import { formatDuration } from './transport-helpers';
import { FinalLegMap } from './FinalLegMap';

interface FinalLegSuggestionProps {
  // Último punto del recorrido manual (último to_coordinates)
  from: Coordinates;
  // Punto de encuentro de la ruta
  to: Coordinates;
  toLabel: string;
  // Por defecto driving — el creador puede sugerir walking si está cerca
  profile?: DirectionsProfile;
}

// Sugerencia automática del tramo final desde el último punto definido hasta
// el meeting_point de la ruta. Calculado en runtime con Mapbox Directions.
export function FinalLegSuggestion({
  from,
  to,
  toLabel,
  profile = 'driving',
}: FinalLegSuggestionProps) {
  const t = useTranslations('howToGetThere');
  const { result, isLoading } = useFinalLegDirection({
    from,
    to,
    profile,
    includeGeometry: true,
  });

  if (isLoading) {
    return (
      <div className="rounded-lg border border-dashed border-blue-500/30 bg-blue-500/5 p-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          {t('finalLeg.computing')}
        </div>
      </div>
    );
  }

  if (!result) return null;

  const Icon = profile === 'walking' ? Footprints : Car;
  const km = (result.distanceMeters / 1000).toFixed(1);
  const duration = formatDuration(Math.round(result.durationSeconds / 60));

  return (
    <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 p-4">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-9 w-9 rounded-lg border border-blue-500/30 bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm leading-tight">
              {t('finalLeg.title')}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t(`finalLeg.${profile}`)} → {toLabel}
            </p>
          </div>
        </div>
        <Badge
          variant="outline"
          className="text-[10px] gap-1 border-blue-500/30 text-blue-600"
        >
          <Sparkles className="h-2.5 w-2.5" />
          {t('finalLeg.mapboxBadge')}
        </Badge>
      </div>

      <div className="flex items-center gap-x-4 text-sm text-muted-foreground pl-11 mb-3">
        {duration && <span className="font-medium">{duration}</span>}
        <span>{km} km</span>
      </div>

      {/* Mini-mapa con la geometría del tramo */}
      {result.geometry && (
        <FinalLegMap from={from} to={to} geometry={result.geometry} />
      )}
    </div>
  );
}
