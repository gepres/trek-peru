'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MeetingPoint, Waypoint } from '@/types/database.types';

interface RouteMapProps {
  routeCoordinates?: any; // GeoJSON LineString o string EWKT desde PostgREST
  meetingPoint?: MeetingPoint;
  waypoints?: Waypoint[];
  className?: string;
  height?: string;
}

// Decodifica WKB hex (Extended Well-Known Binary) que devuelve Supabase/PostgREST
// para columnas GEOGRAPHY. Formato EWKB little-endian:
//   [1B orden] [4B tipo+flags] [4B SRID si flag] [4B numPuntos] [16B por punto (lng,lat doubles)]
function parseWKBHex(hex: string): [number, number][] | null {
  try {
    if (hex.length % 2 !== 0) return null;

    // Hex → Uint8Array
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
    }

    const view = new DataView(bytes.buffer);
    const le = bytes[0] === 1; // byte order: 1 = little-endian

    // Tipo de geometría (4 bytes en offset 1)
    const wkbType = view.getUint32(1, le);
    const hasSRID = (wkbType & 0x20000000) !== 0;
    const baseType = wkbType & 0xff; // 2 = LINESTRING
    if (baseType !== 2) return null;

    // Saltar SRID si está presente (4 bytes extra)
    let offset = 5 + (hasSRID ? 4 : 0);

    // Número de puntos
    const numPoints = view.getUint32(offset, le);
    offset += 4;

    // Leer pares (lng, lat) — cada uno es un double de 8 bytes
    const coords: [number, number][] = [];
    for (let i = 0; i < numPoints; i++) {
      const lng = view.getFloat64(offset, le);
      const lat = view.getFloat64(offset + 8, le);
      offset += 16;
      if (Number.isFinite(lng) && Number.isFinite(lat)) {
        coords.push([lng, lat]);
      }
    }
    return coords.length >= 2 ? coords : null;
  } catch {
    return null;
  }
}

// Normaliza route_coordinates al formato { type, coordinates } que espera Mapbox.
// Supabase/PostgREST devuelve columnas GEOGRAPHY como WKB hex (formato confirmado).
// También se soportan GeoJSON object, JSON string y EWKT por retrocompatibilidad.
function parseRouteCoordinates(data: any): { type: string; coordinates: [number, number][] } | null {
  if (!data) return null;

  // Caso A: objeto GeoJSON con .coordinates ya parseado
  if (typeof data === 'object' && Array.isArray(data.coordinates) && data.coordinates.length > 0) {
    return data as { type: string; coordinates: [number, number][] };
  }

  if (typeof data === 'string') {
    // Caso B: string JSON → '{"type":"LineString","coordinates":[[lng,lat],...]}'
    if (data.trimStart().startsWith('{')) {
      try {
        const parsed = JSON.parse(data);
        if (parsed && Array.isArray(parsed.coordinates) && parsed.coordinates.length > 0) {
          return parsed as { type: string; coordinates: [number, number][] };
        }
      } catch {
        // No era JSON válido, continuar
      }
    }

    // Caso C: string EWKT → "SRID=4326;LINESTRING(lng lat, ...)"
    const ewktStart = data.toUpperCase().indexOf('LINESTRING(');
    if (ewktStart !== -1) {
      const open = data.indexOf('(', ewktStart);
      const close = data.lastIndexOf(')');
      if (open !== -1 && close > open) {
        const coords: [number, number][] = data
          .slice(open + 1, close)
          .split(',')
          .map((pair: string) => {
            const parts = pair.trim().split(/\s+/);
            return [parseFloat(parts[0]), parseFloat(parts[1])] as [number, number];
          })
          .filter(([lng, lat]: [number, number]) => Number.isFinite(lng) && Number.isFinite(lat));
        if (coords.length >= 2) {
          return { type: 'LineString', coordinates: coords };
        }
      }
    }

    // Caso D: WKB hex → "0102000020E6100000..." (formato real de Supabase PostgREST)
    if (/^[0-9A-Fa-f]+$/.test(data)) {
      const coords = parseWKBHex(data);
      if (coords) return { type: 'LineString', coordinates: coords };
    }
  }

  return null;
}

// Componente para visualizar rutas en mapa de Mapbox
export function RouteMap({
  routeCoordinates: routeCoordinatesRaw,
  meetingPoint,
  waypoints = [],
  className = '',
  height = '400px',
}: RouteMapProps) {
  // Normalizar desde EWKT string (PostgREST) o GeoJSON object
  const routeCoordinates = parseRouteCoordinates(routeCoordinatesRaw);

  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Observar cambios de tamaño del contenedor (p.ej. al cambiar de tab)
  // y llamar map.resize() para que Mapbox recalcule sus dimensiones
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
    // Verificar token de Mapbox
    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

    if (!mapboxToken) {
      console.warn('Mapbox token no configurado. Agrega NEXT_PUBLIC_MAPBOX_TOKEN a .env.local');
      return;
    }

    if (!mapContainer.current) return;

    // Inicializar mapa
    mapboxgl.accessToken = mapboxToken;

    // Coordenadas por defecto (centro de Perú)
    const defaultCenter: [number, number] = [-75.0152, -9.19];
    const defaultZoom = 5;

    // Determinar centro del mapa
    let center: [number, number] = defaultCenter;
    let zoom = defaultZoom;

    if (meetingPoint?.coordinates) {
      center = [meetingPoint.coordinates.longitude, meetingPoint.coordinates.latitude];
      zoom = 12;
    } else if (routeCoordinates && routeCoordinates.coordinates.length > 0) {
      // Usar primer punto de la ruta normalizada
      const firstPoint = routeCoordinates.coordinates[0];
      center = [firstPoint[0], firstPoint[1]];
      zoom = 12;
    }

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/outdoors-v12',
      center,
      zoom,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    map.current.addControl(new mapboxgl.FullscreenControl(), 'top-right');

    map.current.on('load', () => {
      setMapLoaded(true);
    });

    // Cleanup
    return () => {
      map.current?.remove();
    };
  }, []);

  // Agregar ruta al mapa cuando esté cargado
  useEffect(() => {
    if (!mapLoaded || !map.current) return;

    // Limpiar capas y fuentes previas
    if (map.current.getSource('route')) {
      map.current.removeLayer('route-line');
      map.current.removeSource('route');
    }

    if (!routeCoordinates || routeCoordinates.coordinates.length === 0) {
      return;
    }

    // Agregar ruta
    map.current.addSource('route', {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: routeCoordinates.coordinates,
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

    // Ajustar el mapa para mostrar toda la ruta completa
    const coordinates = routeCoordinates.coordinates;
    const bounds = coordinates.reduce(
      (bounds: mapboxgl.LngLatBounds, coord: [number, number]) => {
        return bounds.extend(coord as [number, number]);
      },
      new mapboxgl.LngLatBounds(coordinates[0], coordinates[0])
    );

    map.current.fitBounds(bounds, {
      padding: 50,
      maxZoom: 14,
    });
  }, [mapLoaded, routeCoordinates]);

  // Agregar punto de encuentro
  useEffect(() => {
    if (!mapLoaded || !map.current || !meetingPoint?.coordinates) return;

    // Agregar marcador de punto de encuentro
    const el = document.createElement('div');
    el.className = 'meeting-point-marker';
    el.style.width = '32px';
    el.style.height = '32px';
    el.style.borderRadius = '50%';
    el.style.backgroundColor = '#10b981';
    el.style.border = '3px solid white';
    el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
    el.style.cursor = 'pointer';

    const marker = new mapboxgl.Marker(el)
      .setLngLat([
        meetingPoint.coordinates.longitude,
        meetingPoint.coordinates.latitude,
      ])
      .setPopup(
        new mapboxgl.Popup({ offset: 25 }).setHTML(
          `<div style="padding:8px;font-family:sans-serif;min-width:140px;">
            <p style="font-size:11px;font-weight:700;color:#059669;margin:0 0 4px 0;text-transform:uppercase;letter-spacing:0.05em;">Punto de Encuentro</p>
            ${meetingPoint.name ? `<p style="font-size:13px;font-weight:600;color:#111827;margin:0 0 2px 0;">${meetingPoint.name}</p>` : ''}
            ${meetingPoint.address ? `<p style="font-size:12px;color:#374151;margin:0;">${meetingPoint.address}</p>` : ''}
          </div>`
        )
      )
      .addTo(map.current);

    return () => {
      marker.remove();
    };
  }, [mapLoaded, meetingPoint]);

  // Agregar waypoints
  useEffect(() => {
    if (!mapLoaded || !map.current || !waypoints || waypoints.length === 0) return;

    const markers: mapboxgl.Marker[] = [];

    waypoints.forEach((waypoint, index) => {
      if (!waypoint.coordinates) return;

      const el = document.createElement('div');
      el.className = 'waypoint-marker';
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

      const marker = new mapboxgl.Marker(el)
        .setLngLat([waypoint.coordinates.longitude, waypoint.coordinates.latitude])
        .setPopup(
          new mapboxgl.Popup({ offset: 15 }).setHTML(
            `<div style="padding:8px;font-family:sans-serif;min-width:120px;">
              <p style="font-size:10px;font-weight:700;color:#d97706;margin:0 0 3px 0;text-transform:uppercase;letter-spacing:0.05em;">Waypoint ${index + 1}</p>
              <p style="font-size:13px;font-weight:600;color:#111827;margin:0 0 2px 0;">${waypoint.name || `Waypoint ${index + 1}`}</p>
              ${waypoint.description ? `<p style="font-size:12px;color:#374151;margin:0;">${waypoint.description}</p>` : ''}
            </div>`
          )
        )
        .addTo(map.current!);

      markers.push(marker);
    });

    return () => {
      markers.forEach((marker) => marker.remove());
    };
  }, [mapLoaded, waypoints]);

  // Mensaje si no hay token de Mapbox
  if (!process.env.NEXT_PUBLIC_MAPBOX_TOKEN) {
    return (
      <div
        className={`${className} bg-muted rounded-lg flex items-center justify-center border border-border`}
        style={{ height }}
      >
        <div className="text-center p-6">
          <p className="text-sm text-muted-foreground mb-2">
            Mapa no disponible
          </p>
          <p className="text-xs text-muted-foreground">
            Configura NEXT_PUBLIC_MAPBOX_TOKEN en .env.local
          </p>
        </div>
      </div>
    );
  }

  return (
    // El wrapper lleva `relative` para que el skeleton `absolute inset-0`
    // quede confinado dentro del área del mapa y no se sobreponga al Card
    <div className={`relative ${className}`}>
      <div ref={mapContainer} style={{ height }} className="rounded-lg overflow-hidden" />
      {!mapLoaded && (
        <div className="absolute inset-0 bg-muted animate-pulse rounded-lg" />
      )}
    </div>
  );
}
