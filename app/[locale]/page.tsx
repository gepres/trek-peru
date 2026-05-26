import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Search, Mountain, Users, MapPin, Star, ArrowRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';

// ISR: reconstruir la página como máximo cada hora
export const revalidate = 3600;

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.trek-peru.com';
const HERO_OG_IMAGE = `${BASE_URL}/images/hero/hero-seo-trek-peru.png`;

// Metadata dinámica bilingüe para la homepage
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isEs = locale === 'es';

  // Title sin sufijo de marca — el template '%s | TrekPeru' del layout lo añade.
  // Resultado final: "Rutas de Trekking en Perú | TrekPeru" (< 60 chars).
  const title = isEs
    ? 'Rutas de Trekking en Perú'
    : 'Trekking Routes in Peru';
  const description = isEs
    ? 'Descubre y únete a los mejores grupos de trekking en todo el Perú. Costa, sierra y selva con cientos de rutas verificadas y mapas interactivos.'
    : 'Discover and join the best trekking groups throughout Peru. Coast, mountains, and jungle with hundreds of verified routes and interactive maps.';
  const url = `${BASE_URL}/${locale}`;

  return {
    title,
    description,
    keywords: isEs
      ? ['trekking Perú', 'rutas trekking', 'Camino Inca', 'Salkantay', 'Ausangate', 'senderismo Perú', 'grupos trekking', 'turismo aventura Perú', 'montañismo Andes']
      : ['trekking Peru', 'hiking routes Peru', 'Inca Trail', 'Salkantay', 'Ausangate', 'Peru adventure tourism', 'trekking groups Peru', 'Andes hiking'],
    alternates: {
      canonical: url,
      languages: {
        es: `${BASE_URL}/es`,
        en: `${BASE_URL}/en`,
        // x-default debe apuntar a una URL 200 OK, nunca a `/` (redirige 308 a /es).
        // Una URL con redirección en hreflang hace que Google elija una canónica distinta.
        'x-default': `${BASE_URL}/es`,
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
          url: HERO_OG_IMAGE,
          width: 1200,
          height: 630,
          alt: isEs ? 'TrekPeru — Rutas de Trekking en Perú' : 'TrekPeru — Trekking Routes in Peru',
        },
      ],
    },
    twitter: {
      title,
      description,
      images: [HERO_OG_IMAGE],
    },
  };
}

// Landing page principal
export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations('home');
  const tNav = await getTranslations('navigation');
  const tFeatures = await getTranslations('features.common');

  // Obtener rutas destacadas para el ItemList schema
  const supabase = await createClient();
  const { data: featuredRoutes } = await supabase
    .from('routes')
    .select('slug, title')
    .eq('status', 'published')
    .eq('visibility', 'public')
    .order('created_at', { ascending: false })
    .limit(6);

  // ItemList schema para rutas destacadas — mejora la visibilidad en Google
  const itemListSchema = featuredRoutes && featuredRoutes.length > 0
    ? {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: locale === 'es'
          ? 'Rutas de Trekking Destacadas en Perú'
          : 'Featured Trekking Routes in Peru',
        url: `${BASE_URL}/${locale}/routes`,
        itemListElement: featuredRoutes.map((route, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          url: `${BASE_URL}/${locale}/routes/${route.slug}`,
          name: route.title,
        })),
      }
    : null;

  return (
    <main className="min-h-screen flex flex-col">
      {itemListSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
        />
      )}

      <Header locale={locale} />

      {/* Hero Section — Next.js Image para LCP óptimo (WebP/AVIF automático + preload) */}
      <section className="relative w-full min-h-[500px] flex items-center justify-center overflow-hidden pt-16">
        <Image
          src="/images/hero/HERO-BACKGROUND-TREK.jpg"
          alt="Trekking en los Andes del Perú — paisaje de montañas nevadas"
          fill
          priority
          quality={75}
          sizes="100vw"
          className="object-cover object-center"
        />
        {/* Overlay gradiente */}
        <div className="absolute inset-0 bg-gradient-to-b from-[rgba(6,76,57,0.4)] via-transparent to-background" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-black/30" />

        {/* Contenido Hero */}
        <div className="relative z-10 flex flex-col items-center max-w-4xl px-4 text-center space-y-8 py-20">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight drop-shadow-md">
              {t('heroTitle')}
            </h1>
            <p className="text-lg md:text-xl text-white/90 font-medium max-w-2xl mx-auto drop-shadow-sm">
              {t('heroSubtitle')}
            </p>
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-white shadow-lg shadow-accent/20">
              <Link href={`/${locale}/routes`}>
                {t('exploreRoutes')}
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="dark:border-white/20 dark:text-white text-black dark:hover:bg-white/10">
              <Link href={`/${locale}/routes/new`}>
                {t('createRoute')}
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-background">
        <div className="max-w-[1440px] mx-auto px-4 md:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              {t('whyChoose')}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t('mostComplete')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { slug: 'interactive-maps', Icon: MapPin, title: t('featureMaps'), desc: t('featureMapsDesc'), color: 'primary' },
              { slug: 'community', Icon: Users, title: t('featureCommunity'), desc: t('featureCommunityDesc'), color: 'accent' },
              { slug: 'reviews', Icon: Star, title: t('featureReviews'), desc: t('featureReviewsDesc'), color: 'primary' },
              { slug: 'routes', Icon: Mountain, title: t('featureRoutes'), desc: t('featureRoutesDesc'), color: 'accent' },
            ].map(({ slug, Icon, title, desc, color }) => (
              <Link
                key={slug}
                href={`/${locale}/features/${slug}`}
                className="group flex flex-col items-center text-center p-6 rounded-2xl border border-border bg-card hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1 transition-all duration-300"
              >
                <div className={`w-16 h-16 rounded-full ${color === 'primary' ? 'bg-primary/10 group-hover:bg-primary/20' : 'bg-accent/10 group-hover:bg-accent/20'} flex items-center justify-center mb-4 transition-colors group-hover:scale-110`}>
                  <Icon className={`h-8 w-8 ${color === 'primary' ? 'text-primary' : 'text-accent'}`} />
                </div>
                <h3 className="text-xl font-bold mb-2 text-foreground">{title}</h3>
                <p className="text-muted-foreground text-sm mb-4">{desc}</p>
                <span className={`inline-flex items-center gap-1 text-sm font-semibold ${color === 'primary' ? 'text-primary' : 'text-accent'} opacity-0 group-hover:opacity-100 transition-opacity`}>
                  {tFeatures('learnMore')}
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <Footer locale={locale} />
    </main>
  );
}
