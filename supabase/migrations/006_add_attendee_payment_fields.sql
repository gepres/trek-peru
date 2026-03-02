-- Migración: Agregar campos de pago y mensaje del creador a la tabla attendees
-- Fecha: 2026-03-01
-- Descripción: La tabla attendees necesita payment_status y creator_message
--              para el sistema de inscripciones avanzado.

-- Agregar columna payment_status
ALTER TABLE attendees
  ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20)
    NOT NULL
    DEFAULT 'unpaid'
    CHECK (payment_status IN ('unpaid', 'pending_payment', 'paid'));

-- Agregar columna creator_message (mensaje del organizador al asistente)
ALTER TABLE attendees
  ADD COLUMN IF NOT EXISTS creator_message TEXT;

-- Índice para filtrar por estado de pago fácilmente
CREATE INDEX IF NOT EXISTS idx_attendees_payment_status
  ON attendees(payment_status);
