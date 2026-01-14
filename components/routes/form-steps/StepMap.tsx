'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RouteMapEditor } from '@/components/maps/RouteMapEditor';
import { Map } from 'lucide-react';
import { MeetingPoint, Waypoint } from '@/types/database.types';

interface StepMapProps {
  routeCoordinates: [number, number][];
  setRouteCoordinates: (coordinates: [number, number][]) => void;
  meetingPoint: MeetingPoint | null;
  setMeetingPoint: (point: MeetingPoint | null) => void;
  waypoints: Waypoint[];
  setWaypoints: (waypoints: Waypoint[]) => void;
}

export function StepMap({
  routeCoordinates,
  setRouteCoordinates,
  meetingPoint,
  setMeetingPoint,
  waypoints,
  setWaypoints,
}: StepMapProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Map className="h-5 w-5" />
            5. Mapa de la Ruta
          </CardTitle>
          <CardDescription>
            Dibuja la ruta en el mapa y marca puntos de interés (opcional)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Instrucciones */}
          <div className="p-4 rounded-lg bg-muted/50 border border-border space-y-2">
            <p className="text-sm font-medium">Instrucciones:</p>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>
                <strong>Punto de encuentro:</strong> Haz clic en el botón "Agregar Punto de Encuentro"
                y luego clic en el mapa donde será el punto de partida
              </li>
              <li>
                <strong>Dibujar ruta:</strong> Haz clic en "Dibujar Ruta" y marca los puntos
                del recorrido haciendo clic en el mapa
              </li>
              <li>
                <strong>Waypoints:</strong> Agrega puntos de interés importantes durante la ruta
                (miradores, campamentos, lagunas, etc.)
              </li>
            </ul>
          </div>

          {/* Mapa */}
          <div className="rounded-lg overflow-hidden border border-border">
            <RouteMapEditor
              initialRouteCoordinates={routeCoordinates}
              onRouteChange={setRouteCoordinates}
              initialMeetingPoint={meetingPoint || undefined}
              onMeetingPointChange={setMeetingPoint}
              initialWaypoints={waypoints}
              onWaypointsChange={setWaypoints}
            />
          </div>

          {/* Resumen */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3 rounded-lg bg-muted/30 border border-border">
              <p className="text-xs text-muted-foreground mb-1">Punto de Encuentro</p>
              <p className="text-sm font-medium">
                {meetingPoint ? (
                  <span className="text-green-600 dark:text-green-400">✓ Agregado</span>
                ) : (
                  <span className="text-muted-foreground">No agregado</span>
                )}
              </p>
            </div>

            <div className="p-3 rounded-lg bg-muted/30 border border-border">
              <p className="text-xs text-muted-foreground mb-1">Puntos de Ruta</p>
              <p className="text-sm font-medium">
                {routeCoordinates.length > 0 ? (
                  <span className="text-green-600 dark:text-green-400">
                    {routeCoordinates.length} puntos
                  </span>
                ) : (
                  <span className="text-muted-foreground">No dibujada</span>
                )}
              </p>
            </div>

            <div className="p-3 rounded-lg bg-muted/30 border border-border">
              <p className="text-xs text-muted-foreground mb-1">Waypoints</p>
              <p className="text-sm font-medium">
                {waypoints.length > 0 ? (
                  <span className="text-green-600 dark:text-green-400">
                    {waypoints.length} {waypoints.length === 1 ? 'punto' : 'puntos'}
                  </span>
                ) : (
                  <span className="text-muted-foreground">Ninguno</span>
                )}
              </p>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Este paso es opcional, pero agregar un mapa ayuda a los participantes a
            visualizar mejor la ruta y planificar su participación.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
