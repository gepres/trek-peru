import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { InteractiveMapsVisual } from '@/components/features/visuals/InteractiveMapsVisual';
import { CommunityVisual } from '@/components/features/visuals/CommunityVisual';
import { ReviewsVisual } from '@/components/features/visuals/ReviewsVisual';
import { RoutesVisual } from '@/components/features/visuals/RoutesVisual';
import {
  MapPin,
  Users,
  Star,
  Mountain,
  ArrowRight,
  ArrowLeft,
  Layers,
  TrendingUp,
  Navigation,
  MessageCircle,
  UserPlus,
  Calendar,
  Shield,
  ThumbsUp,
  BadgeCheck,
  CheckCircle2,
  Clock,
  Compass,
  type LucideIcon,
} from 'lucide-react';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://trek-peru.com';

// Metadata estático por slug: iconos, gradientes y los 4 iconos de beneficios.
// El contenido textual (title, subtitle, benefits, steps) se resuelve por i18n.
const FEATURES = {
  'interactive-maps': {
    icon: MapPin,
    iconBg: 'from-primary to-emerald-700',
    benefitIcons: [Navigation, TrendingUp, Layers, Compass],
    Visual: InteractiveMapsVisual,
  },
  community: {
    icon: Users,
    iconBg: 'from-accent to-orange-600',
    benefitIcons: [UserPlus, MessageCircle, Calendar, Users],
    Visual: CommunityVisual,
  },
  reviews: {
    icon: Star,
    iconBg: 'from-amber-400 to-orange-600',
    benefitIcons: [Shield, ThumbsUp, BadgeCheck, MessageCircle],
    Visual: ReviewsVisual,
  },
  routes: {
    icon: Mountain,
    iconBg: 'from-accent to-red-600',
    benefitIcons: [CheckCircle2, Clock, TrendingUp, Shield],
    Visual: RoutesVisual,
  },
} as const;

type FeatureSlug = keyof typeof FEATURES;

const SLUGS: FeatureSlug[] = ['interactive-maps', 'community', 'reviews', 'routes'];

// Pre-genera todas las rutas en build (ISR)
export async function generateStaticParams() {
  return ['es', 'en'].flatMap((locale) =>
    SLUGS.map((slug) => ({ locale, slug }))
  );
}

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!(slug in FEATURES)) return {};

  const t = await getTranslations({ locale, namespace: `features.${slug}` });
  const isEs = locale === 'es';
  const title = `${t('title')} — TrekPeru`;
  const description = t('subtitle');
  const url = `${APP_URL}/${locale}/features/${slug}`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: {
        es: `${APP_URL}/es/features/${slug}`,
        en: `${APP_URL}/en/features/${slug}`,
        'x-default': `${APP_URL}/es/features/${slug}`,
      },
    },
    openGraph: {
      title,
      description,
      url,
      type: 'article',
      locale: isEs ? 'es_PE' : 'en_US',
      alternateLocale: isEs ? 'en_US' : 'es_PE',
    },
  };
}

// Navegación entre features (anterior/siguiente)
function getAdjacent(slug: FeatureSlug) {
  const idx = SLUGS.indexOf(slug);
  return {
    prev: SLUGS[(idx - 1 + SLUGS.length) % SLUGS.length],
    next: SLUGS[(idx + 1) % SLUGS.length],
  };
}

export default async function FeatureDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!(slug in FEATURES)) notFound();

  const feature = FEATURES[slug as FeatureSlug];
  const Icon = feature.icon as LucideIcon;
  const Visual = feature.Visual;
  const { prev, next } = getAdjacent(slug as FeatureSlug);

  // Traducciones: una namespace para esta feature y otra para textos comunes
  const t = await getTranslations(`features.${slug}`);
  const tc = await getTranslations('features.common');

  // Pre-traduce títulos de prev/next para mostrar en la navegación inferior
  const tPrev = await getTranslations(`features.${prev}`);
  const tNext = await getTranslations(`features.${next}`);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header locale={locale} />

      <main className="flex-1 pt-20">
        {/* Hero: dos columnas en desktop, apilado en mobile */}
        <section className="relative overflow-hidden">
          {/* Fondo degradado suave */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
          <div
            className="absolute inset-0 opacity-[0.05]"
            style={{
              backgroundImage:
                'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)',
              backgroundSize: '40px 40px',
            }}
          />

          <div className="relative max-w-[1440px] mx-auto px-4 md:px-8 py-16 md:py-24">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8 animate-slide-up-fade">
              <Link href={`/${locale}`} className="hover:text-foreground transition-colors">
                {tc('home')}
              </Link>
              <span>/</span>
              <span className="text-foreground font-medium">{t('title')}</span>
            </nav>

            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Columna texto */}
              <div className="space-y-6">
                <div
                  className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.iconBg} shadow-lg animate-scale-in`}
                >
                  <Icon className="h-8 w-8 text-white" />
                </div>

                <h1
                  className="text-4xl md:text-5xl lg:text-6xl font-black text-foreground tracking-tight animate-slide-up-fade"
                  style={{ animationDelay: '0.1s', animationFillMode: 'both', opacity: 0 }}
                >
                  {t('title')}
                </h1>

                <p
                  className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-xl animate-slide-up-fade"
                  style={{ animationDelay: '0.25s', animationFillMode: 'both', opacity: 0 }}
                >
                  {t('subtitle')}
                </p>

                <div
                  className="flex flex-col sm:flex-row gap-3 pt-2 animate-slide-up-fade"
                  style={{ animationDelay: '0.4s', animationFillMode: 'both', opacity: 0 }}
                >
                  <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-white shadow-lg">
                    <Link href={`/${locale}/routes`}>
                      {tc('exploreRoutes')}
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg">
                    <Link href={`/${locale}`}>{tc('backToHome')}</Link>
                  </Button>
                </div>
              </div>

              {/* Columna visual */}
              <div
                className="animate-slide-up-fade"
                style={{ animationDelay: '0.35s', animationFillMode: 'both', opacity: 0 }}
              >
                <Visual />
              </div>
            </div>
          </div>
        </section>

        {/* Sección beneficios */}
        <section className="py-20 bg-muted/30">
          <div className="max-w-[1440px] mx-auto px-4 md:px-8">
            <div className="text-center mb-14">
              <p className="text-sm font-bold text-accent uppercase tracking-wider mb-2">
                {tc('whatYouGet')}
              </p>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                {tc('keyBenefits')}
              </h2>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {feature.benefitIcons.map((BIcon, i) => {
                const n = i + 1;
                return (
                  <div
                    key={i}
                    className="group relative bg-card rounded-2xl border border-border p-6 hover:border-primary/30 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 animate-slide-up-fade"
                    style={{ animationDelay: `${i * 0.1}s`, animationFillMode: 'both', opacity: 0 }}
                  >
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                      <BIcon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-bold text-foreground mb-2 leading-tight">
                      {t(`benefit${n}Title`)}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {t(`benefit${n}Desc`)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Cómo funciona (steps) */}
        <section className="py-20">
          <div className="max-w-4xl mx-auto px-4 md:px-8">
            <div className="text-center mb-14">
              <p className="text-sm font-bold text-accent uppercase tracking-wider mb-2">
                {tc('inThreeSteps')}
              </p>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                {tc('howItWorks')}
              </h2>
            </div>

            <div className="relative">
              {/* Línea vertical conectora: centrada en desktop, a la izquierda en mobile */}
              <div className="absolute left-7 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-primary via-accent to-transparent" />

              <div className="space-y-8">
                {[1, 2, 3].map((n, i) => {
                  // Tarjeta de texto y círculo numerado — reutilizados en ambos layouts
                  const card = (
                    <div className="bg-card border border-border rounded-2xl p-5 md:p-6 shadow-md hover:shadow-lg transition-shadow">
                      <p className="text-base md:text-lg text-foreground leading-relaxed">
                        {t(`step${n}`)}
                      </p>
                    </div>
                  );
                  const number = (
                    <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${feature.iconBg} text-white font-black text-xl flex items-center justify-center shadow-xl ring-4 ring-background flex-shrink-0`}>
                      {n}
                    </div>
                  );

                  return (
                    <div
                      key={n}
                      className="relative animate-slide-up-fade"
                      style={{ animationDelay: `${i * 0.15}s`, animationFillMode: 'both', opacity: 0 }}
                    >
                      {/* Mobile: número a la izquierda sobre la línea, card a la derecha */}
                      <div className="flex md:hidden items-start gap-4 relative z-10">
                        {number}
                        <div className="flex-1 min-w-0 pt-1">{card}</div>
                      </div>

                      {/* Desktop: layout zigzag con el número al centro */}
                      <div className={`hidden md:flex items-center gap-6 relative z-10 ${i % 2 === 1 ? 'md:flex-row-reverse' : ''}`}>
                        <div className="flex-1 md:text-right">
                          {i % 2 === 0 && card}
                        </div>
                        {number}
                        <div className="flex-1">
                          {i % 2 === 1 && card}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* CTA final */}
        <section className="py-16">
          <div className="max-w-5xl mx-auto px-4 md:px-8">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary to-emerald-900 p-10 md:p-14 shadow-2xl">
              {/* Elementos decorativos */}
              <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-accent/20 blur-3xl" />
              <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-emerald-400/20 blur-3xl" />

              <div className="relative text-center space-y-6">
                <h2 className="text-3xl md:text-4xl font-black text-white">
                  {tc('readyToStart')}
                </h2>
                <p className="text-lg text-white/80 max-w-xl mx-auto">
                  {tc('ctaDescription')}
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                  <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-white shadow-lg">
                    <Link href={`/${locale}/routes`}>
                      {tc('viewAllRoutes')}
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20">
                    <Link href={`/${locale}/routes/new`}>
                      {tc('createRoute')}
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Navegación prev/next entre features */}
        <section className="py-10 border-t border-border">
          <div className="max-w-5xl mx-auto px-4 md:px-8 grid sm:grid-cols-2 gap-4">
            <Link
              href={`/${locale}/features/${prev}`}
              className="group flex items-center gap-3 p-5 rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-md transition-all"
            >
              <ArrowLeft className="h-5 w-5 text-muted-foreground group-hover:-translate-x-1 transition-transform" />
              <div className="text-left">
                <p className="text-xs text-muted-foreground">{tc('previous')}</p>
                <p className="font-bold text-foreground">{tPrev('title')}</p>
              </div>
            </Link>
            <Link
              href={`/${locale}/features/${next}`}
              className="group flex items-center justify-end gap-3 p-5 rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-md transition-all"
            >
              <div className="text-right">
                <p className="text-xs text-muted-foreground">{tc('next')}</p>
                <p className="font-bold text-foreground">{tNext('title')}</p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </section>
      </main>

      <Footer locale={locale} />
    </div>
  );
}
