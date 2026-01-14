'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Plus, Check } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface EquipmentListProps {
  value: string[];
  onChange: (items: string[]) => void;
  suggestions?: string[];
}

const defaultSuggestions = [
  'Zapatos de trekking',
  'Mochila (30-40L)',
  'Ropa abrigadora',
  'Chaqueta impermeable',
  'Sombrero y protector solar',
  'Agua (2-3 litros)',
  'Snacks y comida',
  'Linterna o frontal',
  'Botiquín de primeros auxilios',
  'Mapa y brújula',
  'Bastones de trekking',
  'Sleeping bag (saco de dormir)',
];

export function EquipmentList({ value, onChange, suggestions = defaultSuggestions }: EquipmentListProps) {
  const [newItem, setNewItem] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleAdd = () => {
    if (newItem.trim() && !value.includes(newItem.trim())) {
      onChange([...value, newItem.trim()]);
      setNewItem('');
    }
  };

  const handleRemove = (item: string) => {
    onChange(value.filter((i) => i !== item));
  };

  const handleAddSuggestion = (suggestion: string) => {
    if (!value.includes(suggestion)) {
      onChange([...value, suggestion]);
    }
  };

  const filteredSuggestions = suggestions.filter(
    (s) => !value.includes(s) && s.toLowerCase().includes(newItem.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Lista de items agregados */}
      {value.length > 0 && (
        <div className="space-y-2">
          {value.map((item, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:bg-accent/5 transition-colors group"
            >
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center">
                  <Check className="h-3 w-3 text-primary" />
                </div>
                <span className="text-sm font-medium">{item}</span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleRemove(item)}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Input para agregar nuevo item */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            type="text"
            value={newItem}
            onChange={(e) => {
              setNewItem(e.target.value);
              setShowSuggestions(e.target.value.length > 0);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAdd();
              }
            }}
            placeholder="Agregar equipo (ej: Zapatos de trekking)"
            onFocus={() => setShowSuggestions(newItem.length > 0)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          />

          {/* Sugerencias dropdown */}
          {showSuggestions && filteredSuggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
              {filteredSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => {
                    handleAddSuggestion(suggestion);
                    setNewItem('');
                  }}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-accent transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>

        <Button
          type="button"
          onClick={handleAdd}
          disabled={!newItem.trim()}
          size="sm"
        >
          <Plus className="h-4 w-4 mr-1" />
          Agregar
        </Button>
      </div>

      {/* Sugerencias rápidas */}
      {value.length === 0 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Sugerencias:</p>
          <div className="flex flex-wrap gap-2">
            {suggestions.slice(0, 6).map((suggestion, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleAddSuggestion(suggestion)}
                className="px-3 py-1 text-xs rounded-full border border-border hover:border-primary hover:bg-primary/5 transition-colors"
              >
                + {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {value.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {value.length} {value.length === 1 ? 'item agregado' : 'items agregados'}
        </p>
      )}
    </div>
  );
}
