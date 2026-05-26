-- Cache de sugerencias de transporte generadas por IA (Fase 2).
-- Evita pagar el mismo prompt repetidamente cuando varios usuarios consultan
-- el mismo tramo. Clave: hash de from_normalized + to_normalized.

CREATE TABLE public.transport_ai_cache (
  cache_key TEXT PRIMARY KEY,                          -- sha256(from_norm + '→' + to_norm)
  from_normalized TEXT NOT NULL,
  to_normalized TEXT NOT NULL,
  suggestions JSONB NOT NULL,                          -- array de AggregatedAlternative
  model TEXT NOT NULL,                                 -- "claude-haiku-4-5", "claude-sonnet-4-6", etc.
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL                      -- TTL típico 30 días
);

CREATE INDEX idx_ai_cache_expires ON public.transport_ai_cache(expires_at);
CREATE INDEX idx_ai_cache_from_to
  ON public.transport_ai_cache(from_normalized, to_normalized);

COMMENT ON TABLE public.transport_ai_cache IS
  'Cache de sugerencias IA para tramos de transporte. Reduce costo de API y mejora latencia.';
COMMENT ON COLUMN public.transport_ai_cache.cache_key IS
  'Hash sha256("<from_normalized>→<to_normalized>") — único por par origen/destino.';

-- =============================================================================
-- RLS
-- Lectura pública (cualquier usuario puede leer cache vigente vía la función).
-- Escritura sólo desde el backend (service_role) — ningún cliente puede
-- inyectar sugerencias arbitrarias.
-- =============================================================================
ALTER TABLE public.transport_ai_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "AI cache is readable by everyone"
ON public.transport_ai_cache FOR SELECT
USING (true);

-- No definimos políticas INSERT/UPDATE/DELETE — sin policies, sólo service_role escribe.

-- =============================================================================
-- Función helper: limpia entradas expiradas
-- Llamar manualmente o vía pg_cron / scheduled job.
-- =============================================================================
CREATE OR REPLACE FUNCTION public.cleanup_expired_ai_cache()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.transport_ai_cache WHERE expires_at < NOW();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

REVOKE ALL ON FUNCTION public.cleanup_expired_ai_cache() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_ai_cache() TO service_role;
