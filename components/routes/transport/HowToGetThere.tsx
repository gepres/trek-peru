'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Map } from 'lucide-react';
import { useTransportSegments } from '@/presentation/hooks/useTransportSegments';
import { TransportSegmentCard } from './TransportSegmentCard';
import { FinalLegSuggestion } from './FinalLegSuggestion';

interface HowToGetThereProps {
  routeId: string;
  // Punto de encuentro de la ruta (formato igual al de MeetingPoint en types/database.types)
  meetingPoint?: {
    coordinates?: { latitude: number; longitude: number };
    name?: string;
  };
}

// Componente público de la sección "¿Cómo llegar?".
// Lista los tramos definidos por el creador + alternativas dinámicas.
// Si el último tramo tiene coordenadas y la ruta tiene meeting_point con coords,
// renderiza al final un FinalLegSuggestion calculado con Mapbox Directions.
export function HowToGetThere({ routeId, meetingPoint }: HowToGetThereProps) {
  const t = useTranslations('howToGetThere');
  const { segments, isLoading, error } = useTransportSegments(routeId);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          {error}
        </CardContent>
      </Card>
    );
  }

  if (segments.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Map className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
          <p className="text-muted-foreground">{t('empty')}</p>
        </CardContent>
      </Card>
    );
  }

  // Datos para tramo final automático con Mapbox
  const lastSegment = segments[segments.length - 1];
  const lastCoords = lastSegment?.to_coordinates;
  const meetingCoords = meetingPoint?.coordinates
    ? {
        lat: meetingPoint.coordinates.latitude,
        lng: meetingPoint.coordinates.longitude,
      }
    : undefined;

  const showFinalLeg =
    lastCoords &&
    meetingCoords &&
    // Sólo si el último segmento no termina ya en el punto de encuentro (~tolerancia ~50m)
    (Math.abs(lastCoords.lat - meetingCoords.lat) > 0.0005 ||
      Math.abs(lastCoords.lng - meetingCoords.lng) > 0.0005);

  return (
    <Card>
      <CardContent className="py-6">
        <div className="space-y-8">
          {segments.map((segment, i) => (
            <div key={segment.id} className="relative">
              {/* Línea conectora vertical entre pasos */}
              {i < segments.length - 1 && (
                <div className="absolute left-4 top-10 bottom-[-2rem] w-0.5 bg-border" />
              )}
              <TransportSegmentCard segment={segment} />
            </div>
          ))}

          {/* Tramo final automático sugerido por Mapbox */}
          {showFinalLeg && lastCoords && meetingCoords && (
            <div className="pl-10">
              <FinalLegSuggestion
                from={lastCoords}
                to={meetingCoords}
                toLabel={meetingPoint?.name ?? t('finalLeg.meetingPoint')}
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
