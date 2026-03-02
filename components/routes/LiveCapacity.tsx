'use client';

import { useState, useEffect, useCallback } from 'react';
import { Users } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface LiveCapacityProps {
  routeId: string;
  maxCapacity: number;
  initialCount: number;
}

// Intervalo de polling en ms (el Realtime de attendees está bloqueado por RLS
// para usuarios que no son el creador ni asistente)
const POLL_INTERVAL_MS = 15_000;

// Muestra el conteo real de asistentes usando una función SECURITY DEFINER
// que bypasea RLS, actualizable para cualquier tipo de usuario
export function LiveCapacity({ routeId, maxCapacity, initialCount }: LiveCapacityProps) {
  const [count, setCount] = useState(initialCount);
  const supabase = createClient();

  // Llama a la función get_route_attendee_count (SECURITY DEFINER → sin RLS)
  const fetchCount = useCallback(async () => {
    const { data, error } = await supabase.rpc('get_route_attendee_count', {
      p_route_id: routeId,
    });
    if (!error && data !== null) {
      setCount(data as number);
    }
  }, [routeId]);

  useEffect(() => {
    // Fetch inmediato al montar — el initialCount puede ser 0 por RLS en SSR
    fetchCount();

    // Polling cada 15 segundos para reflejar inscripciones recientes
    const interval = setInterval(fetchCount, POLL_INTERVAL_MS);

    // Refetch cuando la pestaña vuelve a estar activa
    function handleVisibility() {
      if (document.visibilityState === 'visible') fetchCount();
    }
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [fetchCount]);

  const percentage = Math.min((count / maxCapacity) * 100, 100);
  const isFull = count >= maxCapacity;

  return (
    <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
      <Users className="h-5 w-5 text-primary mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">Capacidad</p>
        <div className="flex items-center gap-2">
          <p className="font-medium">
            <span className={isFull ? 'text-red-500 font-bold' : ''}>{count}</span>
            {' / '}
            {maxCapacity}
            <span className="text-sm font-normal text-muted-foreground"> inscritos</span>
          </p>
          {isFull && (
            <span className="text-xs font-semibold text-white bg-red-500 px-1.5 py-0.5 rounded">
              LLENO
            </span>
          )}
        </div>
        <div className="mt-1.5 h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isFull ? 'bg-red-500' : percentage >= 80 ? 'bg-orange-500' : 'bg-primary'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
}
