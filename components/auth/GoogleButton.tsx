'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';

interface GoogleButtonProps {
  locale: string;
  label?: string;
}

// Botón para iniciar sesión con Google via OAuth
export function GoogleButton({ locale, label = 'Continuar con Google' }: GoogleButtonProps) {
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);

  async function handleGoogleLogin() {
    try {
      setIsLoading(true);

      // redirectTo apunta al callback que verifica si el perfil está completo
      const redirectTo = `${window.location.origin}/api/auth/callback?next=/${locale}/routes&locale=${locale}`;

      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo },
      });
    } catch {
      setIsLoading(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full flex items-center gap-3"
      onClick={handleGoogleLogin}
      disabled={isLoading}
    >
      {/* Logo SVG de Google */}
      <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
        <path
          fill="#4285F4"
          d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"
        />
        <path
          fill="#34A853"
          d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2.04a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z"
        />
        <path
          fill="#FBBC05"
          d="M4.5 10.48A4.8 4.8 0 0 1 4.5 7.5V5.43H1.83a8 8 0 0 0 0 7.14z"
        />
        <path
          fill="#EA4335"
          d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.43L4.5 7.5a4.77 4.77 0 0 1 4.48-3.32z"
        />
      </svg>
      {isLoading ? 'Redirigiendo...' : label}
    </Button>
  );
}
