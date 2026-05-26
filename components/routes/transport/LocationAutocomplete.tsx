'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { MapPin, Loader2, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { geocodeForward, type GeocodeResult } from '@/lib/mapbox/geocoding';
import type { Coordinates } from '@/types/transport.types';
import { cn } from '@/lib/utils/cn';

interface LocationAutocompleteProps {
  value: string;
  onChange: (label: string, coordinates?: Coordinates) => void;
  placeholder?: string;
  initialCoordinates?: Coordinates;
  // Coords para priorizar resultados cercanos (ej. región de la ruta)
  proximity?: Coordinates;
  disabled?: boolean;
  // Opcional, para asociar con <Label htmlFor> externo
  inputId?: string;
}

const DEBOUNCE_MS = 250;
const MIN_QUERY = 2;

// Input con sugerencias de Mapbox Geocoding. Al seleccionar una sugerencia
// llama onChange con el label canónico + coordenadas; si el usuario tipea
// libremente sin elegir, llama onChange con el texto y coordinates=undefined.
export function LocationAutocomplete({
  value,
  onChange,
  placeholder,
  initialCoordinates,
  proximity,
  disabled,
  inputId,
}: LocationAutocompleteProps) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  // Indica si el valor actual proviene de una selección (tiene coords confiables)
  const [hasSelection, setHasSelection] = useState(!!initialCoordinates);
  const abortRef = useRef<AbortController | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync con value externo (ej. al editar un segmento existente)
  useEffect(() => {
    setQuery(value);
    setHasSelection(!!initialCoordinates);
  }, [value, initialCoordinates]);

  // Cerrar dropdown al click fuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const search = useCallback(
    async (q: string) => {
      if (q.trim().length < MIN_QUERY) {
        setResults([]);
        return;
      }
      // Cancelar request previa
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setIsLoading(true);
      try {
        const res = await geocodeForward(q, {
          limit: 6,
          proximity,
          signal: controller.signal,
        });
        if (!controller.signal.aborted) {
          setResults(res);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    },
    [proximity],
  );

  // Debounce de la búsqueda
  useEffect(() => {
    if (!isOpen) return;
    const t = setTimeout(() => void search(query), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [query, isOpen, search]);

  const handleInputChange = (next: string) => {
    setQuery(next);
    setHasSelection(false);
    setIsOpen(true);
    // Propagar el texto libre — coords undefined hasta que elijan una sugerencia
    onChange(next, undefined);
  };

  const handleSelect = (result: GeocodeResult) => {
    setQuery(result.name);
    setHasSelection(true);
    setIsOpen(false);
    onChange(result.name, result.coordinates);
  };

  const handleClear = () => {
    setQuery('');
    setHasSelection(false);
    setResults([]);
    onChange('', undefined);
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Input
          id={inputId}
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
          className={cn(
            hasSelection && 'pr-16',
            !hasSelection && query.length > 0 && 'pr-8',
          )}
        />
        {/* Indicador derecho: spinner / check de coords / clear */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {isLoading && (
            <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
          )}
          {hasSelection && !isLoading && (
            <MapPin className="h-3 w-3 text-emerald-500" />
          )}
          {query.length > 0 && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="text-muted-foreground hover:text-foreground"
              tabIndex={-1}
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* Dropdown de sugerencias */}
      {isOpen && results.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full max-h-72 overflow-y-auto rounded-md border bg-popover shadow-lg">
          {results.map((r) => (
            <li key={r.id}>
              <button
                type="button"
                onClick={() => handleSelect(r)}
                className="w-full text-left px-3 py-2 hover:bg-accent flex items-start gap-2"
              >
                <MapPin className="h-3.5 w-3.5 mt-0.5 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium leading-tight truncate">
                    {r.name}
                  </p>
                  {r.fullName !== r.name && (
                    <p className="text-xs text-muted-foreground truncate">
                      {r.fullName}
                    </p>
                  )}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
