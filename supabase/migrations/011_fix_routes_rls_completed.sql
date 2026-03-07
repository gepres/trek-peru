-- Migración: Permitir visualización de rutas completadas a todos los usuarios
-- Fecha: 2026-03-06
-- Problema: La política RLS original solo permite SELECT en rutas 'published',
--           dejando las rutas 'completed' invisibles para usuarios que no son el creador.

-- Eliminar la política anterior de SELECT
DROP POLICY IF EXISTS "Routes are viewable by everyone" ON routes;

-- Nueva política: permite ver rutas publicadas O completadas (ambas visibles al público)
-- El creador siempre puede ver todas sus rutas (cualquier estado)
CREATE POLICY "Routes are viewable by everyone"
ON routes FOR SELECT
USING (
  (visibility = 'public' AND status IN ('published', 'completed'))
  OR auth.uid() = creator_id
);
