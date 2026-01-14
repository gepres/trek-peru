'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { MapPin, Navigation } from 'lucide-react';

interface CoordinateInputProps {
  onCoordinatesSubmit: (lng: number, lat: number) => void;
  className?: string;
}

export function CoordinateInput({ onCoordinatesSubmit, className = '' }: CoordinateInputProps) {
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(e?: React.FormEvent | React.MouseEvent | React.KeyboardEvent) {
    if (e) {
      e.preventDefault();
    }
    setError('');

    // Validar que hay valores
    if (!latitude || !longitude) {
      setError('Ingresa latitud y longitud');
      return;
    }

    // Convertir a números
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    // Validar rangos
    if (isNaN(lat) || isNaN(lng)) {
      setError('Coordenadas inválidas');
      return;
    }

    if (lat < -90 || lat > 90) {
      setError('Latitud debe estar entre -90 y 90');
      return;
    }

    if (lng < -180 || lng > 180) {
      setError('Longitud debe estar entre -180 y 180');
      return;
    }

    // Enviar coordenadas
    onCoordinatesSubmit(lng, lat);

    // Limpiar inputs
    setLatitude('');
    setLongitude('');
    setError('');
  }

  return (
    <div className={className}>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label htmlFor="latitude" className="text-xs">Latitud</Label>
            <Input
              id="latitude"
              type="text"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder="-9.19"
              className="text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="longitude" className="text-xs">Longitud</Label>
            <Input
              id="longitude"
              type="text"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder="-75.01"
              className="text-sm"
            />
          </div>
        </div>

        {error && (
          <p className="text-xs text-destructive">{error}</p>
        )}

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full"
          onClick={handleSubmit}
        >
          <Navigation className="h-4 w-4 mr-2" />
          Ir a coordenadas
        </Button>

        <p className="text-xs text-muted-foreground">
          Ejemplo: Lat -9.19, Lng -75.01 (Lima, Perú)
        </p>
      </div>
    </div>
  );
}
