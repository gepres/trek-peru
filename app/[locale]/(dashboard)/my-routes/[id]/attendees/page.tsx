import { redirect } from 'next/navigation';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/server';
import { AttendeesDashboard } from '@/components/routes/attendees/AttendeesDashboard';

interface PageProps {
  params: Promise<{ locale: string; id: string }>;
}

// Página de gestión de asistentes por ruta — solo accesible para el creador
export default async function RouteAttendeesPage({ params }: PageProps) {
  const { locale, id } = await params;

  const supabase = await createClient();

  // El DashboardLayout ya verifica la sesión, pero se re-verifica para obtener el user.id
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login`);

  // Obtener la ruta
  const { data: route, error: routeError } = await supabase
    .from('routes')
    .select('id, slug, title, departure_date, meeting_time, creator_id, meeting_point')
    .eq('id', id)
    .single();

  if (routeError || !route) notFound();

  // Solo el creador puede acceder a este dashboard
  if (route.creator_id !== user.id) redirect(`/${locale}/routes/${route.slug}`);

  // Cargar asistentes iniciales desde el servidor
  const { data: attendees } = await supabase
    .from('attendees')
    .select(`*, user:profiles(*)`)
    .eq('route_id', id)
    .order('registration_date', { ascending: true });

  // Extraer dirección del punto de encuentro si existe
  const meetingAddress = route.meeting_point
    ? (route.meeting_point as any).address ?? undefined
    : undefined;

  return (
    <div className="space-y-6">
      {/* Navegación de vuelta */}
      <Button variant="ghost" size="sm" asChild>
        <Link href={`/${locale}/my-routes`}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Mis Rutas
        </Link>
      </Button>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="h-6 w-6" />
            Gestión de Asistentes
          </h1>
          <p className="text-muted-foreground mt-1">{route.title}</p>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/${locale}/routes/${route.slug}`}>Ver Ruta Pública</Link>
        </Button>
      </div>

      <AttendeesDashboard
        routeId={id}
        routeTitle={route.title}
        routeDate={route.departure_date ?? undefined}
        meetingPoint={meetingAddress}
        meetingTime={route.meeting_time ?? undefined}
        requesterId={user.id}
        routeCreatorId={route.creator_id}
        initialAttendees={(attendees ?? []) as any}
      />
    </div>
  );
}
