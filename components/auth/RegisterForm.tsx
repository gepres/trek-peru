'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Eye, EyeOff, Mail, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { registerSchema, type RegisterInput } from '@/lib/validations/user.schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';

interface RegisterFormProps {
  locale: string;
}

// Formulario de registro de usuario
export function RegisterForm({ locale }: RegisterFormProps) {
  const t = useTranslations('auth');
  const router = useRouter();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  // Email registrado: se usa para mostrar la pantalla de confirmación
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { phone: '+51' },
  });

  // Manejar envío del formulario
  async function onSubmit(data: RegisterInput) {
    try {
      setIsLoading(true);
      setError(null);

      // Registrar usuario en Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.full_name,
            username: data.username,
            phone: data.phone,
          },
        },
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      // Guardar teléfono en el perfil como respaldo al trigger.
      // Solo cuando hay sesión activa (sin email confirmation) — el trigger
      // migration 007 ya guarda el phone en el INSERT automáticamente.
      if (authData.user && authData.session) {
        await supabase
          .from('profiles')
          .update({ phone: data.phone })
          .eq('id', authData.user.id);
      }

      // Sin sesión → Supabase requiere confirmación de email
      // Mostrar pantalla de "revisa tu correo" en lugar de redirigir
      if (!authData.session) {
        setRegisteredEmail(data.email);
        return;
      }

      // Con sesión activa → registro sin confirmación, redirigir directamente
      toast({
        title: '¡Bienvenido a TrekPeru! 🏔️',
        description: 'Tu cuenta ha sido creada exitosamente.',
      });
      router.push(`/${locale}/routes`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  }

  // ── Pantalla de éxito: confirmar correo ─────────────────────────────────────
  if (registeredEmail) {
    return (
      <div className="text-center space-y-5 py-4">
        {/* Ícono animado */}
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mx-auto">
          <Mail className="h-8 w-8 text-primary" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold">Revisa tu correo</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Enviamos un enlace de confirmación a
          </p>
          <p className="font-semibold text-primary break-all">{registeredEmail}</p>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Haz clic en el enlace del correo para activar tu cuenta y poder ingresar.
          </p>
        </div>

        {/* Tips */}
        <div className="text-left space-y-2 p-4 rounded-lg bg-muted/50 border">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            ¿No ves el correo?
          </p>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              Revisa la carpeta de <strong>spam o correo no deseado</strong>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              El enlace expira en <strong>24 horas</strong>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              Verifica que el correo <strong>{registeredEmail}</strong> sea correcto
            </li>
          </ul>
        </div>

        <Button
          variant="outline"
          className="w-full"
          onClick={() => setRegisteredEmail(null)}
        >
          Volver al registro
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Full Name */}
      <div className="space-y-2">
        <Label htmlFor="full_name">{t('fullName')}</Label>
        <Input
          id="full_name"
          type="text"
          placeholder="Nombre completo"
          {...register('full_name')}
          disabled={isLoading}
        />
        {errors.full_name && (
          <p className="text-sm text-red-600">{errors.full_name.message}</p>
        )}
      </div>

      {/* Username */}
      <div className="space-y-2">
        <Label htmlFor="username">{t('username')}</Label>
        <Input
          id="username"
          type="text"
          placeholder="nombre_usuario"
          {...register('username')}
          disabled={isLoading}
        />
        {errors.username && (
          <p className="text-sm text-red-600">{errors.username.message}</p>
        )}
      </div>

      {/* Phone — prefijo +51 fijo, el usuario escribe solo los 9 dígitos */}
      <div className="space-y-2">
        <Label htmlFor="phone" className="flex items-center gap-1.5">
          {t('phone')}
        </Label>
        {/* Número completo editable — pre-relleno con +51 */}
        <Input
          id="phone"
          type="tel"
          inputMode="tel"
          placeholder="+51 987 654 321"
          {...register('phone')}
          disabled={isLoading}
        />
        {errors.phone ? (
          <p className="text-sm text-red-600">{errors.phone.message}</p>
        ) : (
          <p className="text-xs text-muted-foreground">{t('phoneHint')}</p>
        )}
      </div>

      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="email">{t('email')}</Label>
        <Input
          id="email"
          type="email"
          placeholder="correo@ejemplo.com"
          {...register('email')}
          disabled={isLoading}
        />
        {errors.email && (
          <p className="text-sm text-red-600">{errors.email.message}</p>
        )}
      </div>

      {/* Password */}
      <div className="space-y-2">
        <Label htmlFor="password">{t('password')}</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            {...register('password')}
            disabled={isLoading}
            className="pr-10"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4 text-gray-500" />
            ) : (
              <Eye className="h-4 w-4 text-gray-500" />
            )}
            <span className="sr-only">{showPassword ? 'Hide password' : 'Show password'}</span>
          </Button>
        </div>
        {errors.password && (
          <p className="text-sm text-red-600">{errors.password.message}</p>
        )}
      </div>

      {/* Confirm Password */}
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">{t('confirmPassword')}</Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="••••••••"
            {...register('confirmPassword')}
            disabled={isLoading}
            className="pr-10"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            tabIndex={-1}
          >
            {showConfirmPassword ? (
              <EyeOff className="h-4 w-4 text-gray-500" />
            ) : (
              <Eye className="h-4 w-4 text-gray-500" />
            )}
            <span className="sr-only">{showConfirmPassword ? 'Hide password' : 'Show password'}</span>
          </Button>
        </div>
        {errors.confirmPassword && (
          <p className="text-sm text-red-600">{errors.confirmPassword.message}</p>
        )}
      </div>

      {/* Error general */}
      {error && (
        <div className="p-3 rounded-md bg-red-50 border border-red-200">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Botón de submit */}
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Cargando...' : t('register')}
      </Button>
    </form>
  );
}
