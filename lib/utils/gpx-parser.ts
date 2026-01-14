// Utilidad para parsear archivos GPX y extraer coordenadas

export interface GPXPoint {
  lat: number;
  lng: number;
  ele?: number; // elevación
  time?: string;
}

export interface GPXWaypoint extends GPXPoint {
  name?: string;
  desc?: string;
  sym?: string;
}

export interface GPXTrack {
  name?: string;
  points: GPXPoint[];
  totalDistance?: number;
  elevationGain?: number;
  elevationLoss?: number;
  minAltitude?: number;
  maxAltitude?: number;
}

export interface GPXData {
  tracks: GPXTrack[];
  waypoints: GPXWaypoint[];
  metadata?: {
    name?: string;
    desc?: string;
    author?: string;
    time?: string;
  };
}

/**
 * Parsea un archivo GPX y extrae tracks y waypoints
 */
export async function parseGPX(file: File): Promise<GPXData> {
  const text = await file.text();
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(text, 'text/xml');

  // Verificar si hay errores de parseo
  const parseError = xmlDoc.querySelector('parsererror');
  if (parseError) {
    throw new Error('Error al parsear el archivo GPX. Formato inválido.');
  }

  // Extraer metadata
  const metadataElement = xmlDoc.querySelector('metadata');
  const metadata = metadataElement ? {
    name: metadataElement.querySelector('name')?.textContent || undefined,
    desc: metadataElement.querySelector('desc')?.textContent || undefined,
    author: metadataElement.querySelector('author name')?.textContent || undefined,
    time: metadataElement.querySelector('time')?.textContent || undefined,
  } : undefined;

  // Extraer tracks
  const tracks: GPXTrack[] = [];
  const trkElements = xmlDoc.querySelectorAll('trk');

  trkElements.forEach((trkElement) => {
    const trackName = trkElement.querySelector('name')?.textContent || undefined;
    const points: GPXPoint[] = [];

    // Extraer puntos del track (trkpt)
    const trkptElements = trkElement.querySelectorAll('trkpt');
    trkptElements.forEach((trkpt) => {
      const lat = parseFloat(trkpt.getAttribute('lat') || '0');
      const lng = parseFloat(trkpt.getAttribute('lon') || '0');
      const ele = trkpt.querySelector('ele')?.textContent;
      const time = trkpt.querySelector('time')?.textContent;

      points.push({
        lat,
        lng,
        ele: ele ? parseFloat(ele) : undefined,
        time: time || undefined,
      });
    });

    // Calcular estadísticas del track
    const stats = calculateTrackStats(points);

    tracks.push({
      name: trackName,
      points,
      ...stats,
    });
  });

  // Extraer waypoints
  const waypoints: GPXWaypoint[] = [];
  const wptElements = xmlDoc.querySelectorAll('wpt');

  wptElements.forEach((wpt) => {
    const lat = parseFloat(wpt.getAttribute('lat') || '0');
    const lng = parseFloat(wpt.getAttribute('lon') || '0');
    const ele = wpt.querySelector('ele')?.textContent;
    const name = wpt.querySelector('name')?.textContent;
    const desc = wpt.querySelector('desc')?.textContent;
    const sym = wpt.querySelector('sym')?.textContent;

    waypoints.push({
      lat,
      lng,
      ele: ele ? parseFloat(ele) : undefined,
      name: name || undefined,
      desc: desc || undefined,
      sym: sym || undefined,
    });
  });

  return {
    tracks,
    waypoints,
    metadata,
  };
}

/**
 * Calcula estadísticas de un track (distancia, desnivel, altitudes)
 */
function calculateTrackStats(points: GPXPoint[]) {
  if (points.length === 0) {
    return {};
  }

  let totalDistance = 0;
  let elevationGain = 0;
  let elevationLoss = 0;
  let minAltitude = Infinity;
  let maxAltitude = -Infinity;

  for (let i = 0; i < points.length; i++) {
    const point = points[i];

    // Calcular altitudes min/max
    if (point.ele !== undefined) {
      minAltitude = Math.min(minAltitude, point.ele);
      maxAltitude = Math.max(maxAltitude, point.ele);

      // Calcular desnivel
      if (i > 0 && points[i - 1].ele !== undefined) {
        const elevDiff = point.ele - points[i - 1].ele!;
        if (elevDiff > 0) {
          elevationGain += elevDiff;
        } else {
          elevationLoss += Math.abs(elevDiff);
        }
      }
    }

    // Calcular distancia (usando fórmula de Haversine)
    if (i > 0) {
      totalDistance += calculateDistance(
        points[i - 1].lat,
        points[i - 1].lng,
        point.lat,
        point.lng
      );
    }
  }

  return {
    totalDistance: Math.round(totalDistance * 100) / 100, // km con 2 decimales
    elevationGain: Math.round(elevationGain),
    elevationLoss: Math.round(elevationLoss),
    minAltitude: minAltitude !== Infinity ? Math.round(minAltitude) : undefined,
    maxAltitude: maxAltitude !== -Infinity ? Math.round(maxAltitude) : undefined,
  };
}

/**
 * Calcula la distancia entre dos puntos usando la fórmula de Haversine
 * Retorna la distancia en kilómetros
 */
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Radio de la Tierra en km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Convierte GPXData a formato compatible con RouteMapEditor
 */
export function gpxToRouteData(gpxData: GPXData) {
  const firstTrack = gpxData.tracks[0];

  if (!firstTrack) {
    throw new Error('El archivo GPX no contiene tracks');
  }

  // Convertir puntos del track a coordenadas [lng, lat]
  const routeCoordinates: [number, number][] = firstTrack.points.map((point) => [
    point.lng,
    point.lat,
  ]);

  // Convertir waypoints a formato de la aplicación
  const waypoints = gpxData.waypoints.map((wpt, index) => ({
    coordinates: {
      latitude: wpt.lat,
      longitude: wpt.lng,
    },
    name: wpt.name || `Waypoint ${index + 1}`,
    description: wpt.desc,
    order: index + 1,
  }));

  // Usar primer punto del track como punto de encuentro si no hay waypoints
  const meetingPoint = routeCoordinates.length > 0 ? {
    coordinates: {
      latitude: routeCoordinates[0][1],
      longitude: routeCoordinates[0][0],
    },
    name: gpxData.metadata?.name || 'Punto de Encuentro',
  } : null;

  return {
    routeCoordinates,
    waypoints,
    meetingPoint,
    stats: {
      distance: firstTrack.totalDistance,
      elevationGain: firstTrack.elevationGain,
      elevationLoss: firstTrack.elevationLoss,
      minAltitude: firstTrack.minAltitude,
      maxAltitude: firstTrack.maxAltitude,
    },
    metadata: gpxData.metadata,
  };
}

/**
 * Exporta datos de ruta a formato GPX
 */
export function exportToGPX(data: {
  name: string;
  description?: string;
  routeCoordinates: [number, number][];
  waypoints?: Array<{
    coordinates: { latitude: number; longitude: number };
    name: string;
    description?: string;
  }>;
  meetingPoint?: {
    coordinates: { latitude: number; longitude: number };
    name?: string;
  };
}): string {
  const { name, description, routeCoordinates, waypoints = [], meetingPoint } = data;

  let gpx = '<?xml version="1.0" encoding="UTF-8"?>\n';
  gpx += '<gpx version="1.1" creator="TrekPeru" xmlns="http://www.topografix.com/GPX/1/1">\n';

  // Metadata
  gpx += '  <metadata>\n';
  gpx += `    <name>${escapeXml(name)}</name>\n`;
  if (description) {
    gpx += `    <desc>${escapeXml(description)}</desc>\n`;
  }
  gpx += `    <time>${new Date().toISOString()}</time>\n`;
  gpx += '  </metadata>\n';

  // Waypoints
  if (meetingPoint) {
    gpx += `  <wpt lat="${meetingPoint.coordinates.latitude}" lon="${meetingPoint.coordinates.longitude}">\n`;
    gpx += `    <name>${escapeXml(meetingPoint.name || 'Punto de Encuentro')}</name>\n`;
    gpx += '    <sym>Flag, Blue</sym>\n';
    gpx += '  </wpt>\n';
  }

  waypoints.forEach((wpt) => {
    gpx += `  <wpt lat="${wpt.coordinates.latitude}" lon="${wpt.coordinates.longitude}">\n`;
    gpx += `    <name>${escapeXml(wpt.name)}</name>\n`;
    if (wpt.description) {
      gpx += `    <desc>${escapeXml(wpt.description)}</desc>\n`;
    }
    gpx += '    <sym>Waypoint</sym>\n';
    gpx += '  </wpt>\n';
  });

  // Track
  if (routeCoordinates.length > 0) {
    gpx += '  <trk>\n';
    gpx += `    <name>${escapeXml(name)}</name>\n`;
    gpx += '    <trkseg>\n';

    routeCoordinates.forEach(([lng, lat]) => {
      gpx += `      <trkpt lat="${lat}" lon="${lng}"/>\n`;
    });

    gpx += '    </trkseg>\n';
    gpx += '  </trk>\n';
  }

  gpx += '</gpx>';

  return gpx;
}

/**
 * Descarga un string como archivo GPX
 */
export function downloadGPX(gpxContent: string, filename: string) {
  const blob = new Blob([gpxContent], { type: 'application/gpx+xml' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.gpx') ? filename : `${filename}.gpx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
