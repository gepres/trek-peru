import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Search, Mountain, Users, MapPin, Star } from 'lucide-react';

// Landing page principal
export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  return (
    <main className="min-h-screen flex flex-col">
      <Header locale={locale} />

      {/* Hero Section con background gradiente */}
      <section
        className="relative w-full min-h-[500px] flex items-center justify-center bg-cover bg-center overflow-hidden pt-16"
        style={{
          backgroundImage: `linear-gradient(rgba(6, 76, 57, 0.4) 0%, hsl(var(--background)) 100%), url('https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=2070')`,
        }}
      >
        {/* Gradiente overlay adicional */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-black/30"></div>

        {/* Contenido Hero */}
        <div className="relative z-10 flex flex-col items-center max-w-4xl px-4 text-center space-y-8 py-20">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight drop-shadow-md">
              Descubre los Andes
            </h1>
            <p className="text-lg md:text-xl text-white/90 font-medium max-w-2xl mx-auto drop-shadow-sm">
              Encuentra y únete a los mejores grupos de trekking en Perú. Desde el clásico Camino Inca hasta joyas escondidas.
            </p>
          </div>

          {/* Barra de búsqueda */}
          {/* <div className="w-full max-w-xl">
            <div className="relative flex items-center w-full h-14 md:h-16 glass-dark border border-white/10 rounded-2xl shadow-2xl focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
              <div className="pl-5 text-gray-400">
                <Search className="h-5 w-5" />
              </div>
              <Input
                className="w-full h-full bg-transparent border-none text-white placeholder-gray-400 focus-visible:ring-0 focus-visible:ring-offset-0 px-4 text-base"
                placeholder="Buscar Camino Inca, Salkantay, Ausangate..."
                type="text"
              />
              <div className="pr-2">
                <Button
                  className="h-10 md:h-12 px-6 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold transition-colors"
                >
                  Buscar
                </Button>
              </div>
            </div>
          </div> */}

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-white shadow-lg shadow-accent/20">
              <Link href={`/${locale}/routes`}>
                Explorar Rutas
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="dark:border-white/20 dark:text-white text-black dark:hover:bg-white/10">
              <Link href={`/${locale}/routes/new`}>
                Crear Ruta
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
              ¿Por qué elegir TrekPeru?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              La plataforma más completa para trekkers en Perú
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature 1 */}
            <div className="group flex flex-col items-center text-center p-6 rounded-2xl border border-border bg-card hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <MapPin className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-foreground">Mapas Interactivos</h3>
              <p className="text-muted-foreground text-sm">
                Visualiza rutas en mapas detallados con waypoints, elevación y puntos de interés
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group flex flex-col items-center text-center p-6 rounded-2xl border border-border bg-card hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300">
              <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
                <Users className="h-8 w-8 text-accent" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-foreground">Comunidad Activa</h3>
              <p className="text-muted-foreground text-sm">
                Únete a grupos de trekking, comparte experiencias y conoce nuevos aventureros
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group flex flex-col items-center text-center p-6 rounded-2xl border border-border bg-card hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <Star className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-foreground">Reseñas Verificadas</h3>
              <p className="text-muted-foreground text-sm">
                Lee reseñas de otros trekkers y califica tus experiencias en las rutas
              </p>
            </div>

            {/* Feature 4 */}
            <div className="group flex flex-col items-center text-center p-6 rounded-2xl border border-border bg-card hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300">
              <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
                <Mountain className="h-8 w-8 text-accent" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-foreground">Rutas Verificadas</h3>
              <p className="text-muted-foreground text-sm">
                Todas las rutas incluyen información detallada de dificultad, duración y equipo necesario
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer locale={locale} />
    </main>
  );
}
