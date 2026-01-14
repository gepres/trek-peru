import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { LoginForm } from '@/components/auth/LoginForm';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

// Página de login
export default async function LoginPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Iniciar Sesión</CardTitle>
        <CardDescription>
          Ingresa tus credenciales para acceder a tu cuenta
        </CardDescription>
      </CardHeader>
      <CardContent>
        <LoginForm locale={locale} />
      </CardContent>
      <CardFooter className="flex flex-col space-y-4">
        <div className="text-sm text-center w-full">
          ¿No tienes cuenta?{' '}
          <Link href={`/${locale}/register`} className="text-primary hover:underline font-medium">
            Regístrate aquí
          </Link>
        </div>
        <div className="text-sm text-center w-full">
          <Link href={`/${locale}`} className="text-muted-foreground hover:text-primary">
            ← Volver al inicio
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}
