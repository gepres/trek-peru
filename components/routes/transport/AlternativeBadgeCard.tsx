'use client';

import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { Clock, Users, Sparkles, Globe } from 'lucide-react';
import type { AggregatedAlternative } from '@/types/transport.types';
import {
  MODE_ICONS,
  MODE_COLORS,
  formatCost,
  formatDuration,
} from './transport-helpers';
import { cn } from '@/lib/utils/cn';

interface AlternativeBadgeCardProps {
  alternative: AggregatedAlternative;
}

// Card compacta de alternativa sugerida dinámicamente (crowdsourced / IA / Rome2Rio).
// Más pequeña y con badge de fuente para diferenciarla de las opciones del creador.
export function AlternativeBadgeCard({ alternative }: AlternativeBadgeCardProps) {
  const t = useTranslations('howToGetThere');
  const Icon = MODE_ICONS[alternative.mode];

  const duration = formatDuration(alternative.duration_minutes);
  const cost = formatCost({
    costMin: alternative.cost_min,
    costMax: alternative.cost_max,
    currency: alternative.currency,
    // Las agregaciones no llevan cost_type — asumimos per_person para mostrar
    costType: 'per_person',
    freeLabel: t('free'),
    perPersonLabel: t('perPerson'),
    perVehicleLabel: t('perVehicle'),
    perGroupLabel: t('perGroup'),
  });

  const sourceBadge = () => {
    if (alternative.source === 'community') {
      return (
        <Badge
          variant="outline"
          className="text-[10px] gap-1 border-muted-foreground/30"
        >
          <Users className="h-2.5 w-2.5" />
          {t('sources.community', { count: alternative.sample_size })}
        </Badge>
      );
    }
    if (alternative.source === 'ai') {
      return (
        <Badge
          variant="outline"
          className="text-[10px] gap-1 border-purple-500/30 text-purple-600"
        >
          <Sparkles className="h-2.5 w-2.5" />
          {t('sources.ai')}
        </Badge>
      );
    }
    return (
      <Badge
        variant="outline"
        className="text-[10px] gap-1 border-blue-500/30 text-blue-600"
      >
        <Globe className="h-2.5 w-2.5" />
        {t('sources.rome2rio')}
      </Badge>
    );
  };

  return (
    <div className="rounded-lg border border-dashed border-muted-foreground/30 bg-muted/20 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className={cn(
              'h-8 w-8 rounded-md border flex items-center justify-center shrink-0',
              MODE_COLORS[alternative.mode],
            )}
          >
            <Icon className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium leading-tight">
              {t(`modes.${alternative.mode}`)}
              {alternative.operator && (
                <span className="text-muted-foreground font-normal">
                  {' · '}
                  {alternative.operator}
                </span>
              )}
            </p>
            <div className="flex items-center gap-x-3 text-xs text-muted-foreground mt-1">
              {duration && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {duration}
                </span>
              )}
              {cost && <span className="font-medium">{cost}</span>}
            </div>
          </div>
        </div>
        {sourceBadge()}
      </div>
    </div>
  );
}
