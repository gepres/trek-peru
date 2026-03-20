import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';
import { getTranslations } from 'next-intl/server';

// Página para establecer la nueva contraseña (destino del enlace enviado por email)
export default async function ResetPasswordPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations('auth');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">{t('resetPassword')}</CardTitle>
        <CardDescription>
          Ingresa tu nueva contraseña para restablecer el acceso a tu cuenta.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResetPasswordForm locale={locale} />
      </CardContent>
    </Card>
  );
}
