'use client';

import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Loader2, MapPin, X } from 'lucide-react';

interface MapSearchProps {
  onLocationSelect: (lng: number, lat: number, placeName: string) => void;
  placeholder?: string;
  className?: string;
}

interface SearchResult {
  id: string;
  place_name: string;
  center: [number, number]; // [lng, lat]
  place_type: string[];
}

export function MapSearch({ onLocationSelect, placeholder = 'Buscar lugar...', className = '' }: MapSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Cerrar resultados al hacer click fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Buscar con debounce
  useEffect(() => {
    if (query.length < 3) {
      setResults([]);
      setShowResults(false);
      return;
    }

    // Cancelar búsqueda anterior
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Nueva búsqueda después de 300ms
    debounceRef.current = setTimeout(async () => {
      await searchPlaces(query);
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query]);

  async function searchPlaces(searchQuery: string) {
    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

    if (!mapboxToken) {
      console.error('Mapbox token no configurado');
      return;
    }

    setIsSearching(true);

    try {
      // Usar Mapbox Geocoding API
      // Enfocado en Perú para mejores resultados
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json?` +
        `access_token=${mapboxToken}&` +
        `country=PE&` + // Limitar a Perú
        `language=es&` +
        `limit=5`
      );

      if (!response.ok) {
        throw new Error('Error al buscar lugares');
      }

      const data = await response.json();
      setResults(data.features || []);
      setShowResults(true);
    } catch (error) {
      console.error('Error en búsqueda:', error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }

  function handleSelectResult(result: SearchResult) {
    const [lng, lat] = result.center;
    onLocationSelect(lng, lat, result.place_name);
    setQuery('');
    setResults([]);
    setShowResults(false);
  }

  function handleClear() {
    setQuery('');
    setResults([]);
    setShowResults(false);
  }

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
            }
          }}
          placeholder={placeholder}
          className="pl-9 pr-9"
        />
        {query && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
        {isSearching && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Resultados */}
      {showResults && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {results.map((result) => (
            <button
              key={result.id}
              type="button"
              onClick={() => handleSelectResult(result)}
              className="w-full text-left px-4 py-3 hover:bg-accent transition-colors flex items-start gap-2 border-b border-border last:border-0"
            >
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{result.place_name}</p>
                <p className="text-xs text-muted-foreground">
                  {result.center[1].toFixed(4)}, {result.center[0].toFixed(4)}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No hay resultados */}
      {showResults && results.length === 0 && !isSearching && query.length >= 3 && (
        <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg p-4 text-center">
          <p className="text-sm text-muted-foreground">No se encontraron lugares</p>
        </div>
      )}
    </div>
  );
}
