'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useTransportAlternatives } from '@/presentation/hooks/useTransportAlternatives';
import { ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AlternativeBadgeCard } from './AlternativeBadgeCard';
import type { TransportSegment } from '@/types/transport.types';

interface AlternativesPanelProps {
  segment: TransportSegment;
}

// Bloque colapsable de alternativas dinámicas para un segmento.
// Carga lazy al montar; si no hay resultados no se renderiza nada (silencioso).
export function AlternativesPanel({ segment }: AlternativesPanelProps) {
  const t = useTranslations('howToGetThere');
  const [isOpen, setIsOpen] = useState(false);
  const { alternatives, isLoading } = useTransportAlternatives(segment);

  // No mostramos el panel si está vacío y ya terminó de cargar (UX silenciosa)
  if (!isLoading && alternatives.length === 0) {
    return null;
  }

  return (
    <div className="mt-3">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {t('loadingAlternatives')}
          </>
        ) : (
          <>
            {isOpen ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
            {t('otherAlternatives', { count: alternatives.length })}
          </>
        )}
      </Button>

      {isOpen && !isLoading && (
        <div className="space-y-2 mt-2">
          {alternatives.map((alt, i) => (
            <AlternativeBadgeCard
              key={`${alt.mode}-${alt.currency}-${i}`}
              alternative={alt}
            />
          ))}
        </div>
      )}
    </div>
  );
}
