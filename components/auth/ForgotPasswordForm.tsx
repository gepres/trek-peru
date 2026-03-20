'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ForgotPasswordFormProps {
  locale: string;
}

// Formulario para solicitar restablecimiento de contraseña
export function ForgotPasswordForm({ locale }: ForgotPasswordFormProps) {
  const t = useTranslations('auth');
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Apuntar al callback PKCE que intercambia el código por sesión
    // y luego redirige a reset-password con sesión ya establecida
    const redirectTo = `${window.location.origin}/api/auth/callback?next=/${locale}/reset-password&locale=${locale}&type=recovery`;

    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });

    setIsLoading(false);

    if (error) {
      setError(t('errors.resetPasswordError'));
      return;
    }

    setSent(true);
  }

  if (sent) {
    return (
      <div className="space-y-4 text-center">
        <div className="text-4xl">📧</div>
        <h3 className="text-lg font-semibold">{t('resetLinkSent')}</h3>
        <p className="text-sm text-muted-foreground">{t('resetLinkSentDesc')}</p>
        <a href={`/${locale}/login`} className="block text-sm text-primary hover:underline">
          {t('backToLogin')}
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">{t('email')}</Label>
        <Input
          id="email"
          type="email"
          placeholder="correo@ejemplo.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isLoading}
        />
      </div>

      {error && (
        <div className="p-3 rounded-md bg-red-50 border border-red-200">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <Button type="submit" className="w-full" disabled={isLoading || !email}>
        {isLoading ? t('loading') : t('sendResetLink')}
      </Button>
    </form>
  );
}
