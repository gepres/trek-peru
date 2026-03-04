// Parser para archivos KML y KMZ (formato Google Earth / Google Maps)
// KMZ = archivo KML comprimido en formato ZIP
//
// Produce exactamente el mismo formato de salida que gpx-parser.ts,
// por lo que es 100% compatible con RouteMapEditor y gpxToRouteData.

import { unzip } from 'fflate';
import type { GPXData, GPXPoint, GPXTrack, GPXWaypoint } from './gpx-parser';

// Re-exporta tipos para uso externo
export type { GPXData, GPXPoint, GPXTrack, GPXWaypoint };

// ── API pública ──────────────────────────────────────────────────────────────

/**
 * Parsea un archivo KML (texto XML) y retorna el mismo GPXData que gpx-parser.
 * Soporta:
 *   - <LineString> → track
 *   - <MultiGeometry> con LineString → track + waypoints opcionales
 *   - <gx:Track> (Google Earth extendido) → track
 *   - <Point> placemarks → waypoints
 */
export function parseKML(kmlText: string): GPXData {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(kmlText, 'text/xml');

  // Verificar errores de parseo XML
  const parseError = xmlDoc.querySelector('parsererror');
  if (parseError) {
    throw new Error('Error al parsear el archivo KML. Asegúrate de que el archivo no esté dañado.');
  }

  // Extraer nombre del documento como metadata
  const docEl = xmlDoc.getElementsByTagName('Document')[0];
  const docName = docEl?.getElementsByTagName('name')[0]?.textContent || undefined;
  const docDesc = docEl?.getElementsByTagName('description')[0]?.textContent || undefined;
  const metadata = docName ? { name: docName, desc: docDesc || undefined } : undefined;

  const tracks: GPXTrack[] = [];
  const waypoints: GPXWaypoint[] = [];

  // Iterar sobre todos los <Placemark> del documento
  const placemarks = xmlDoc.getElementsByTagName('Placemark');

  Array.from(placemarks).forEach((placemark) => {
    const name = getFirstChild(placemark, 'name')?.textContent?.trim() || undefined;
    const desc = getFirstChild(placemark, 'description')?.textContent?.trim() || undefined;

    // ── LineString → track de ruta ──────────────────────────────────────────
    const lineString = getFirstChild(placemark, 'LineString');
    if (lineString) {
      const coordText = getFirstChild(lineString, 'coordinates')?.textContent || '';
      const points = parseCoordinatesList(coordText);
      if (points.length > 0) {
        tracks.push({ name, points, ...calcStats(points) });
      }
      return;
    }

    // ── MultiGeometry: puede contener LineString + Points ───────────────────
    const multiGeo = getFirstChild(placemark, 'MultiGeometry');
    if (multiGeo) {
      const ls = getFirstChild(multiGeo, 'LineString');
      if (ls) {
        const coordText = getFirstChild(ls, 'coordinates')?.textContent || '';
        const points = parseCoordinatesList(coordText);
        if (points.length > 0) {
          tracks.push({ name, points, ...calcStats(points) });
        }
      }
      // Puntos dentro de la MultiGeometry → waypoints
      const pts = multiGeo.getElementsByTagName('Point');
      Array.from(pts).forEach((pt, i) => {
        const coord = parseSingleCoord(getFirstChild(pt, 'coordinates')?.textContent || '');
        if (coord) {
          waypoints.push({
            ...coord,
            name: name ? `${name} ${i + 1}` : `Punto ${i + 1}`,
            desc: desc || undefined,
          });
        }
      });
      return;
    }

    // ── gx:Track (Google Earth extended schema) ─────────────────────────────
    // Namespace: http://www.google.com/kml/ext/2.2
    // getElementsByTagName funciona sin namespace en DOMParser
    const gxTrack = placemark.getElementsByTagName('gx:Track')[0];
    if (gxTrack) {
      const coordEls = gxTrack.getElementsByTagName('gx:coord');
      const points: GPXPoint[] = Array.from(coordEls)
        .map((el) => {
          const parts = (el.textContent || '').trim().split(/\s+/);
          const lng = parseFloat(parts[0] || '0');
          const lat = parseFloat(parts[1] || '0');
          const ele = parts[2] !== undefined ? parseFloat(parts[2]) : undefined;
          return { lat, lng, ele };
        })
        .filter((p) => !isNaN(p.lat) && !isNaN(p.lng));
      if (points.length > 0) {
        tracks.push({ name, points, ...calcStats(points) });
      }
      return;
    }

    // ── gx:MultiTrack ───────────────────────────────────────────────────────
    const gxMultiTrack = placemark.getElementsByTagName('gx:MultiTrack')[0];
    if (gxMultiTrack) {
      const gxTracks = gxMultiTrack.getElementsByTagName('gx:Track');
      Array.from(gxTracks).forEach((gxt, tIdx) => {
        const coordEls = gxt.getElementsByTagName('gx:coord');
        const points: GPXPoint[] = Array.from(coordEls)
          .map((el) => {
            const parts = (el.textContent || '').trim().split(/\s+/);
            return {
              lat: parseFloat(parts[1] || '0'),
              lng: parseFloat(parts[0] || '0'),
              ele: parts[2] !== undefined ? parseFloat(parts[2]) : undefined,
            };
          })
          .filter((p) => !isNaN(p.lat) && !isNaN(p.lng));
        if (points.length > 0) {
          tracks.push({ name: name ? `${name} (${tIdx + 1})` : undefined, points, ...calcStats(points) });
        }
      });
      return;
    }

    // ── Point → waypoint ────────────────────────────────────────────────────
    const point = getFirstChild(placemark, 'Point');
    if (point) {
      const coord = parseSingleCoord(getFirstChild(point, 'coordinates')?.textContent || '');
      if (coord) {
        waypoints.push({ ...coord, name, desc: desc || undefined });
      }
    }
  });

  if (tracks.length === 0 && waypoints.length === 0) {
    throw new Error(
      'El archivo KML no contiene tracks ni waypoints. Verifica que el archivo tenga datos de ruta.'
    );
  }

  return { tracks, waypoints, metadata };
}

/**
 * Descomprime un archivo KMZ (ZIP) y parsea el KML principal que contiene.
 * El archivo KML principal es el primero con extensión .kml encontrado en el ZIP.
 */
export async function parseKMZ(file: File): Promise<GPXData> {
  const arrayBuffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);

  return new Promise((resolve, reject) => {
    unzip(uint8Array, (err, files) => {
      if (err) {
        reject(new Error('Error al descomprimir el archivo KMZ. El archivo puede estar dañado.'));
        return;
      }

      // Buscar el archivo .kml principal dentro del ZIP
      // La convención es "doc.kml" pero puede tener cualquier nombre
      const kmlEntry =
        Object.keys(files).find((name) => name.toLowerCase() === 'doc.kml') ||
        Object.keys(files).find((name) => name.toLowerCase().endsWith('.kml'));

      if (!kmlEntry) {
        reject(new Error('No se encontró un archivo KML dentro del KMZ.'));
        return;
      }

      try {
        const kmlText = new TextDecoder('utf-8').decode(files[kmlEntry]);
        resolve(parseKML(kmlText));
      } catch (parseErr) {
        reject(parseErr);
      }
    });
  });
}

/**
 * Alias de gpxToRouteData compatible con datos provenientes de KML/KMZ.
 * Convierte GPXData al formato esperado por RouteMapEditor.
 */
export function kmlToRouteData(kmlData: GPXData) {
  const firstTrack = kmlData.tracks[0];

  if (!firstTrack && kmlData.waypoints.length === 0) {
    throw new Error('El archivo KML no contiene datos de ruta.');
  }

  // Coordenadas del track principal [lng, lat] (formato Mapbox/GeoJSON)
  const routeCoordinates: [number, number][] =
    firstTrack?.points.map((p) => [p.lng, p.lat]) ?? [];

  // Waypoints al formato de la aplicación
  const waypoints = kmlData.waypoints.map((wpt, index) => ({
    coordinates: { latitude: wpt.lat, longitude: wpt.lng },
    name: wpt.name || `Waypoint ${index + 1}`,
    description: wpt.desc,
    order: index + 1,
  }));

  // Punto de encuentro: primer punto del track
  const meetingPoint =
    routeCoordinates.length > 0
      ? {
          coordinates: {
            latitude: routeCoordinates[0][1],
            longitude: routeCoordinates[0][0],
          },
          name: kmlData.metadata?.name || 'Punto de Encuentro',
        }
      : null;

  return {
    routeCoordinates,
    waypoints,
    meetingPoint,
    stats: {
      distance: firstTrack?.totalDistance,
      elevationGain: firstTrack?.elevationGain,
      elevationLoss: firstTrack?.elevationLoss,
      minAltitude: firstTrack?.minAltitude,
      maxAltitude: firstTrack?.maxAltitude,
    },
    metadata: kmlData.metadata,
  };
}

// ── Helpers internos ─────────────────────────────────────────────────────────

/**
 * Obtiene el primer elemento hijo con tagName dado (funciona con cualquier namespace)
 */
function getFirstChild(parent: Element, tagName: string): Element | null {
  return parent.getElementsByTagName(tagName)[0] ?? null;
}

/**
 * Parsea un bloque de coordenadas KML:
 *   "lon,lat,alt lon,lat,alt ..."  (separados por espacios y/o saltos de línea)
 * Coordenadas en orden [lng, lat, alt?] — inverso a GPX
 */
function parseCoordinatesList(raw: string): GPXPoint[] {
  return raw
    .trim()
    .split(/[\s\n\r]+/)
    .map((tuple) => {
      const parts = tuple.split(',');
      const lng = parseFloat(parts[0] ?? '0');
      const lat = parseFloat(parts[1] ?? '0');
      const ele = parts[2] !== undefined && parts[2] !== '' ? parseFloat(parts[2]) : undefined;
      return { lat, lng, ele };
    })
    .filter((p) => !isNaN(p.lat) && !isNaN(p.lng) && tuple_hasData(p));
}

function tuple_hasData(p: GPXPoint) {
  return p.lat !== 0 || p.lng !== 0;
}

/**
 * Parsea una única coordenada KML: "lon,lat[,alt]"
 */
function parseSingleCoord(raw: string): GPXPoint | null {
  const parts = raw.trim().split(',');
  if (parts.length < 2) return null;
  const lng = parseFloat(parts[0] ?? '0');
  const lat = parseFloat(parts[1] ?? '0');
  const ele = parts[2] !== undefined && parts[2] !== '' ? parseFloat(parts[2]) : undefined;
  if (isNaN(lat) || isNaN(lng)) return null;
  return { lat, lng, ele };
}

/**
 * Calcula estadísticas del track — misma lógica que gpx-parser para consistencia
 */
function calcStats(points: GPXPoint[]) {
  if (points.length === 0) return {};

  const R = 6371;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const haversine = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  let totalDistance = 0;
  let elevationGain = 0;
  let elevationLoss = 0;
  let minAltitude = Infinity;
  let maxAltitude = -Infinity;

  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    if (p.ele !== undefined) {
      minAltitude = Math.min(minAltitude, p.ele);
      maxAltitude = Math.max(maxAltitude, p.ele);
      if (i > 0 && points[i - 1].ele !== undefined) {
        const diff = p.ele - points[i - 1].ele!;
        if (diff > 0) elevationGain += diff;
        else elevationLoss += Math.abs(diff);
      }
    }
    if (i > 0) {
      totalDistance += haversine(points[i - 1].lat, points[i - 1].lng, p.lat, p.lng);
    }
  }

  return {
    totalDistance: Math.round(totalDistance * 100) / 100,
    elevationGain: Math.round(elevationGain),
    elevationLoss: Math.round(elevationLoss),
    minAltitude: minAltitude !== Infinity ? Math.round(minAltitude) : undefined,
    maxAltitude: maxAltitude !== -Infinity ? Math.round(maxAltitude) : undefined,
  };
}
