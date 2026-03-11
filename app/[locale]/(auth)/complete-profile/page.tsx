import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import Image from 'next/image';
import { MapPin, Users } from 'lucide-react';
import { CompleteProfileForm } from '@/components/auth/CompleteProfileForm';

interface CompleteProfilePageProps {
  params: Promise<{ locale: string }>;
}

// Página para completar perfil tras login con Google
export default async function CompleteProfilePage({ params }: CompleteProfilePageProps) {
  const { locale } = await params;

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

  // Verificar sesión activa
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login`);

  // Obtener perfil actual
  const { data: profile } = await supabase
    .from('profiles')
    .select('username, phone, full_name, avatar_url')
    .eq('id', user.id)
    .single();

  // Si ya tiene username y phone, no necesita esta página
  if (profile?.username && profile?.phone) {
    redirect(`/${locale}/routes`);
  }

  // Sugerir username desde el nombre de Google (sin espacios, minúsculas)
  const suggestedUsername = profile?.full_name
    ? profile.full_name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_-]/g, '')
    : '';

  return (
    <div className="w-full space-y-6">
      {/* Card principal */}
      <div className="bg-card rounded-2xl border shadow-sm p-8 space-y-6">

        {/* Header con avatar de Google */}
        <div className="text-center space-y-3">
          {profile?.avatar_url ? (
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-primary mx-auto">
              <Image
                src={profile.avatar_url}
                alt="Avatar"
                width={64}
                height={64}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto text-2xl font-bold text-primary">
              {profile?.full_name?.[0]?.toUpperCase() ?? 'U'}
            </div>
          )}

          <div>
            <h1 className="text-2xl font-bold">¡Casi listo, {profile?.full_name?.split(' ')[0] ?? 'aventurero'}!</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Solo faltan unos datos para personalizar tu perfil
            </p>
          </div>
        </div>

        {/* Por qué pedimos estos datos */}
        <div className="bg-muted/50 rounded-xl p-4 space-y-3 border">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            ¿Por qué te pedimos esto?
          </p>
          <div className="space-y-2">
            <div className="flex items-start gap-2.5">
              <Users className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground">
                Tu <strong className="text-foreground">@username</strong> te identifica en la comunidad trekker
              </p>
            </div>
            <div className="flex items-start gap-2.5">
              <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground">
                Tu <strong className="text-foreground">teléfono</strong> lo usará el organizador de la ruta para coordinar salidas y emergencias
              </p>
            </div>
          </div>
        </div>

        {/* Formulario */}
        <CompleteProfileForm
          locale={locale}
          userId={user.id}
          defaultUsername={suggestedUsername}
        />
      </div>
    </div>
  );
}
