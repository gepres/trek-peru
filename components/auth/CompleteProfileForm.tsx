'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { completeProfileSchema, type CompleteProfileInput } from '@/lib/validations/user.schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface CompleteProfileFormProps {
  locale: string;
  userId: string;
  defaultUsername?: string;
}

// Formulario post-Google para capturar username y teléfono
export function CompleteProfileForm({ locale, userId, defaultUsername = '' }: CompleteProfileFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CompleteProfileInput>({
    resolver: zodResolver(completeProfileSchema),
    defaultValues: {
      username: defaultUsername,
      phone: '+51',
    },
  });

  async function onSubmit(data: CompleteProfileInput) {
    try {
      setIsLoading(true);
      setError(null);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          username: data.username,
          phone: data.phone,
        })
        .eq('id', userId);

      if (updateError) {
        // Detectar username duplicado
        if (updateError.message.includes('duplicate') || updateError.message.includes('unique')) {
          setError('Ese nombre de usuario ya está en uso. Elige otro.');
        } else {
          setError('Error al guardar el perfil. Intenta de nuevo.');
        }
        return;
      }

      // Redirigir al dashboard tras completar perfil
      router.push(`/${locale}/routes`);
      router.refresh();
    } catch {
      setError('Error inesperado. Intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Username */}
      <div className="space-y-2">
        <Label htmlFor="username">Nombre de usuario</Label>
        <Input
          id="username"
          type="text"
          placeholder="mi_nombre_usuario"
          {...register('username')}
          disabled={isLoading}
        />
        <p className="text-xs text-muted-foreground">
          Letras, números, guiones y guiones bajos. Mínimo 3 caracteres.
        </p>
        {errors.username && (
          <p className="text-sm text-red-600">{errors.username.message}</p>
        )}
      </div>

      {/* Phone */}
      <div className="space-y-2">
        <Label htmlFor="phone">Teléfono de contacto</Label>
        <Input
          id="phone"
          type="tel"
          inputMode="tel"
          placeholder="+51 987 654 321"
          {...register('phone')}
          disabled={isLoading}
        />
        <p className="text-xs text-muted-foreground">
          Formato: +51 seguido de 9 dígitos. Lo usará el organizador para coordinar la ruta.
        </p>
        {errors.phone && (
          <p className="text-sm text-red-600">{errors.phone.message}</p>
        )}
      </div>

      {/* Error general */}
      {error && (
        <div className="p-3 rounded-md bg-red-50 border border-red-200">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Guardando...' : 'Completar perfil'}
      </Button>
    </form>
  );
}
