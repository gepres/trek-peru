'use client';

import { useCallback, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { createTransportRepository } from '@/infrastructure/supabase';
import {
  createTransportSegment,
  updateTransportSegment,
  deleteTransportSegment,
  reorderTransportSegments,
  addTransportOption,
  updateTransportOption,
  deleteTransportOption,
} from '@/application/transport';
import type {
  TransportSegment,
  TransportSegmentForm,
  TransportOption,
  TransportOptionForm,
} from '@/types/transport.types';

interface UseTransportEditorReturn {
  isSaving: boolean;
  error: string | null;
  createSegment: (
    data: TransportSegmentForm,
  ) => Promise<TransportSegment | null>;
  updateSegment: (
    id: string,
    data: Partial<TransportSegmentForm>,
  ) => Promise<TransportSegment | null>;
  deleteSegment: (id: string) => Promise<boolean>;
  reorderSegments: (orderedIds: string[]) => Promise<boolean>;
  addOption: (
    segmentId: string,
    data: TransportOptionForm,
  ) => Promise<TransportOption | null>;
  updateOption: (
    optionId: string,
    data: Partial<TransportOptionForm>,
  ) => Promise<TransportOption | null>;
  deleteOption: (optionId: string) => Promise<boolean>;
}

// Hook de mutación: el creador edita tramos y opciones.
// Las RLS de la migración 017 garantizan que sólo el creador de la ruta puede
// modificar; cualquier otro usuario recibirá error de Supabase.
export function useTransportEditor(routeId: string): UseTransportEditorReturn {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const withSaving = useCallback(
    async <T>(fn: () => Promise<T>): Promise<T | null> => {
      try {
        setIsSaving(true);
        setError(null);
        return await fn();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Error guardando';
        console.error('useTransportEditor:', err);
        setError(message);
        return null;
      } finally {
        setIsSaving(false);
      }
    },
    [],
  );

  const repo = () => createTransportRepository(createClient());

  return {
    isSaving,
    error,

    createSegment: (data) =>
      withSaving(() => createTransportSegment(repo(), routeId, data)),

    updateSegment: (id, data) =>
      withSaving(() => updateTransportSegment(repo(), id, data)),

    deleteSegment: async (id) => {
      const result = await withSaving(async () => {
        await deleteTransportSegment(repo(), id);
        return true;
      });
      return result ?? false;
    },

    reorderSegments: async (orderedIds) => {
      const result = await withSaving(async () => {
        await reorderTransportSegments(repo(), routeId, orderedIds);
        return true;
      });
      return result ?? false;
    },

    addOption: (segmentId, data) =>
      withSaving(() => addTransportOption(repo(), segmentId, data)),

    updateOption: (optionId, data) =>
      withSaving(() => updateTransportOption(repo(), optionId, data)),

    deleteOption: async (optionId) => {
      const result = await withSaving(async () => {
        await deleteTransportOption(repo(), optionId);
        return true;
      });
      return result ?? false;
    },
  };
}
