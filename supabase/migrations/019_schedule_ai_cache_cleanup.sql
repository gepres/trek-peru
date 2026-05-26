-- Programa la limpieza automática del cache de IA usando pg_cron.
-- Ejecuta cleanup_expired_ai_cache() cada domingo a las 03:00 UTC.
--
-- Requisito: pg_cron debe estar disponible en el proyecto Supabase.
-- En proyectos nuevos viene preinstalado; en planos hobby puede requerir
-- habilitarlo desde Dashboard → Database → Extensions → pg_cron.

CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Desprogramar el job si ya existía (idempotente al reaplicar migraciones)
DO $$
BEGIN
  PERFORM cron.unschedule('cleanup_transport_ai_cache');
EXCEPTION
  WHEN OTHERS THEN
    -- No existe → ignorar
    NULL;
END $$;

-- Programar el job: domingo 03:00 UTC
SELECT cron.schedule(
  'cleanup_transport_ai_cache',
  '0 3 * * 0',
  $$SELECT public.cleanup_expired_ai_cache();$$
);

COMMENT ON EXTENSION pg_cron IS
  'Scheduler para jobs SQL recurrentes. Usado para limpiar cache IA expirado semanalmente.';
