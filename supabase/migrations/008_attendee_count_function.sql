-- Migración: Función pública para obtener conteo de asistentes de una ruta
-- Fecha: 2026-03-01
-- Descripción: La política RLS de `attendees` solo permite SELECT al creador y al
--              propio asistente. Esto causa que LiveCapacity muestre siempre 0 para
--              usuarios nuevos o anónimos. Se crea una función SECURITY DEFINER que
--              bypasea RLS y devuelve el conteo real de asistentes activos.

CREATE OR REPLACE FUNCTION public.get_route_attendee_count(p_route_id UUID)
RETURNS INTEGER
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(COUNT(*)::INTEGER, 0)
  FROM public.attendees
  WHERE route_id = p_route_id
    AND status != 'cancelled';
$$;

-- Permitir que cualquier usuario (logueado o anónimo) llame a esta función
GRANT EXECUTE ON FUNCTION public.get_route_attendee_count(UUID) TO anon, authenticated;
