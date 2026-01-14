'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ChevronDown, ChevronUp, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface DayItinerary {
  day: number;
  title: string;
  description: string;
}

interface DailyItineraryProps {
  totalDays: number;
  value: DayItinerary[];
  onChange: (itinerary: DayItinerary[]) => void;
}

export function DailyItinerary({ totalDays, value, onChange }: DailyItineraryProps) {
  const [expandedDay, setExpandedDay] = useState<number | null>(1);

  // Inicializar itinerario si está vacío
  const itinerary: DayItinerary[] = Array.from({ length: totalDays }, (_, i) => {
    const existingDay = value.find((d) => d.day === i + 1);
    return existingDay || {
      day: i + 1,
      title: `Día ${i + 1}`,
      description: '',
    };
  });

  const handleUpdate = (day: number, field: 'title' | 'description', newValue: string) => {
    const updated = itinerary.map((item) =>
      item.day === day ? { ...item, [field]: newValue } : item
    );
    onChange(updated);
  };

  const toggleDay = (day: number) => {
    setExpandedDay(expandedDay === day ? null : day);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">Itinerario por Día</h3>
        <span className="text-xs text-muted-foreground">
          ({totalDays} {totalDays === 1 ? 'día' : 'días'})
        </span>
      </div>

      <div className="space-y-2">
        {itinerary.map((day) => {
          const isExpanded = expandedDay === day.day;
          const hasContent = day.description.trim().length > 0 || day.title !== `Día ${day.day}`;

          return (
            <Card
              key={day.day}
              className={cn(
                'overflow-hidden transition-all',
                isExpanded && 'ring-2 ring-primary/20'
              )}
            >
              <CardHeader
                className="cursor-pointer hover:bg-accent/5 transition-colors p-4"
                onClick={() => toggleDay(day.day)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold',
                        hasContent
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                      )}
                    >
                      {day.day}
                    </div>
                    <div>
                      <CardTitle className="text-base">
                        {day.title || `Día ${day.day}`}
                      </CardTitle>
                      {!isExpanded && day.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                          {day.description}
                        </p>
                      )}
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              </CardHeader>

              {isExpanded && (
                <CardContent className="p-4 pt-0 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor={`day-${day.day}-title`}>
                      Título del Día {day.day}
                    </Label>
                    <input
                      id={`day-${day.day}-title`}
                      type="text"
                      value={day.title}
                      onChange={(e) => handleUpdate(day.day, 'title', e.target.value)}
                      placeholder={`Día ${day.day}: Llegada al campamento base`}
                      className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`day-${day.day}-description`}>
                      Descripción
                    </Label>
                    <Textarea
                      id={`day-${day.day}-description`}
                      value={day.description}
                      onChange={(e) => handleUpdate(day.day, 'description', e.target.value)}
                      placeholder="Describe las actividades, distancia, elevación, puntos de interés..."
                      rows={4}
                      className="resize-none"
                    />
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground">
        Describe cada día del trekking con sus actividades, distancias y puntos destacados
      </p>
    </div>
  );
}
