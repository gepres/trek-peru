'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { RouteMapEditor } from '@/components/maps/RouteMapEditor';
import { Map, Link as LinkIcon, Wand2, MapPin } from 'lucide-react';
import { MeetingPoint, Waypoint } from '@/types/database.types';
import { UseFormRegister, FieldErrors, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import { RouteFormInput } from '@/lib/validations/route.schema';

interface StepMapProps {
  routeCoordinates: [number, number][];
  setRouteCoordinates: (coordinates: [number, number][]) => void;
  meetingPoint: MeetingPoint | null;
  setMeetingPoint: (point: MeetingPoint | null) => void;
  waypoints: Waypoint[];
  setWaypoints: (waypoints: Waypoint[]) => void;
  register: UseFormRegister<RouteFormInput>;
  errors: FieldErrors<RouteFormInput>;
  setValue: UseFormSetValue<RouteFormInput>;
  watch: UseFormWatch<RouteFormInput>;
}

export function StepMap({
  routeCoordinates,
  setRouteCoordinates,
  meetingPoint,
  setMeetingPoint,
  waypoints,
  setWaypoints,
  register,
  errors,
  setValue,
  watch,
}: StepMapProps) {
  // Estado local para los inputs lat/lng del generador de link
  const [geoLat, setGeoLat] = useState('');
  const [geoLng, setGeoLng] = useState('');
  const [geoError, setGeoError] = useState('');

  // Genera el link de Google Maps con las coordenadas ingresadas
  function handleGenerateLink() {
    setGeoError('');
    if (!geoLat || !geoLng) {
      setGeoError('Ingresa la latitud y longitud');
      return;
    }
    const lat = parseFloat(geoLat);
    const lng = parseFloat(geoLng);
    if (isNaN(lat) || isNaN(lng)) {
      setGeoError('Valores inválidos — usa formato numérico, ej: -9.19');
      return;
    }
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      setGeoError('Coordenadas fuera de rango válido');
      return;
    }
    setValue('google_maps_link', `https://www.google.com/maps?q=${lat},${lng}`);
  }

  // Rellena lat/lng desde el punto de encuentro marcado en el mapa
  function fillFromMeetingPoint() {
    if (meetingPoint?.coordinates) {
      setGeoLat(meetingPoint.coordinates.latitude.toString());
      setGeoLng(meetingPoint.coordinates.longitude.toString());
      setGeoError('');
    }
  }

  // Rellena lat/lng desde el primer punto de la ruta dibujada
  function fillFromRouteStart() {
    if (routeCoordinates.length > 0) {
      const [lng, lat] = routeCoordinates[0];
      setGeoLat(lat.toString());
      setGeoLng(lng.toString());
      setGeoError('');
    }
  }

  const googleMapsLink = watch('google_maps_link');

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
                <strong>Punto de encuentro:</strong> Haz clic en el botón &quot;Punto de encuentro&quot;
                y luego clic en el mapa donde será el punto de partida
              </li>
              <li>
                <strong>Dibujar ruta:</strong> Haz clic en &quot;Dibujar ruta&quot; y marca los puntos
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

          {/* ── Link de Google Maps ── */}
          <div className="space-y-3 pt-2 border-t border-border">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <LinkIcon className="h-4 w-4" />
              Link de Google Maps
            </Label>

            {/* Generador automático */}
            <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
              <p className="text-xs font-medium text-muted-foreground">
                Generar link automáticamente con coordenadas:
              </p>

              {/* Accesos rápidos: punto de encuentro / inicio de ruta */}
              {(meetingPoint?.coordinates || routeCoordinates.length > 0) && (
                <div className="flex flex-wrap gap-2">
                  {meetingPoint?.coordinates && (
                    <button
                      type="button"
                      onClick={fillFromMeetingPoint}
                      className="flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      <MapPin className="h-3 w-3" />
                      Usar punto de encuentro
                    </button>
                  )}
                  {routeCoordinates.length > 0 && (
                    <button
                      type="button"
                      onClick={fillFromRouteStart}
                      className="flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      <Map className="h-3 w-3" />
                      Usar inicio de ruta
                    </button>
                  )}
                </div>
              )}

              {/* Inputs de lat/lng */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="geo-lat" className="text-xs">Latitud</Label>
                  <Input
                    id="geo-lat"
                    type="text"
                    value={geoLat}
                    onChange={(e) => { setGeoLat(e.target.value); setGeoError(''); }}
                    placeholder="Ej: -9.19"
                    className="text-sm"
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleGenerateLink(); } }}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="geo-lng" className="text-xs">Longitud</Label>
                  <Input
                    id="geo-lng"
                    type="text"
                    value={geoLng}
                    onChange={(e) => { setGeoLng(e.target.value); setGeoError(''); }}
                    placeholder="Ej: -75.01"
                    className="text-sm"
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleGenerateLink(); } }}
                  />
                </div>
              </div>

              {geoError && (
                <p className="text-xs text-destructive">{geoError}</p>
              )}

              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleGenerateLink}
                disabled={!geoLat || !geoLng}
                className="w-full sm:w-auto"
              >
                <Wand2 className="h-3.5 w-3.5 mr-1.5" />
                Generar link de Google Maps
              </Button>
            </div>

            {/* Input manual */}
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">
                O ingresa el link manualmente:
              </p>
              <Input
                type="url"
                {...register('google_maps_link')}
                placeholder="https://maps.google.com/..."
                className={errors.google_maps_link ? 'border-destructive' : ''}
              />
              {errors.google_maps_link && (
                <p className="text-xs text-destructive">{errors.google_maps_link.message}</p>
              )}
            </div>

            {/* Vista previa del link generado */}
            {googleMapsLink && (
              <a
                href={googleMapsLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-primary hover:underline break-all"
              >
                <LinkIcon className="h-3 w-3 shrink-0" />
                {googleMapsLink}
              </a>
            )}
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
