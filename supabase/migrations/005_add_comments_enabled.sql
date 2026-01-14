-- Agregar campo para habilitar/deshabilitar comentarios en rutas
ALTER TABLE routes
ADD COLUMN IF NOT EXISTS comments_enabled BOOLEAN DEFAULT true;

-- Comentario para documentar el campo
COMMENT ON COLUMN routes.comments_enabled IS 'Indica si los comentarios están habilitados para esta ruta';
