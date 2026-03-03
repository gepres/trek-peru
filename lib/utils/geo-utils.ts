// Utilidades de geometría geoespacial compartidas entre RouteMap y RouteMapEditor.
// Supabase/PostgREST devuelve columnas GEOGRAPHY como WKB hex (Extended Well-Known Binary).

// Decodifica WKB hex (Extended Well-Known Binary) que devuelve Supabase/PostgREST
// para columnas GEOGRAPHY. Formato EWKB little-endian:
//   [1B orden] [4B tipo+flags] [4B SRID si flag] [4B numPuntos] [16B por punto (lng,lat doubles)]
export function parseWKBHex(hex: string): [number, number][] | null {
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
// Soporta: WKB hex (Supabase PostgREST), GeoJSON object, JSON string, EWKT string.
export function parseRouteCoordinates(
  data: any
): { type: string; coordinates: [number, number][] } | null {
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
