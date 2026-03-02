import { createClient } from '@/lib/supabase/server';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RouteActions } from '@/components/routes/RouteActions';
import { LiveCapacity } from '@/components/routes/LiveCapacity';
import { ShareButton } from '@/components/routes/ShareButton';
import { RouteMap } from '@/components/maps/RouteMap';
import { ImageGallery } from '@/components/shared/ImageGallery';
import {
  MapPin, Clock, TrendingUp, TrendingDown, Users, Calendar, DollarSign,
  Mountain, Phone, Edit, Navigation, Droplets, Home, Signal, AlertTriangle,
  Sun, Thermometer, CheckCircle2, XCircle, ExternalLink, Play,
  Heart, Eye, Star, Route as RouteIcon, Footprints, Timer, CalendarDays
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { RouteJsonLd } from '@/components/seo/RouteJsonLd';
import { CommentsSection } from '@/components/comments';

// Generar metadata dinámica para SEO
export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string; id: string }>
}): Promise<Metadata> {
  const { locale, id } = await params;
  const supabase = await createClient();

  const { data: route } = await supabase
    .from('routes')
    .select('title, description, featured_image, region, difficulty, distance, max_altitude')
    .eq('slug', id)
    .single();

  if (!route) {
    return {
      title: 'Ruta no encontrada | TrekPeru',
    };
  }

  const difficultyLabels: Record<string, string> = {
    easy: 'Fácil',
    moderate: 'Moderado',
    hard: 'Difícil',
    extreme: 'Extremo'
  };

  const description = route.description?.substring(0, 160) ||
    `Ruta de trekking ${difficultyLabels[route.difficulty] || ''} en ${route.region || 'Perú'}. ${route.distance ? `${route.distance}km` : ''} ${route.max_altitude ? `hasta ${route.max_altitude}m de altitud` : ''}`.trim();

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://trekperu.com';

  return {
    title: `${route.title} | TrekPeru`,
    description,
    keywords: [
      'trekking',
      'Perú',
      route.region || '',
      route.difficulty,
      'senderismo',
      'aventura',
      'montaña'
    ].filter(Boolean),
    openGraph: {
      title: route.title,
      description,
      type: 'article',
      url: `${baseUrl}/${locale}/routes/${id}`,
      images: route.featured_image ? [
        {
          url: route.featured_image,
          width: 1200,
          height: 630,
          alt: route.title,
        }
      ] : [],
      locale: locale === 'es' ? 'es_PE' : 'en_US',
      siteName: 'TrekPeru',
    },
    twitter: {
      card: 'summary_large_image',
      title: route.title,
      description,
      images: route.featured_image ? [route.featured_image] : [],
    },
    alternates: {
      canonical: `${baseUrl}/${locale}/routes/${id}`,
      languages: {
        'es': `${baseUrl}/es/routes/${id}`,
        'en': `${baseUrl}/en/routes/${id}`,
      },
    },
  };
}

// Página de detalle de ruta - Diseño modernizado
export default async function RouteDetailPage({
  params
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { locale, id } = await params;
  const supabase = await createClient();

  // Obtener la ruta con los datos del creador
  const { data: route, error } = await supabase
    .from('routes')
    .select(`
      *,
      creator:profiles(*),
      attendees(count)
    `)
    .eq('slug', id)
    .single();

  if (error || !route) {
    notFound();
  }

  // Verificar si el usuario actual es el creador y obtener su perfil (para teléfono)
  const { data: { user } } = await supabase.auth.getUser();
  const isCreator = user?.id === route.creator_id;

  // Obtener conteo real de asistentes vía función SECURITY DEFINER (bypasea RLS)
  // — route.attendees[0].count devuelve 0 para no-creadores por la política RLS
  const { data: attendeeCountData } = await supabase.rpc('get_route_attendee_count', {
    p_route_id: route.id,
  });
  const attendeeCount = (attendeeCountData as number) ?? 0;

  // Obtener perfil del usuario autenticado para pasar su teléfono al modal de inscripción
  let currentUserProfile: { full_name?: string; phone?: string } | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, phone')
      .eq('id', user.id)
      .single();
    currentUserProfile = profile;
  }

  // Obtener iniciales del creador
  const getInitials = (name: string) => {
    return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2);
  };

  // Color según dificultad
  const difficultyConfig = {
    easy: { color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20', label: 'Fácil', icon: '🟢' },
    moderate: { color: 'bg-amber-500/10 text-amber-600 border-amber-500/20', label: 'Moderado', icon: '🟡' },
    hard: { color: 'bg-orange-500/10 text-orange-600 border-orange-500/20', label: 'Difícil', icon: '🟠' },
    extreme: { color: 'bg-red-500/10 text-red-600 border-red-500/20', label: 'Extremo', icon: '🔴' },
  };

  const difficulty = difficultyConfig[route.difficulty as keyof typeof difficultyConfig];

  // Formatear duración
  const formatDuration = () => {
    if (route.duration_type === 'days' && route.duration_value) {
      return `${route.duration_value} ${route.duration_value === 1 ? 'día' : 'días'}`;
    }
    if (route.duration_value) {
      return `${route.duration_value} ${route.duration_value === 1 ? 'hora' : 'horas'}`;
    }
    if (route.estimated_duration) {
      return `${route.estimated_duration}h`;
    }
    return null;
  };

  // Stats rápidas
  const quickStats = [
    { icon: RouteIcon, label: 'Distancia', value: route.distance ? `${route.distance} km` : null },
    { icon: Timer, label: 'Duración', value: formatDuration() },
    { icon: TrendingUp, label: 'Desnivel +', value: route.elevation_gain ? `${route.elevation_gain}m` : null },
    { icon: Mountain, label: 'Alt. Máx', value: route.max_altitude ? `${route.max_altitude}m` : null },
  ].filter(stat => stat.value);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <RouteJsonLd route={route} locale={locale} />
      <Header locale={locale} />

      <main className="flex-1">
        {/* Hero Section con imagen destacada */}
        <div className="relative">
          {route.featured_image ? (
            <div className="relative h-[50vh] min-h-[400px] w-full">
              <Image
                src={route.featured_image}
                alt={route.title}
                fill
                priority
                className="object-cover"
                sizes="100vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
            </div>
          ) : (
            <div className="h-[30vh] min-h-[250px] bg-gradient-to-br from-primary/20 via-primary/10 to-background" />
          )}

          {/* Contenido sobre el hero */}
          <div className="absolute bottom-0 left-0 right-0 pb-8">
            <div className="container mx-auto px-4">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div className="space-y-3">
                  {/* Badges */}
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className={`${difficulty.color} border px-3 py-1`}>
                      {difficulty.icon} {difficulty.label}
                    </Badge>
                    {route.status !== 'published' && (
                      <Badge variant="secondary">{route.status}</Badge>
                    )}
                    {route.verified && (
                      <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20 border">
                        <CheckCircle2 className="h-3 w-3 mr-1" /> Verificada
                      </Badge>
                    )}
                  </div>

                  {/* Título */}
                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white drop-shadow-lg">
                    {route.title}
                  </h1>

                  {/* Ubicación */}
                  {route.region && (
                    <p className="text-white/90 flex items-center gap-2 text-lg">
                      <MapPin className="h-5 w-5" />
                      {route.region}{route.province && `, ${route.province}`}
                    </p>
                  )}

                  {/* Quick Stats */}
                  {quickStats.length > 0 && (
                    <div className="flex flex-wrap gap-4 pt-2">
                      {quickStats.map((stat, i) => (
                        <div key={i} className="flex items-center gap-2 bg-black/30 backdrop-blur-sm rounded-lg px-3 py-2">
                          <stat.icon className="h-4 w-4 text-white/80" />
                          <span className="text-white font-medium">{stat.value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Acciones */}
                <div className="flex items-center gap-2">
                  {isCreator && (
                    <Button asChild variant="secondary" size="lg" className="shadow-lg">
                      <Link href={`/${locale}/routes/${id}/edit`}>
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </Link>
                    </Button>
                  )}
                  <ShareButton
                    title={route.title}
                    description={route.description?.substring(0, 120)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contenido Principal */}
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Columna Principal */}
            <div className="lg:col-span-2 space-y-6">

              {/* Tabs de contenido */}
              <Tabs defaultValue="info" className="w-full">
                <TabsList className="w-full justify-start bg-muted/50 p-1 h-auto flex-wrap">
                  <TabsTrigger value="info" className="flex-1 sm:flex-none">Información</TabsTrigger>
                  <TabsTrigger value="route" className="flex-1 sm:flex-none">Ruta</TabsTrigger>
                  {route.images && route.images.length > 0 && (
                    <TabsTrigger value="gallery" className="flex-1 sm:flex-none">Galería</TabsTrigger>
                  )}
                  {route.daily_itinerary && route.daily_itinerary.length > 0 && (
                    <TabsTrigger value="itinerary" className="flex-1 sm:flex-none">Itinerario</TabsTrigger>
                  )}
                </TabsList>

                {/* Tab: Información */}
                <TabsContent value="info" className="space-y-6 mt-6">
                  {/* Descripción */}
                  {route.description && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Descripción</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                          {route.description}
                        </p>
                      </CardContent>
                    </Card>
                  )}

                  {/* Detalles Técnicos Expandidos */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Footprints className="h-5 w-5 text-primary" />
                        Detalles Técnicos
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                        {route.distance && (
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground uppercase tracking-wide">Distancia</p>
                            <p className="text-2xl font-bold">{route.distance} <span className="text-sm font-normal text-muted-foreground">km</span></p>
                          </div>
                        )}

                        {formatDuration() && (
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground uppercase tracking-wide">Duración</p>
                            <p className="text-2xl font-bold">{formatDuration()}</p>
                          </div>
                        )}

                        {route.elevation_gain && (
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground uppercase tracking-wide">Desnivel Positivo</p>
                            <p className="text-2xl font-bold text-emerald-600">+{route.elevation_gain} <span className="text-sm font-normal text-muted-foreground">m</span></p>
                          </div>
                        )}

                        {route.elevation_loss && (
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground uppercase tracking-wide">Desnivel Negativo</p>
                            <p className="text-2xl font-bold text-red-600">-{route.elevation_loss} <span className="text-sm font-normal text-muted-foreground">m</span></p>
                          </div>
                        )}

                        {route.min_altitude && (
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground uppercase tracking-wide">Altitud Mínima</p>
                            <p className="text-2xl font-bold">{route.min_altitude} <span className="text-sm font-normal text-muted-foreground">m</span></p>
                          </div>
                        )}

                        {route.max_altitude && (
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground uppercase tracking-wide">Altitud Máxima</p>
                            <p className="text-2xl font-bold">{route.max_altitude} <span className="text-sm font-normal text-muted-foreground">m</span></p>
                          </div>
                        )}
                      </div>

                      {/* Tipo de terreno */}
                      {route.terrain_type && route.terrain_type.length > 0 && (
                        <div className="mt-6 pt-6 border-t">
                          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-3">Tipo de Terreno</p>
                          <div className="flex flex-wrap gap-2">
                            {route.terrain_type.map((terrain: string, i: number) => (
                              <Badge key={i} variant="secondary">{terrain}</Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Nivel técnico */}
                      {route.technical_level && (
                        <div className="mt-6 pt-6 border-t">
                          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-3">Nivel Técnico</p>
                          <Badge variant="outline" className="text-sm px-3 py-1">
                            {route.technical_level === 'none' && 'Sin requerimiento técnico'}
                            {route.technical_level === 'basic' && 'Básico - Caminata simple'}
                            {route.technical_level === 'intermediate' && 'Intermedio - Terreno irregular'}
                            {route.technical_level === 'advanced' && 'Avanzado - Uso de cuerdas/equipos'}
                            {route.technical_level === 'expert' && 'Experto - Alta montaña/técnico'}
                          </Badge>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Condiciones y Servicios */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Sun className="h-5 w-5 text-amber-500" />
                        Condiciones y Servicios
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className={`p-4 rounded-xl border-2 text-center ${route.water_available ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-muted bg-muted/30'}`}>
                          <Droplets className={`h-6 w-6 mx-auto mb-2 ${route.water_available ? 'text-emerald-500' : 'text-muted-foreground'}`} />
                          <p className="text-sm font-medium">Agua</p>
                          <p className="text-xs text-muted-foreground">{route.water_available ? 'Disponible' : 'No disponible'}</p>
                        </div>

                        <div className={`p-4 rounded-xl border-2 text-center ${route.shelters ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-muted bg-muted/30'}`}>
                          <Home className={`h-6 w-6 mx-auto mb-2 ${route.shelters ? 'text-emerald-500' : 'text-muted-foreground'}`} />
                          <p className="text-sm font-medium">Refugios</p>
                          <p className="text-xs text-muted-foreground">{route.shelters ? 'Disponible' : 'No disponible'}</p>
                        </div>

                        <div className={`p-4 rounded-xl border-2 text-center ${route.mobile_signal ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-muted bg-muted/30'}`}>
                          <Signal className={`h-6 w-6 mx-auto mb-2 ${route.mobile_signal ? 'text-emerald-500' : 'text-muted-foreground'}`} />
                          <p className="text-sm font-medium">Señal Móvil</p>
                          <p className="text-xs text-muted-foreground">{route.mobile_signal ? 'Disponible' : 'Sin cobertura'}</p>
                        </div>

                        {route.expected_weather && (
                          <div className="p-4 rounded-xl border-2 border-amber-500/30 bg-amber-500/5 text-center">
                            <Thermometer className="h-6 w-6 mx-auto mb-2 text-amber-500" />
                            <p className="text-sm font-medium">Clima</p>
                            <p className="text-xs text-muted-foreground">{route.expected_weather}</p>
                          </div>
                        )}
                      </div>

                      {/* Mejor temporada */}
                      {route.best_season && route.best_season.length > 0 && (
                        <div className="mt-6 pt-6 border-t">
                          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-3">Mejor Temporada</p>
                          <div className="flex flex-wrap gap-2">
                            {route.best_season.map((season: string, i: number) => (
                              <Badge key={i} variant="outline" className="border-amber-500/30 text-amber-600">
                                <Sun className="h-3 w-3 mr-1" />
                                {season}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Equipamiento */}
                  {(route.required_equipment?.length > 0 || route.optional_equipment?.length > 0) && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Equipamiento</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {route.required_equipment && route.required_equipment.length > 0 && (
                          <div>
                            <div className="flex items-center gap-2 mb-3">
                              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                              <p className="font-medium">Equipo Requerido</p>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {route.required_equipment.map((item: string, i: number) => (
                                <div key={i} className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                                  <div className="h-2 w-2 rounded-full bg-emerald-500" />
                                  <span className="text-sm">{item}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {route.optional_equipment && route.optional_equipment.length > 0 && (
                          <div>
                            <div className="flex items-center gap-2 mb-3">
                              <span className="text-muted-foreground">Equipo Opcional</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {route.optional_equipment.map((item: string, i: number) => (
                                <div key={i} className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg">
                                  <div className="h-2 w-2 rounded-full bg-muted-foreground" />
                                  <span className="text-sm text-muted-foreground">{item}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Riesgos */}
                  {route.risks && route.risks.length > 0 && (
                    <Card className="border-amber-500/30">
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2 text-amber-600">
                          <AlertTriangle className="h-5 w-5" />
                          Riesgos y Precauciones
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {route.risks.map((risk: string, i: number) => (
                            <div key={i} className="flex items-start gap-3 p-3 bg-amber-500/5 rounded-lg">
                              <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                              <span className="text-sm">{risk}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Qué incluye / No incluye */}
                  {(route.includes?.length > 0 || route.not_includes?.length > 0) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {route.includes && route.includes.length > 0 && (
                        <Card className="border-emerald-500/30">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2 text-emerald-600">
                              <CheckCircle2 className="h-4 w-4" />
                              Incluye
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <ul className="space-y-2">
                              {route.includes.map((item: string, i: number) => (
                                <li key={i} className="flex items-center gap-2 text-sm">
                                  <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </CardContent>
                        </Card>
                      )}

                      {route.not_includes && route.not_includes.length > 0 && (
                        <Card className="border-red-500/30">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2 text-red-600">
                              <XCircle className="h-4 w-4" />
                              No Incluye
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <ul className="space-y-2">
                              {route.not_includes.map((item: string, i: number) => (
                                <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <XCircle className="h-3 w-3 text-red-500" />
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  )}
                </TabsContent>

                {/* Tab: Ruta/Mapa */}
                <TabsContent value="route" className="space-y-6 mt-6">
                  {(route.route_coordinates || route.meeting_point || route.waypoints) ? (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Navigation className="h-5 w-5 text-primary" />
                          Mapa de la Ruta
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <RouteMap
                          routeCoordinates={route.route_coordinates}
                          meetingPoint={route.meeting_point}
                          waypoints={route.waypoints}
                          height="500px"
                        />

                        {/* Punto de encuentro info */}
                        {route.meeting_point && (
                          <div className="mt-4 p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-lg">
                            <div className="flex items-center gap-2 text-emerald-600 font-medium mb-1">
                              <MapPin className="h-4 w-4" />
                              Punto de Encuentro
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {route.meeting_point.name || 'Marcado en el mapa'}
                            </p>
                          </div>
                        )}

                        {/* Waypoints */}
                        {route.waypoints && route.waypoints.length > 0 && (
                          <div className="mt-4 space-y-2">
                            <p className="text-sm font-medium text-muted-foreground">Puntos de Interés</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {route.waypoints.map((wp: any, i: number) => (
                                <div key={i} className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                                  <div className="h-6 w-6 rounded-full bg-amber-500 text-white text-xs flex items-center justify-center font-bold">
                                    {i + 1}
                                  </div>
                                  <span className="text-sm">{wp.name}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ) : (
                    <Card>
                      <CardContent className="py-12 text-center">
                        <Navigation className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                        <p className="text-muted-foreground">No hay mapa disponible para esta ruta</p>
                      </CardContent>
                    </Card>
                  )}

                  {/* Link de Google Maps */}
                  {route.google_maps_link && (
                    <Card>
                      <CardContent className="py-4">
                        <Button asChild variant="outline" className="w-full">
                          <a href={route.google_maps_link} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Ver en Google Maps
                          </a>
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                {/* Tab: Galería */}
                {route.images && route.images.length > 0 && (
                  <TabsContent value="gallery" className="mt-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Galería de Imágenes</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ImageGallery
                          images={route.images}
                          bucket="route-images"
                          editable={false}
                        />
                      </CardContent>
                    </Card>

                    {/* Video */}
                    {route.video_url && (
                      <Card className="mt-6">
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Play className="h-5 w-5" />
                            Video
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <Button asChild variant="outline" className="w-full">
                            <a href={route.video_url} target="_blank" rel="noopener noreferrer">
                              <Play className="h-4 w-4 mr-2" />
                              Ver Video
                            </a>
                          </Button>
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>
                )}

                {/* Tab: Itinerario */}
                {route.daily_itinerary && route.daily_itinerary.length > 0 && (
                  <TabsContent value="itinerary" className="mt-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <CalendarDays className="h-5 w-5 text-primary" />
                          Itinerario Día a Día
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {route.daily_itinerary.map((day: any, i: number) => (
                            <div key={i} className="relative pl-8 pb-6 last:pb-0">
                              {/* Línea conectora */}
                              {i < route.daily_itinerary.length - 1 && (
                                <div className="absolute left-[11px] top-8 bottom-0 w-0.5 bg-border" />
                              )}

                              {/* Punto del día */}
                              <div className="absolute left-0 top-0 h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">
                                {day.day || i + 1}
                              </div>

                              {/* Contenido del día */}
                              <div className="bg-muted/30 rounded-lg p-4">
                                <h4 className="font-semibold mb-2">{day.title}</h4>
                                {day.description && (
                                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                    {day.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                )}
              </Tabs>

              {/* Sección de Comentarios */}
              <div className="mt-8">
                <CommentsSection
                  routeId={route.id}
                  routeCreatorId={route.creator_id}
                  commentsEnabled={route.comments_enabled ?? true}
                  isCreator={isCreator}
                  allowImages={true}
                />
              </div>
            </div>

            {/* Columna Lateral */}
            <div className="space-y-6">
              {/* Card de Reserva/Inscripción */}
              <Card className="sticky top-24 border-2">
                <CardContent className="pt-6">
                  {/* Precio */}
                  {route.cost ? (
                    <div className="text-center mb-6">
                      <p className="text-sm text-muted-foreground">Precio por persona</p>
                      <p className="text-4xl font-bold">
                        {route.currency || 'PEN'} {route.cost}
                      </p>
                    </div>
                  ) : (
                    <div className="text-center mb-6">
                      <Badge variant="secondary" className="text-lg px-4 py-1">Gratuito</Badge>
                    </div>
                  )}

                  {/* Fecha y hora */}
                  <div className="space-y-3 mb-6">
                    {route.departure_date && (
                      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        <Calendar className="h-5 w-5 text-primary" />
                        <div>
                          <p className="text-xs text-muted-foreground">Fecha de salida</p>
                          <p className="font-medium">
                            {format(new Date(route.departure_date), "EEEE d 'de' MMMM, yyyy", { locale: es })}
                          </p>
                        </div>
                      </div>
                    )}

                    {route.meeting_time && (
                      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        <Clock className="h-5 w-5 text-primary" />
                        <div>
                          <p className="text-xs text-muted-foreground">Hora de encuentro</p>
                          <p className="font-medium">{route.meeting_time}</p>
                        </div>
                      </div>
                    )}

                    {route.max_capacity && (
                      <LiveCapacity
                        routeId={route.id}
                        maxCapacity={route.max_capacity}
                        initialCount={attendeeCount}
                      />
                    )}
                  </div>

                  {/* Acciones */}
                  <RouteActions
                    routeId={route.id}
                    routeSlug={route.slug}
                    creatorId={route.creator_id}
                    currentUserId={user?.id}
                    currentUserName={currentUserProfile?.full_name ?? 'Usuario'}
                    currentUserPhone={currentUserProfile?.phone ?? undefined}
                    creatorPhone={route.creator?.phone ?? undefined}
                    isCreator={isCreator}
                    status={route.status}
                    maxCapacity={route.max_capacity}
                    currentAttendees={attendeeCount}
                    routeTitle={route.title}
                    routeDate={route.departure_date ?? undefined}
                  />

                  {/* Botón para que el creador acceda al dashboard de asistentes */}
                  {isCreator && (
                    <div className="mt-3 pt-3 border-t">
                      <Button asChild variant="outline" className="w-full gap-2" size="sm">
                        <Link href={`/${locale}/my-routes/${route.id}/attendees`}>
                          <Users className="h-4 w-4" />
                          Gestionar Asistentes
                        </Link>
                      </Button>
                    </div>
                  )}

                  {/* Contacto de emergencia */}
                  {route.emergency_contact && (
                    <div className="mt-4 pt-4 border-t">
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Emergencias:</span>
                        <span className="font-medium">{route.emergency_contact}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Organizador */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Organizador</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    {/* <Avatar className="h-14 w-14 border-2 border-primary/20">
                      <AvatarImage src={route.creator?.avatar_url} />
                      <AvatarFallback className="bg-primary/10 text-primary font-bold">
                        {getInitials(route.creator?.full_name || 'U')}
                      </AvatarFallback>
                    </Avatar> */}
                    <div className="flex-1">
                      <p className="font-semibold">{route.creator?.full_name}</p>
                      <p className="text-sm text-muted-foreground">@{route.creator?.username}</p>
                    </div>
                  </div>

                  {route.creator?.bio && (
                    <p className="mt-4 text-sm text-muted-foreground line-clamp-3">
                      {route.creator.bio}
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Estadísticas (si están disponibles) */}
              {(route.views || route.favorites || route.average_rating) && (
                <Card>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      {route.views !== undefined && (
                        <div>
                          <Eye className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                          <p className="text-lg font-bold">{route.views}</p>
                          <p className="text-xs text-muted-foreground">Vistas</p>
                        </div>
                      )}
                      {route.favorites !== undefined && (
                        <div>
                          <Heart className="h-5 w-5 mx-auto mb-1 text-red-500" />
                          <p className="text-lg font-bold">{route.favorites}</p>
                          <p className="text-xs text-muted-foreground">Favoritos</p>
                        </div>
                      )}
                      {route.average_rating !== undefined && (
                        <div>
                          <Star className="h-5 w-5 mx-auto mb-1 text-amber-500" />
                          <p className="text-lg font-bold">{route.average_rating.toFixed(1)}</p>
                          <p className="text-xs text-muted-foreground">Rating</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer locale={locale} />
    </div>
  );
}
