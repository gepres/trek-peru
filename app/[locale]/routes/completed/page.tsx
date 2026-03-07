import type { Metadata } from 'next';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { CompletedRoutesList } from '@/components/routes/CompletedRoutesList';
import { History } from 'lucide-react';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://trek-peru.vercel.app';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isEs = locale === 'es';

  const title = isEs ? 'Rutas Completadas en Perú' : 'Completed Trekking Routes in Peru';
  const description = isEs
    ? 'Explora rutas de trekking ya realizadas en Perú. Revive aventuras pasadas y encuentra inspiración para tu próxima expedición.'
    : 'Explore completed trekking routes in Peru. Relive past adventures and find inspiration for your next expedition.';
  const url = `${APP_URL}/${locale}/routes/completed`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: {
        es: `${APP_URL}/es/routes/completed`,
        en: `${APP_URL}/en/routes/completed`,
        'x-default': `${APP_URL}/es/routes/completed`,
      },
    },
    openGraph: {
      title,
      description,
      url,
      type: 'website',
      locale: isEs ? 'es_PE' : 'en_US',
      images: [{ url: '/images/logo/logo-trek.png', width: 512, height: 512 }],
    },
  };
}

export default async function CompletedRoutesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header locale={locale} />
      <main className="flex-1 pt-24 pb-8">
        <div className="max-w-[1440px] mx-auto px-4 md:px-8">

          {/* Cabecera */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30">
                <History className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <h1 className="text-3xl font-bold text-foreground">Rutas Completadas</h1>
            </div>
            <p className="text-muted-foreground ml-[52px]">
              Trekking ya realizados — solo lectura, sin inscripciones
            </p>
          </div>

          <CompletedRoutesList locale={locale} />
        </div>
      </main>
      <Footer locale={locale} />
    </div>
  );
}
