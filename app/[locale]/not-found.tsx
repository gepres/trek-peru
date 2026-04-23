import Link from 'next/link';
import Image from 'next/image';
import { getTranslations, getLocale } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Mountain,
  Home,
  Search,
  Plus,
  MessageCircle,
  ArrowRight,
  MapPin,
  TrendingUp,
} from 'lucide-react';
import type { Metadata } from 'next';

// No indexar ninguna variante del 404 — evita que Google guarde "Página no encontrada" en el índice
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: true,
  },
};

// Página 404 global para cualquier ruta bajo /[locale]/* no encontrada.
// Server Component — permite fetching de rutas populares desde Supabase.
export default async function NotFound() {
  const locale = await getLocale();
  const t = await getTranslations('notFoundPage');

  // Traer 3 rutas populares para ofrecer caminos de recuperación relevantes
  const supabase = await createClient();
  const { data: popularRoutes } = await supabase
    .from('routes')
    .select('slug, title, region, difficulty, featured_image, distance')
    .eq('status', 'published')
    .eq('visibility', 'public')
    .order('views', { ascending: false, nullsFirst: false })
    .limit(3);

  const actions = [
    {
      href: `/${locale}/routes`,
      Icon: Search,
      title: t('exploreRoutes'),
      desc: t('exploreRoutesDesc'),
      primary: true,
    },
    {
      href: `/${locale}`,
      Icon: Home,
      title: t('goHome'),
      desc: t('goHomeDesc'),
    },
    {
      href: `/${locale}/routes/new`,
      Icon: Plus,
      title: t('createRoute'),
      desc: t('createRouteDesc'),
    },
    {
      href: `/${locale}/contact`,
      Icon: MessageCircle,
      title: t('contact'),
      desc: t('contactDesc'),
    },
  ];

  const difficultyColors: Record<string, string> = {
    easy: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    moderate: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    hard: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
    extreme: 'bg-red-500/10 text-red-600 border-red-500/20',
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header locale={locale} />

      <main className="flex-1 pt-24 pb-16">
        {/* Hero 404 — montaña estilizada con gradient y patrón de puntos */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
          <div
            className="absolute inset-0 opacity-[0.05] dark:opacity-[0.08]"
            style={{
              backgroundImage:
                'radial-gradient(circle, currentColor 1.5px, transparent 1.5px)',
              backgroundSize: '32px 32px',
            }}
          />

          <div className="relative max-w-4xl mx-auto px-4 py-16 md:py-24 text-center">
            {/* Icono animado */}
            <div className="relative w-32 h-32 md:w-40 md:h-40 mx-auto mb-8">
              <div className="absolute inset-0 bg-primary/10 rounded-full animate-pulse" />
              <div className="absolute inset-4 bg-primary/15 rounded-full animate-pulse [animation-delay:150ms]" />
              <div className="absolute inset-8 bg-primary/20 rounded-full animate-pulse [animation-delay:300ms]" />
              <Mountain className="absolute inset-0 m-auto h-16 w-16 md:h-20 md:w-20 text-primary" />
            </div>

            <Badge variant="outline" className="mb-4 text-sm font-semibold tracking-wider">
              {t('badge')}
            </Badge>

            <h1 className="text-4xl md:text-6xl font-black mb-6 bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
              {t('heading')}
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
              {t('description')}
            </p>

            {/* CTA principal */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild size="lg" className="shadow-lg shadow-primary/20">
                <Link href={`/${locale}/routes`}>
                  <Search className="h-4 w-4 mr-2" />
                  {t('exploreRoutes')}
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href={`/${locale}`}>
                  <Home className="h-4 w-4 mr-2" />
                  {t('goHome')}
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Grid de acciones secundarias */}
        <section className="max-w-5xl mx-auto px-4 py-12">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">
            {t('suggestionsTitle')}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {actions.map(({ href, Icon, title, desc, primary }) => (
              <Link
                key={href}
                href={href}
                className={`group relative flex flex-col p-6 rounded-2xl border bg-card transition-all duration-300 hover:-translate-y-1 ${
                  primary
                    ? 'border-primary/30 hover:border-primary/60 hover:shadow-xl hover:shadow-primary/15'
                    : 'border-border hover:border-primary/30 hover:shadow-lg'
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors ${
                    primary
                      ? 'bg-primary/15 group-hover:bg-primary/25'
                      : 'bg-muted group-hover:bg-primary/10'
                  }`}
                >
                  <Icon
                    className={`h-6 w-6 ${primary ? 'text-primary' : 'text-foreground/70 group-hover:text-primary'}`}
                  />
                </div>
                <h3 className="font-bold mb-2 text-foreground">{title}</h3>
                <p className="text-sm text-muted-foreground flex-1">{desc}</p>
                <ArrowRight className="h-4 w-4 text-primary opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all mt-3" />
              </Link>
            ))}
          </div>
        </section>

        {/* Rutas populares — solo si la BD responde con datos */}
        {popularRoutes && popularRoutes.length > 0 && (
          <section className="max-w-5xl mx-auto px-4 py-12 border-t border-border">
            <div className="flex items-center gap-2 justify-center mb-8">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h2 className="text-2xl md:text-3xl font-bold text-center">
                {t('popularRoutes')}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {popularRoutes.map((route) => (
                <Link
                  key={route.slug}
                  href={`/${locale}/routes/${route.slug}`}
                  className="group"
                >
                  <Card className="overflow-hidden h-full transition-all duration-300 group-hover:shadow-xl group-hover:-translate-y-1 group-hover:border-primary/30">
                    <div className="relative h-40 w-full bg-muted overflow-hidden">
                      {route.featured_image ? (
                        <Image
                          src={route.featured_image}
                          alt={route.title}
                          fill
                          sizes="(max-width: 768px) 100vw, 33vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
                          <Mountain className="h-12 w-12 text-primary/40" />
                        </div>
                      )}
                    </div>
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        {route.difficulty && (
                          <Badge
                            className={`text-xs ${difficultyColors[route.difficulty] ?? ''}`}
                            variant="outline"
                          >
                            {route.difficulty}
                          </Badge>
                        )}
                        {route.distance && (
                          <span className="text-xs text-muted-foreground">
                            {route.distance} km
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold mb-1 line-clamp-1 group-hover:text-primary transition-colors">
                        {route.title}
                      </h3>
                      {route.region && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {route.region}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Mensaje de ayuda */}
        <section className="max-w-2xl mx-auto px-4 py-8 text-center">
          <p className="text-sm text-muted-foreground">{t('help')}</p>
        </section>
      </main>

      <Footer locale={locale} />
    </div>
  );
}
