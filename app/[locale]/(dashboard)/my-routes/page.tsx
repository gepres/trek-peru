import { Button } from '@/components/ui/button';
import { MyRoutesList } from '@/components/routes/MyRoutesList';
import Link from 'next/link';
import { Plus } from 'lucide-react';

// Página de mis rutas creadas
export default async function MyRoutesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Mis Rutas
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Administra las rutas que has creado
          </p>
        </div>
        <Button asChild>
          <Link href={`/${locale}/routes/new`}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Ruta
          </Link>
        </Button>
      </div>

      <MyRoutesList locale={locale} />
    </div>
  );
}
