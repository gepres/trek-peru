-- Agregar nuevos campos a la tabla routes
ALTER TABLE routes
ADD COLUMN IF NOT EXISTS duration_type TEXT CHECK (duration_type IN ('hours', 'days')),
ADD COLUMN IF NOT EXISTS duration_value INTEGER,
ADD COLUMN IF NOT EXISTS daily_itinerary JSONB,
ADD COLUMN IF NOT EXISTS google_maps_link TEXT;

-- Comentarios para documentar los campos
COMMENT ON COLUMN routes.duration_type IS 'Tipo de duración: horas o días';
COMMENT ON COLUMN routes.duration_value IS 'Valor numérico de la duración';
COMMENT ON COLUMN routes.daily_itinerary IS 'Itinerario por día en formato JSON array';
COMMENT ON COLUMN routes.google_maps_link IS 'Link de Google Maps (opcional)';
