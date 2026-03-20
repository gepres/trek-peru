import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

// Página para solicitar restablecimiento de contraseña
export default async function ForgotPasswordPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations('auth');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">{t('resetPassword')}</CardTitle>
        <CardDescription>
          Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ForgotPasswordForm locale={locale} />
      </CardContent>
      <CardFooter className="justify-center">
        <Link href={`/${locale}/login`} className="text-sm text-muted-foreground hover:text-primary">
          ← {t('backToLogin')}
        </Link>
      </CardFooter>
    </Card>
  );
}
