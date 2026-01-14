'use client';

import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { parseGPX, gpxToRouteData } from '@/lib/utils/gpx-parser';
import { Upload, FileText, X, AlertCircle } from 'lucide-react';
import { MeetingPoint, Waypoint } from '@/types/database.types';

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

export function GPXUpload({ onGPXLoad, onError, className = '' }: GPXUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar que sea un archivo GPX
    if (!file.name.toLowerCase().endsWith('.gpx')) {
      const errorMsg = 'Por favor selecciona un archivo GPX válido';
      setError(errorMsg);
      onError?.(errorMsg);
      return;
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      const errorMsg = 'El archivo es muy grande. Máximo 5MB';
      setError(errorMsg);
      onError?.(errorMsg);
      return;
    }

    setIsLoading(true);
    setError(null);
    setFileName(file.name);

    try {
      // Parsear el archivo GPX
      const gpxData = await parseGPX(file);

      // Convertir a formato de la aplicación
      const routeData = gpxToRouteData(gpxData);

      // Notificar al padre
      onGPXLoad?.(routeData);

      setError(null);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error al procesar el archivo GPX';
      setError(errorMsg);
      onError?.(errorMsg);
      setFileName(null);
    } finally {
      setIsLoading(false);
      // Resetear el input para permitir subir el mismo archivo de nuevo
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveFile = () => {
    setFileName(null);
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
      <input
        ref={fileInputRef}
        type="file"
        accept=".gpx,application/gpx+xml"
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
            {isLoading ? 'Procesando...' : 'Cargar archivo GPX'}
          </Button>
        )}

        {/* Archivo cargado */}
        {fileName && !error && (
          <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <FileText className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0" />
              <span className="text-sm text-green-700 dark:text-green-300 truncate">
                {fileName}
              </span>
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

        {/* Ayuda */}
        <p className="text-xs text-muted-foreground">
          Sube un archivo GPX para importar la ruta automáticamente. Formatos: .gpx (máx. 5MB)
        </p>
      </div>
    </div>
  );
}
