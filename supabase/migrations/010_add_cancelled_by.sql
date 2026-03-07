-- Migración: Distinguir quién canceló la inscripción
-- Fecha: 2026-03-06
-- 'attendee' = el propio asistente canceló (estando confirmado)
-- 'creator'  = el creador de la ruta rechazó la solicitud
-- NULL       = cancelación legacy o asistente canceló estando pendiente (registro eliminado)

ALTER TABLE attendees
  ADD COLUMN IF NOT EXISTS cancelled_by VARCHAR(10)
    DEFAULT NULL
    CHECK (cancelled_by IN ('attendee', 'creator'));

CREATE INDEX IF NOT EXISTS idx_attendees_cancelled_by
  ON attendees(cancelled_by);
