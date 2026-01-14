import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { RouteFormSteps } from '@/components/routes/RouteFormSteps';

// Página para editar ruta existente
export default async function EditRoutePage({
  params
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { locale, id } = await params;
  const supabase = await createClient();

  // Verificar autenticación
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/${locale}/login`);
  }

  // Obtener la ruta
  const { data: route, error } = await supabase
    .from('routes')
    .select('*')
    .eq('slug', id)
    .single();

  if (error || !route) {
    notFound();
  }

  // Verificar que el usuario es el creador
  if (route.creator_id !== user.id) {
    redirect(`/${locale}/routes/${id}`);
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header locale={locale} />
      <main className="flex-1 pt-24 pb-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Editar Ruta
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Actualiza la información de tu ruta
            </p>
          </div>

          <RouteFormSteps route={route} locale={locale} />
        </div>
      </main>
      <Footer locale={locale} />
    </div>
  );
}
