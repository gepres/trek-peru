-- Migración: Registro de asistencia post-trek
-- Fecha: 2026-03-06
-- Descripción: Agrega campos para registrar si cada asistente confirmado
--              realmente asistió o faltó al trek, una vez que la fecha ya pasó.
--              Es independiente del status de inscripción (pending/confirmed/etc.)

-- Campo principal: estado de asistencia real al trek
ALTER TABLE attendees
  ADD COLUMN IF NOT EXISTS attendance_status VARCHAR(20)
    DEFAULT NULL
    CHECK (attendance_status IN ('attended', 'absent'));

-- Fecha en que se registró la asistencia
ALTER TABLE attendees
  ADD COLUMN IF NOT EXISTS attendance_recorded_at TIMESTAMPTZ DEFAULT NULL;

-- Índice para consultar fácilmente asistentes/ausentes por ruta
CREATE INDEX IF NOT EXISTS idx_attendees_attendance_status
  ON attendees(attendance_status);
