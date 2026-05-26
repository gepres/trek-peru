'use client';

import { useTranslations } from 'next-intl';
import { ArrowRight, Info } from 'lucide-react';
import type { TransportSegment } from '@/types/transport.types';
import { TransportOptionCard } from './TransportOptionCard';
import { AlternativesPanel } from './AlternativesPanel';

interface TransportSegmentCardProps {
  segment: TransportSegment;
}

// Card de un segmento completo: cabecera A→B + opciones del creador + alternativas dinámicas.
export function TransportSegmentCard({ segment }: TransportSegmentCardProps) {
  const t = useTranslations('howToGetThere');

  return (
    <div className="relative pl-10">
      {/* Número del paso */}
      <div className="absolute left-0 top-0 h-8 w-8 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center font-bold">
        {segment.order_index}
      </div>

      {/* Cabecera A → B */}
      <div className="mb-3">
        {segment.title ? (
          <h3 className="font-semibold text-base mb-1">{segment.title}</h3>
        ) : null}
        <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
          <span className="font-medium text-foreground">
            {segment.from_label}
          </span>
          <ArrowRight className="h-4 w-4 shrink-0" />
          <span className="font-medium text-foreground">
            {segment.to_label}
          </span>
        </div>
        {segment.notes && (
          <p className="text-xs text-muted-foreground mt-2 flex items-start gap-1.5">
            <Info className="h-3 w-3 mt-0.5 shrink-0" />
            <span className="whitespace-pre-wrap">{segment.notes}</span>
          </p>
        )}
      </div>

      {/* Opciones del creador */}
      {segment.options.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
            {t('suggestedByOrganizer')}
          </p>
          {segment.options.map((option) => (
            <TransportOptionCard key={option.id} option={option} />
          ))}
        </div>
      )}

      {/* Flujo dinámico: alternativas crowdsourced */}
      <AlternativesPanel segment={segment} />
    </div>
  );
}
