'use client';

import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import type { Coordinates } from '@/types/transport.types';

interface FinalLegMapProps {
  from: Coordinates;
  to: Coordinates;
  // GeoJSON LineString del tramo (de Mapbox Directions)
  geometry: {
    type: 'LineString';
    coordinates: [number, number][];
  };
  height?: string;
}

// Mini-mapa que dibuja el tramo final calculado por Mapbox Directions.
// Markers en origen/destino + polyline azul ajustando bounds.
export function FinalLegMap({
  from,
  to,
  geometry,
  height = '180px',
}: FinalLegMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  // Recalcular tamaño cuando el contenedor cambia (ej. tab visible)
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(() => {
      mapRef.current?.resize();
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token || !containerRef.current) return;
    mapboxgl.accessToken = token;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/outdoors-v12',
      center: [from.lng, from.lat],
      zoom: 11,
      interactive: true,
      cooperativeGestures: true,
      attributionControl: false,
    });
    map.addControl(new mapboxgl.AttributionControl({ compact: true }));

    map.on('load', () => {
      // Polyline del tramo
      map.addSource('final-leg', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry,
        },
      });
      map.addLayer({
        id: 'final-leg-line',
        type: 'line',
        source: 'final-leg',
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': '#3b82f6',
          'line-width': 4,
          'line-opacity': 0.85,
        },
      });

      // Marker origen (último punto del recorrido manual)
      new mapboxgl.Marker({ color: '#10b981' })
        .setLngLat([from.lng, from.lat])
        .addTo(map);

      // Marker destino (meeting point)
      new mapboxgl.Marker({ color: '#ef4444' })
        .setLngLat([to.lng, to.lat])
        .addTo(map);

      // Ajustar bounds para que se vea todo el tramo con padding
      const bounds = new mapboxgl.LngLatBounds();
      for (const [lng, lat] of geometry.coordinates) {
        bounds.extend([lng, lat]);
      }
      bounds.extend([from.lng, from.lat]);
      bounds.extend([to.lng, to.lat]);
      map.fitBounds(bounds, { padding: 30, duration: 0, maxZoom: 14 });

      // Asegurar recálculo tras cargar (tab podría estar inicialmente oculto)
      map.resize();
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // Re-crear el mapa si cambian las coords o la geometría
  }, [from.lat, from.lng, to.lat, to.lng, geometry]);

  return (
    <div
      ref={containerRef}
      style={{ height }}
      className="w-full rounded-md overflow-hidden border"
    />
  );
}
