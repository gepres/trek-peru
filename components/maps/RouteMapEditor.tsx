'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MeetingPoint, Waypoint } from '@/types/database.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { GPXUpload } from '@/components/shared/GPXUpload';
import { MapSearch } from './MapSearch';
import { CoordinateInput } from './CoordinateInput';
import { exportToGPX, downloadGPX } from '@/lib/utils/gpx-parser';
import { MapPin, Navigation, Trash2, Save, Download } from 'lucide-react';

interface RouteMapEditorProps {
  // Coordenadas iniciales de la ruta como array [lng, lat][]
  initialRouteCoordinates?: [number, number][];
  initialMeetingPoint?: MeetingPoint;
  initialWaypoints?: Waypoint[];
  onRouteChange?: (coordinates: [number, number][]) => void;
  onMeetingPointChange?: (meetingPoint: MeetingPoint | null) => void;
  onWaypointsChange?: (waypoints: Waypoint[]) => void;
  className?: string;
  height?: string;
}

type EditorMode = 'route' | 'meeting' | 'waypoint' | null;

// Componente para editar rutas en mapa de Mapbox
export function RouteMapEditor({
  initialRouteCoordinates,
  initialMeetingPoint,
  initialWaypoints = [],
  onRouteChange,
  onMeetingPointChange,
  onWaypointsChange,
  className = '',
  height = '500px',
}: RouteMapEditorProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [editorMode, setEditorMode] = useState<EditorMode>(null);
  // Inicializar desde prop para que edición cargue las coordenadas existentes sin esperar el useEffect
  const [routePoints, setRoutePoints] = useState<[number, number][]>(initialRouteCoordinates || []);
  const [meetingPoint, setMeetingPoint] = useState<MeetingPoint | null>(initialMeetingPoint || null);
  const [waypoints, setWaypoints] = useState<Waypoint[]>(initialWaypoints);
  const [waypointName, setWaypointName] = useState('');
  // Ref para que el click handler del mapa lea siempre el nombre más reciente
  // sin necesitar re-crear el listener en cada pulsación de tecla (stale closure)
  const waypointNameRef = useRef('');
  // Refs para que map.on('load') siempre lea los datos actuales sin stale closure:
  // el callback de 'load' es asíncrono y captura el estado del primer render,
  // por eso necesitamos refs que se sincronizan con el estado en cada render.
  const routePointsRef = useRef<[number, number][]>(initialRouteCoordinates || []);
  const meetingPointRef = useRef<MeetingPoint | null>(initialMeetingPoint || null);
  const waypointsDataRef = useRef<Waypoint[]>(initialWaypoints);
  const markers = useRef<mapboxgl.Marker[]>([]);
  const meetingMarker = useRef<mapboxgl.Marker | null>(null);
  const [gpxError, setGpxError] = useState<string | null>(null);

  // Sincronizar ref con state para que el click handler siempre lea el valor actual
  useEffect(() => {
    waypointNameRef.current = waypointName;
  }, [waypointName]);

  // Mantener refs sincronizadas con el estado para que map.on('load') use datos frescos
  useEffect(() => { routePointsRef.current = routePoints; }, [routePoints]);
  useEffect(() => { meetingPointRef.current = meetingPoint; }, [meetingPoint]);
  useEffect(() => { waypointsDataRef.current = waypoints; }, [waypoints]);

  // Observar cambios de tamaño del contenedor (cuando el paso del formulario
  // se vuelve visible desde un estado oculto) y llamar map.resize() para que
  // Mapbox recalcule sus dimensiones y el canvas no quede en posición 0,0.
  useEffect(() => {
    if (!mapContainer.current) return;

    const observer = new ResizeObserver(() => {
      if (map.current) {
        map.current.resize();
      }
    });

    observer.observe(mapContainer.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

    if (!mapboxToken) {
      console.warn('Mapbox token no configurado');
      return;
    }

    if (!mapContainer.current) return;

    mapboxgl.accessToken = mapboxToken;

    // Inicializar con coordenadas de Perú por defecto
    const defaultCenter: [number, number] = [-75.0152, -9.19];

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/outdoors-v12',
      center: defaultCenter,
      zoom: 5,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    map.current.addControl(new mapboxgl.FullscreenControl(), 'top-right');

    map.current.on('load', () => {
      // Forzar recálculo de dimensiones para que el canvas no quede en posición 0,0
      map.current?.resize();

      if (map.current) {
        // Inicializar fuente con los datos actuales leídos desde refs:
        // esto es crítico en modo edición para que la ruta y los datos ya cargados
        // se muestren inmediatamente al abrir el paso del mapa, sin depender de
        // que los useEffects se re-ejecuten (evita el problema de stale closure
        // y el ciclo doble de React StrictMode en desarrollo).
        map.current.addSource('route', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: routePointsRef.current,
            },
          },
        });

        map.current.addLayer({
          id: 'route-line',
          type: 'line',
          source: 'route',
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
          },
          paint: {
            'line-color': '#3b82f6',
            'line-width': 4,
            'line-opacity': 0.8,
          },
        });

        // Centrar el mapa en los datos iniciales usando refs (valores siempre frescos)
        if (routePointsRef.current.length > 0) {
          const bounds = new mapboxgl.LngLatBounds();
          routePointsRef.current.forEach((coord) => bounds.extend(coord));
          map.current.fitBounds(bounds, { padding: 50, maxZoom: 14 });
        } else if (meetingPointRef.current?.coordinates) {
          map.current.flyTo({
            center: [meetingPointRef.current.coordinates.longitude, meetingPointRef.current.coordinates.latitude],
            zoom: 12,
          });
        }
      }

      // Marcar como cargado DESPUÉS de setup completo para que los efectos
      // de actualización (dibujar ruta, añadir waypoints) encuentren la fuente lista
      setMapLoaded(true);
    });

    return () => {
      // Resetear mapLoaded a false para que cuando React StrictMode (desarrollo)
      // desmonte y re-monte el componente, la transición false→true vuelva a
      // ocurrir y todos los useEffects que dependen de mapLoaded se re-ejecuten.
      // En producción (sin StrictMode) esto solo corre al desmontar el componente,
      // momento en que el estado no importa porque el componente ya no existe.
      map.current?.remove();
      map.current = null;
      setMapLoaded(false);
    };
  }, []);

  // Manejar clicks en el mapa según el modo actual
  useEffect(() => {
    if (!map.current) return;

    const handleMapClick = (e: mapboxgl.MapMouseEvent) => {
      if (editorMode === 'route') {
        addRoutePoint([e.lngLat.lng, e.lngLat.lat]);
      } else if (editorMode === 'meeting') {
        setMeetingPointCoordinates([e.lngLat.lng, e.lngLat.lat]);
      } else if (editorMode === 'waypoint') {
        addWaypoint([e.lngLat.lng, e.lngLat.lat]);
      }
    };

    map.current.on('click', handleMapClick);

    return () => {
      map.current?.off('click', handleMapClick);
    };
  }, [editorMode]);

  // Nota: el centrado inicial (fitBounds / flyTo) ya se realiza dentro de
  // map.on('load') usando refs, lo que garantiza que funciona en modo edición
  // y en el ciclo doble de React StrictMode sin necesitar este useEffect.

  // Actualizar ruta en el mapa
  useEffect(() => {
    if (!mapLoaded || !map.current) return;

    const source = map.current.getSource('route') as mapboxgl.GeoJSONSource;
    if (source) {
      source.setData({
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: routePoints,
        },
      });
    }

    if (onRouteChange) {
      onRouteChange(routePoints);
    }
  }, [routePoints, mapLoaded]);

  // Actualizar punto de encuentro
  useEffect(() => {
    if (!mapLoaded || !map.current) return;

    // Remover marcador anterior
    if (meetingMarker.current) {
      meetingMarker.current.remove();
      meetingMarker.current = null;
    }

    if (meetingPoint?.coordinates) {
      const el = document.createElement('div');
      el.style.width = '32px';
      el.style.height = '32px';
      el.style.borderRadius = '50%';
      el.style.backgroundColor = '#10b981';
      el.style.border = '3px solid white';
      el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';

      meetingMarker.current = new mapboxgl.Marker(el)
        .setLngLat([meetingPoint.coordinates.longitude, meetingPoint.coordinates.latitude])
        .addTo(map.current);
    }

    if (onMeetingPointChange) {
      onMeetingPointChange(meetingPoint);
    }
  }, [meetingPoint, mapLoaded]);

  // Actualizar waypoints
  useEffect(() => {
    if (!mapLoaded || !map.current) return;

    // Remover marcadores anteriores
    markers.current.forEach((marker) => marker.remove());
    markers.current = [];

    waypoints.forEach((waypoint, index) => {
      if (!waypoint.coordinates) return;

      const el = document.createElement('div');
      el.style.width = '24px';
      el.style.height = '24px';
      el.style.borderRadius = '50%';
      el.style.backgroundColor = '#f59e0b';
      el.style.border = '2px solid white';
      el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
      el.style.display = 'flex';
      el.style.alignItems = 'center';
      el.style.justifyContent = 'center';
      el.style.fontSize = '10px';
      el.style.fontWeight = 'bold';
      el.style.color = 'white';
      el.textContent = (index + 1).toString();

      // Popup con el nombre del waypoint — usa setDOMContent para aplicar
      // estilos propios con texto oscuro (el texto por defecto de Mapbox es suave).
      const popupContent = document.createElement('div');
      popupContent.style.fontSize = '13px';
      popupContent.style.fontWeight = '600';
      popupContent.style.color = '#111827';       // gris casi negro
      popupContent.style.padding = '2px 2px';
      popupContent.style.whiteSpace = 'nowrap';
      popupContent.textContent = waypoint.name || `Waypoint ${index + 1}`;

      const popup = new mapboxgl.Popup({ offset: 28, closeButton: false, maxWidth: '220px' })
        .setDOMContent(popupContent);

      const marker = new mapboxgl.Marker(el)
        .setLngLat([waypoint.coordinates.longitude, waypoint.coordinates.latitude])
        .setPopup(popup)
        .addTo(map.current!);

      markers.current.push(marker);
    });

    if (onWaypointsChange) {
      onWaypointsChange(waypoints);
    }
  }, [waypoints, mapLoaded]);

  function addRoutePoint(coords: [number, number]) {
    setRoutePoints((prev) => [...prev, coords]);
  }

  function setMeetingPointCoordinates(coords: [number, number]) {
    setMeetingPoint({
      coordinates: {
        latitude: coords[1],
        longitude: coords[0],
      },
      name: 'Punto de Encuentro',
    });
    setEditorMode(null);
  }

  function addWaypoint(coords: [number, number]) {
    // Usar waypointNameRef en lugar de waypointName para evitar stale closure:
    // el useEffect del click handler solo se re-ejecuta al cambiar editorMode,
    // por lo que capturaría waypointName = '' si se lee del estado directamente.
    const name = waypointNameRef.current.trim() || `Waypoint ${waypoints.length + 1}`;
    const newWaypoint: Waypoint = {
      coordinates: {
        latitude: coords[1],
        longitude: coords[0],
      },
      name,
      order: waypoints.length + 1,
    };
    setWaypoints((prev) => [...prev, newWaypoint]);
    setWaypointName('');
    waypointNameRef.current = '';
    setEditorMode(null);
  }

  function clearRoute() {
    setRoutePoints([]);
  }

  function clearMeetingPoint() {
    setMeetingPoint(null);
  }

  function clearWaypoints() {
    setWaypoints([]);
  }

  function undoLastPoint() {
    setRoutePoints((prev) => prev.slice(0, -1));
  }

  // Manejar carga de GPX
  function handleGPXLoad(data: {
    routeCoordinates: [number, number][];
    waypoints: Waypoint[];
    meetingPoint: MeetingPoint | null;
    stats: any;
  }) {
    setRoutePoints(data.routeCoordinates);
    setWaypoints(data.waypoints);
    if (data.meetingPoint) {
      setMeetingPoint(data.meetingPoint);
    }
    setGpxError(null);

    // Centrar el mapa en la ruta cargada
    if (map.current && data.routeCoordinates.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      data.routeCoordinates.forEach((coord) => {
        bounds.extend(coord as [number, number]);
      });
      map.current.fitBounds(bounds, { padding: 50 });
    }
  }

  // Exportar a GPX
  function handleExportGPX() {
    if (routePoints.length === 0) {
      setGpxError('No hay ruta para exportar');
      return;
    }

    const gpxContent = exportToGPX({
      name: 'Ruta TrekPeru',
      description: 'Ruta creada en TrekPeru',
      routeCoordinates: routePoints,
      waypoints: waypoints,
      meetingPoint: meetingPoint || undefined,
    });

    downloadGPX(gpxContent, `ruta-${Date.now()}.gpx`);
    setGpxError(null);
  }

  // Manejar búsqueda de lugar
  function handleLocationSelect(lng: number, lat: number, placeName: string) {
    if (map.current) {
      // Centrar el mapa en la ubicación
      map.current.flyTo({
        center: [lng, lat],
        zoom: 14,
        duration: 1500,
      });

      // Si está en modo meeting point, colocar el punto automáticamente
      if (editorMode === 'meeting') {
        setMeetingPointCoordinates([lng, lat]);
      }
    }
  }

  // Manejar entrada manual de coordenadas
  function handleCoordinatesSubmit(lng: number, lat: number) {
    if (map.current) {
      // Centrar el mapa en las coordenadas
      map.current.flyTo({
        center: [lng, lat],
        zoom: 14,
        duration: 1500,
      });
    }
  }

  if (!process.env.NEXT_PUBLIC_MAPBOX_TOKEN) {
    return (
      <div
        className={`${className} bg-muted rounded-lg flex items-center justify-center border border-border`}
        style={{ height }}
      >
        <div className="text-center p-6">
          <p className="text-sm text-muted-foreground mb-2">Editor de mapa no disponible</p>
          <p className="text-xs text-muted-foreground">
            Configura NEXT_PUBLIC_MAPBOX_TOKEN en .env.local
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Controles */}
      <Card className="p-4 mb-4">
        <div className="space-y-4">
          {/* Búsqueda y Coordenadas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-muted-foreground">Buscar lugar</h4>
              <MapSearch
                onLocationSelect={handleLocationSelect}
                placeholder="Buscar en Perú..."
              />
            </div>
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-muted-foreground">Ir a coordenadas</h4>
              <CoordinateInput
                onCoordinatesSubmit={handleCoordinatesSubmit}
              />
            </div>
          </div>

          {/* Separador */}
          <div className="border-t border-border" />

          {/* GPX Upload y Export */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <GPXUpload
              onGPXLoad={handleGPXLoad}
              onError={setGpxError}
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleExportGPX}
              disabled={routePoints.length === 0}
              className="w-full"
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar a GPX
            </Button>
          </div>

          {/* Error de GPX */}
          {gpxError && (
            <div className="p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded text-sm text-amber-700 dark:text-amber-300">
              {gpxError}
            </div>
          )}

          {/* Separador */}
          <div className="border-t border-border" />

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant={editorMode === 'route' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setEditorMode(editorMode === 'route' ? null : 'route')}
            >
              <Navigation className="h-4 w-4 mr-2" />
              {editorMode === 'route' ? 'Dibujando ruta...' : 'Dibujar ruta'}
            </Button>

            <Button
              type="button"
              variant={editorMode === 'meeting' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setEditorMode(editorMode === 'meeting' ? null : 'meeting')}
            >
              <MapPin className="h-4 w-4 mr-2" />
              {editorMode === 'meeting' ? 'Click en el mapa...' : 'Punto de encuentro'}
            </Button>

            <Button
              type="button"
              variant={editorMode === 'waypoint' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setEditorMode(editorMode === 'waypoint' ? null : 'waypoint')}
            >
              <Save className="h-4 w-4 mr-2" />
              {editorMode === 'waypoint' ? 'Click en el mapa...' : 'Agregar waypoint'}
            </Button>
          </div>

          {editorMode === 'waypoint' && (
            <div className="space-y-2">
              <Label htmlFor="waypoint-name">Nombre del waypoint</Label>
              <Input
                id="waypoint-name"
                value={waypointName}
                onChange={(e) => setWaypointName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                  }
                }}
                placeholder="Ej: Mirador, Campamento, Fuente de agua"
              />
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {routePoints.length > 0 && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={undoLastPoint}
                >
                  Deshacer último punto
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={clearRoute}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Limpiar ruta
                </Button>
              </>
            )}

            {meetingPoint && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={clearMeetingPoint}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Quitar punto de encuentro
              </Button>
            )}

            {waypoints.length > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={clearWaypoints}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Quitar waypoints
              </Button>
            )}
          </div>

          <div className="text-xs text-muted-foreground">
            <p>Puntos en ruta: {routePoints.length}</p>
            {meetingPoint && <p>✓ Punto de encuentro marcado</p>}
            {waypoints.length > 0 && <p>Waypoints: {waypoints.length}</p>}
          </div>
        </div>
      </Card>

      {/* Mapa — el wrapper relative + overflow-hidden + height fijo contiene el canvas
           de Mapbox (position:absolute top:0 left:0) impidiendo el flash al inicializar.
           El skeleton se superpone con z-10 sin tocar la opacidad del canvas WebGL,
           lo que evita conflictos con el stacking context de WebGL, los markers DOM
           y el cálculo de dimensiones para fitBounds/flyTo. */}
      <div className="relative rounded-lg overflow-hidden" style={{ height }}>
        {/* Canvas de Mapbox — sin modificar opacidad para no romper WebGL ni markers */}
        <div
          ref={mapContainer}
          style={{ height }}
          className="w-full overflow-hidden"
        />
        {/* Skeleton superpuesto hasta que el mapa termine de cargar */}
        {!mapLoaded && (
          <div className="absolute inset-0 z-10 bg-muted animate-pulse rounded-lg flex items-center justify-center">
            <span className="text-sm text-muted-foreground">Cargando mapa...</span>
          </div>
        )}
      </div>

      {/* Lista de waypoints con nombres — visible debajo del mapa.
           Complementa los círculos numerados del mapa; el nombre completo también
           aparece al hacer clic sobre el marcador (popup). */}
      {waypoints.length > 0 && (
        <div className="mt-3 rounded-lg border border-border overflow-hidden">
          {/* Cabecera */}
          <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 border-b border-border">
            <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
            <p className="text-xs font-semibold text-foreground">
              Waypoints marcados
            </p>
            <span className="ml-auto text-xs font-medium text-amber-700 dark:text-amber-400">
              {waypoints.length} {waypoints.length === 1 ? 'punto' : 'puntos'}
            </span>
          </div>
          {/* Filas */}
          <ol className="divide-y divide-border">
            {waypoints.map((wp, index) => (
              <li key={index} className="flex items-center gap-3 px-3 py-2.5 hover:bg-muted/40 transition-colors">
                {/* Número */}
                <span className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-[11px] shrink-0 shadow-sm">
                  {index + 1}
                </span>
                {/* Nombre */}
                <span className="text-sm font-medium text-foreground leading-tight">
                  {wp.name || `Waypoint ${index + 1}`}
                </span>
                {/* Descripción si existe */}
                {wp.description && (
                  <span className="ml-auto text-xs text-muted-foreground truncate max-w-[140px]">
                    {wp.description}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
