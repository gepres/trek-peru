'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Edit2, Eye } from 'lucide-react';
import { HowToGetThere } from './HowToGetThere';
import { TransportEditor } from './TransportEditor';

interface HowToGetThereTabProps {
  routeId: string;
  isCreator: boolean;
  // Punto de encuentro de la ruta para calcular el tramo final automático
  meetingPoint?: {
    coordinates?: { latitude: number; longitude: number };
    name?: string;
  };
}

// Wrapper que decide entre vista pública y editor según si el usuario es el creador.
// El creador puede alternar entre los dos modos con un toggle.
export function HowToGetThereTab({
  routeId,
  isCreator,
  meetingPoint,
}: HowToGetThereTabProps) {
  const t = useTranslations('howToGetThere');
  const [mode, setMode] = useState<'view' | 'edit'>('view');

  if (!isCreator) {
    return <HowToGetThere routeId={routeId} meetingPoint={meetingPoint} />;
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setMode(mode === 'view' ? 'edit' : 'view')}
        >
          {mode === 'view' ? (
            <>
              <Edit2 className="h-4 w-4 mr-2" />
              {t('editButton')}
            </>
          ) : (
            <>
              <Eye className="h-4 w-4 mr-2" />
              {t('previewButton')}
            </>
          )}
        </Button>
      </div>
      {mode === 'view' ? (
        <HowToGetThere routeId={routeId} meetingPoint={meetingPoint} />
      ) : (
        <TransportEditor routeId={routeId} />
      )}
    </div>
  );
}
