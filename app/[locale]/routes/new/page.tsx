import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { RouteFormSteps } from '@/components/routes/RouteFormSteps';

// Página para crear nueva ruta
export default async function NewRoutePage({
  params
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params;
  const supabase = await createClient();

  // Verificar autenticación
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/${locale}/login`);
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header locale={locale} />
      <main className="flex-1 pt-24 pb-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Crear Nueva Ruta
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Comparte una nueva ruta de trekking con la comunidad
            </p>
          </div>

          <RouteFormSteps locale={locale} />
        </div>
      </main>
      <Footer locale={locale} />
    </div>
  );
}
