'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Share2, Check, Copy } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface ShareButtonProps {
  title: string;
  description?: string;
  url?: string; // si no se pasa, usa window.location.href
}

export function ShareButton({ title, description, url }: ShareButtonProps) {
  const t = useTranslations('share');
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const shareUrl = url ?? window.location.href;

    // Web Share API — disponible en móvil y algunos navegadores modernos
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title,
          text: description ?? t('shareText', { title }),
          url: shareUrl,
        });
        return;
      } catch (err) {
        // El usuario canceló el diálogo nativo → no hacemos nada
        if (err instanceof Error && err.name === 'AbortError') return;
        // Cualquier otro error → fallback a copiar
      }
    }

    // Fallback: copiar URL al portapapeles
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast({
        title: t('linkCopied'),
        description: t('linkCopiedDesc'),
      });
      // Resetear icono después de 2 segundos
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: t('couldNotCopy'),
        description: t('couldNotCopyDesc'),
        variant: 'destructive',
      });
    }
  }

  return (
    <Button
      variant="secondary"
      size="icon"
      className="shadow-lg"
      onClick={handleShare}
      title={t('shareRoute')}
    >
      {copied ? (
        <Check className="h-4 w-4 text-green-600" />
      ) : (
        <Share2 className="h-4 w-4" />
      )}
    </Button>
  );
}
