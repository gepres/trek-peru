import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { RegisterForm } from '@/components/auth/RegisterForm';
import Link from 'next/link';

// Página de registro
export default async function RegisterPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Crear Cuenta</CardTitle>
        <CardDescription>
          Regístrate para comenzar a compartir tus rutas
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RegisterForm locale={locale} />
      </CardContent>
      <CardFooter className="flex flex-col space-y-4">
        <div className="text-sm text-center w-full">
          ¿Ya tienes cuenta?{' '}
          <Link href={`/${locale}/login`} className="text-primary hover:underline font-medium">
            Inicia sesión aquí
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
