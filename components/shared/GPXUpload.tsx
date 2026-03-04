'use client';

// Componente de carga de archivos geoespaciales para importar rutas.
// Soporta tres formatos: GPX, KML y KMZ (Google Earth).
// Produce el mismo formato de datos para todos los formatos.

import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { parseGPX, gpxToRouteData } from '@/lib/utils/gpx-parser';
import { parseKML, parseKMZ, kmlToRouteData } from '@/lib/utils/kmz-parser';
import { Upload, FileText, X, AlertCircle, Map } from 'lucide-react';
import { MeetingPoint, Waypoint } from '@/types/database.types';

// Tipos de archivo soportados
type GeoFileFormat = 'gpx' | 'kml' | 'kmz';

interface GPXUploadProps {
  onGPXLoad?: (data: {
    routeCoordinates: [number, number][];
    waypoints: Waypoint[];
    meetingPoint: MeetingPoint | null;
    stats: {
      distance?: number;
      elevationGain?: number;
      elevationLoss?: number;
      minAltitude?: number;
      maxAltitude?: number;
    };
  }) => void;
  onError?: (error: string) => void;
  className?: string;
}

// Detecta el formato del archivo por extensión
function detectFormat(fileName: string): GeoFileFormat | null {
  const lower = fileName.toLowerCase();
  if (lower.endsWith('.gpx')) return 'gpx';
  if (lower.endsWith('.kml')) return 'kml';
  if (lower.endsWith('.kmz')) return 'kmz';
  return null;
}

// Etiqueta de badge por formato
const FORMAT_BADGE: Record<GeoFileFormat, { label: string; color: string }> = {
  gpx: { label: 'GPX', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  kml: { label: 'KML', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  kmz: { label: 'KMZ', color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400' },
};

export function GPXUpload({ onGPXLoad, onError, className = '' }: GPXUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileFormat, setFileFormat] = useState<GeoFileFormat | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Detectar formato
    const format = detectFormat(file.name);
    if (!format) {
      const errorMsg = 'Formato no soportado. Usa un archivo GPX, KML o KMZ.';
      setError(errorMsg);
      onError?.(errorMsg);
      return;
    }

    // Validar tamaño (máximo 10 MB — KMZ pueden ser más grandes que GPX)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      const errorMsg = 'El archivo es muy grande. Máximo 10 MB.';
      setError(errorMsg);
      onError?.(errorMsg);
      return;
    }

    setIsLoading(true);
    setError(null);
    setFileName(file.name);
    setFileFormat(format);

    try {
      let routeData: ReturnType<typeof gpxToRouteData>;

      if (format === 'gpx') {
        // ── Parseo GPX ──
        const gpxData = await parseGPX(file);
        routeData = gpxToRouteData(gpxData);
      } else if (format === 'kml') {
        // ── Parseo KML ──
        const kmlText = await file.text();
        const kmlData = parseKML(kmlText);
        routeData = kmlToRouteData(kmlData);
      } else {
        // ── Parseo KMZ (ZIP + KML) ──
        const kmlData = await parseKMZ(file);
        routeData = kmlToRouteData(kmlData);
      }

      onGPXLoad?.(routeData);
      setError(null);
    } catch (err) {
      const errorMsg =
        err instanceof Error
          ? err.message
          : `Error al procesar el archivo ${format.toUpperCase()}`;
      setError(errorMsg);
      onError?.(errorMsg);
      setFileName(null);
      setFileFormat(null);
    } finally {
      setIsLoading(false);
      // Resetear input para permitir subir el mismo archivo de nuevo
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveFile = () => {
    setFileName(null);
    setFileFormat(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={className}>
      {/* Input oculto: acepta GPX, KML y KMZ */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".gpx,.kml,.kmz,application/gpx+xml,application/vnd.google-earth.kml+xml,application/vnd.google-earth.kmz"
        onChange={handleFileSelect}
        className="hidden"
      />

      <div className="space-y-3">
        {/* Botón de subir */}
        {!fileName && (
          <Button
            type="button"
            variant="outline"
            onClick={handleButtonClick}
            disabled={isLoading}
            className="w-full"
          >
            <Upload className="h-4 w-4 mr-2" />
            {isLoading ? 'Procesando…' : 'Cargar archivo de ruta'}
          </Button>
        )}

        {/* Archivo cargado con éxito */}
        {fileName && !error && (
          <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Map className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0" />
              <span className="text-sm text-green-700 dark:text-green-300 truncate">
                {fileName}
              </span>
              {fileFormat && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${FORMAT_BADGE[fileFormat].color}`}
                >
                  {FORMAT_BADGE[fileFormat].label}
                </span>
              )}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemoveFile}
              className="shrink-0 h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Estado de carga */}
        {isLoading && (
          <div className="flex items-center gap-2 p-3 bg-muted/50 border border-border rounded-lg">
            <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin shrink-0" />
            <span className="text-sm text-muted-foreground">
              Procesando {fileFormat?.toUpperCase() ?? 'archivo'}…
            </span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              <Button
                type="button"
                variant="link"
                size="sm"
                onClick={handleButtonClick}
                className="h-auto p-0 text-red-600 dark:text-red-400"
              >
                Intentar de nuevo
              </Button>
            </div>
          </div>
        )}

        {/* Texto de ayuda con formatos soportados */}
        <p className="text-xs text-muted-foreground">
          Formatos soportados:{' '}
          <span className="font-medium text-foreground/70">.gpx</span>,{' '}
          <span className="font-medium text-foreground/70">.kml</span>,{' '}
          <span className="font-medium text-foreground/70">.kmz</span>{' '}
          (Google Earth) · Máx. 10 MB
        </p>
      </div>
    </div>
  );
}
