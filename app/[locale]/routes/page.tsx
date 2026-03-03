import type { Metadata } from 'next';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { RoutesList } from '@/components/routes/RoutesList';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Plus } from 'lucide-react';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://trek-peru.vercel.app';

// Metadata dinámica bilingüe para el listado de rutas
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isEs = locale === 'es';

  const title = isEs ? 'Rutas de Trekking en Perú' : 'Trekking Routes in Peru';
  const description = isEs
    ? 'Explora cientos de rutas de trekking verificadas en Perú. Filtra por dificultad, región y fecha. Camino Inca, Salkantay, Huaraz y más destinos de aventura.'
    : 'Explore hundreds of verified trekking routes in Peru. Filter by difficulty, region and date. Inca Trail, Salkantay, Huaraz and more adventure destinations.';
  const url = `${APP_URL}/${locale}/routes`;

  return {
    title,
    description,
    keywords: isEs
      ? ['rutas trekking Perú', 'senderismo Perú', 'Camino Inca', 'Salkantay', 'Huaraz trekking', 'Cusco trekking', 'rutas montaña Perú', 'aventura Andes']
      : ['trekking routes Peru', 'hiking Peru', 'Inca Trail', 'Salkantay', 'Huaraz hiking', 'Cusco trekking', 'Peru mountain routes', 'Andes adventure'],
    alternates: {
      canonical: url,
      languages: {
        es: `${APP_URL}/es/routes`,
        en: `${APP_URL}/en/routes`,
        'x-default': `${APP_URL}/es/routes`,
      },
    },
    openGraph: {
      title,
      description,
      url,
      type: 'website',
      locale: isEs ? 'es_PE' : 'en_US',
      alternateLocale: isEs ? 'en_US' : 'es_PE',
      images: [
        {
          url: '/images/logo/logo-trek.png',
          width: 512,
          height: 512,
          alt: isEs ? 'Rutas de Trekking en Perú' : 'Trekking Routes in Peru',
        },
      ],
    },
    twitter: {
      card: 'summary',
      title,
      description,
      images: ['/images/logo/logo-trek.png'],
    },
  };
}

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
