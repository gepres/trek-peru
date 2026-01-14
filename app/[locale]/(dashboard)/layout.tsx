import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

// Layout para páginas del dashboard (protegidas por autenticación)
export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createClient();

  // Verificar autenticación
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Redirigir a login si no está autenticado
  if (!user) {
    redirect(`/${locale}/login`);
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header locale={locale} />
      <main className="flex-1 container mx-auto px-4 pt-24 pb-8">
        {children}
      </main>
      <Footer locale={locale} />
    </div>
  );
}
