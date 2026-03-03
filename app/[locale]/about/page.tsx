import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Mountain } from 'lucide-react';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://trek-peru.vercel.app';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const isEs = locale === 'es';

  const title = isEs ? 'Acerca de TrekPeru' : 'About TrekPeru';
  const description = isEs
    ? 'Conoce la historia y misión de TrekPeru, la plataforma colaborativa de trekking en Perú.'
    : 'Learn about TrekPeru, the collaborative trekking platform in Peru.';
  const url = `${APP_URL}/${locale}/about`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: {
        es: `${APP_URL}/es/about`,
        en: `${APP_URL}/en/about`,
        'x-default': `${APP_URL}/es/about`,
      },
    },
    openGraph: {
      title,
      description,
      url,
      type: 'website',
      locale: isEs ? 'es_PE' : 'en_US',
      alternateLocale: isEs ? 'en_US' : 'es_PE',
      images: [{ url: '/images/logo/logo-trek.png', width: 512, height: 512, alt: 'TrekPeru' }],
    },
    twitter: {
      card: 'summary' as const,
      title,
      description,
      images: ['/images/logo/logo-trek.png'],
    },
  };
}

// Página de información: Acerca de TrekPeru
export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const es = locale === 'es';

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header locale={locale} />

      <main className="flex-1 pt-24 pb-16">
        {/* Hero */}
        <section className="bg-primary text-primary-foreground py-20">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/20 mb-6">
              <Mountain className="h-8 w-8" />
            </div>
            <h1 className="text-4xl md:text-5xl font-black mb-4">
              {es ? 'Acerca de TrekPeru' : 'About TrekPeru'}
            </h1>
            <p className="text-lg text-primary-foreground/80 max-w-2xl mx-auto">
              {es
                ? 'La plataforma colaborativa para explorar y compartir rutas de trekking en los Andes peruanos.'
                : 'The collaborative platform to explore and share trekking routes in the Peruvian Andes.'}
            </p>
          </div>
        </section>

        {/* Contenido */}
        <section className="max-w-3xl mx-auto px-4 py-14 space-y-12">
          {/* Misión */}
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-4">
              {es ? 'Nuestra Misión' : 'Our Mission'}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {es
                ? 'TrekPeru nació con la misión de democratizar el acceso a las rutas de trekking en el Perú. Creemos que cada montaña, cada camino y cada paisaje andino merece ser explorado y compartido. Nuestra plataforma conecta a trekkers experimentados con principiantes, creando una comunidad que inspira y se apoya mutuamente.'
                : 'TrekPeru was born with the mission to democratize access to trekking routes across Peru. We believe every mountain, every trail and every Andean landscape deserves to be explored and shared. Our platform connects experienced trekkers with beginners, building a community that inspires and supports one another.'}
            </p>
          </div>

          {/* Historia */}
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-4">
              {es ? 'Nuestra Historia' : 'Our Story'}
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              {es
                ? 'El proyecto fue creado por el equipo GEPRES con la visión de construir una herramienta que los propios trekkers peruanos necesitaban: un lugar donde organizar salidas grupales, registrar rutas y descubrir nuevos destinos sin las complicaciones de los grupos de WhatsApp o las hojas de cálculo.'
                : 'The project was created by the GEPRES team with the vision to build a tool that Peruvian trekkers themselves needed: a place to organize group outings, log routes and discover new destinations without the hassle of WhatsApp groups or spreadsheets.'}
            </p>
            <p className="text-muted-foreground leading-relaxed">
              {es
                ? 'Desde el Camino Inca hasta las rutas menos conocidas de la Cordillera Blanca, TrekPeru busca ser el repositorio definitivo de la experiencia trekker peruana.'
                : "From the Inca Trail to the lesser-known routes of the Cordillera Blanca, TrekPeru aims to be the definitive repository of Peru's trekking experience."}
            </p>
          </div>

          {/* Valores */}
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-6">
              {es ? 'Nuestros Valores' : 'Our Values'}
            </h2>
            <div className="grid sm:grid-cols-2 gap-6">
              {[
                {
                  title: es ? 'Comunidad' : 'Community',
                  desc: es
                    ? 'Fomentamos el espíritu colaborativo: cada ruta compartida es un regalo a la comunidad.'
                    : 'We foster a collaborative spirit: every shared route is a gift to the community.',
                },
                {
                  title: es ? 'Seguridad' : 'Safety',
                  desc: es
                    ? 'Promovemos buenas prácticas de montaña y el uso de información verificada en cada salida.'
                    : 'We promote good mountain practices and the use of verified information on every outing.',
                },
                {
                  title: es ? 'Inclusión' : 'Inclusion',
                  desc: es
                    ? 'El trekking es para todos. Rutas para todos los niveles, en todos los rincones del Perú.'
                    : 'Trekking is for everyone. Routes for all levels, in every corner of Peru.',
                },
                {
                  title: es ? 'Naturaleza' : 'Nature',
                  desc: es
                    ? 'Respetamos los ecosistemas que exploramos. Promovemos el principio de no dejar huella.'
                    : 'We respect the ecosystems we explore. We promote the Leave No Trace principle.',
                },
              ].map(({ title, desc }) => (
                <div key={title} className="p-5 rounded-xl border bg-muted/30">
                  <h3 className="font-semibold text-foreground mb-2">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="text-center pt-4">
            <p className="text-muted-foreground mb-4">
              {es ? '¿Tienes preguntas? Nos encantaría escucharte.' : 'Have questions? We would love to hear from you.'}
            </p>
            <a
              href={`/${locale}/contact`}
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity"
            >
              {es ? 'Contáctanos' : 'Contact us'}
            </a>
          </div>
        </section>
      </main>

      <Footer locale={locale} />
    </div>
  );
}
