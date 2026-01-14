import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { RoutesList } from '@/components/routes/RoutesList';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Plus } from 'lucide-react';

// Página de listado de rutas
export default async function RoutesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header locale={locale} />
      <main className="flex-1 pt-24 pb-8">
        <div className="max-w-[1440px] mx-auto px-4 md:px-8">
          {/* Header Section */}
          <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Rutas de Trekking
              </h1>
              <p className="text-muted-foreground">
                Explora rutas de trekking en todo Perú
              </p>
            </div>
            <Button asChild className="shrink-0">
              <Link href={`/${locale}/routes/new`}>
                <Plus className="h-4 w-4 mr-2" />
                Nueva Ruta
              </Link>
            </Button>
          </div>

          {/* Routes List with Filters Sidebar */}
          <RoutesList locale={locale} />
        </div>
      </main>
      <Footer locale={locale} />
    </div>
  );
}
