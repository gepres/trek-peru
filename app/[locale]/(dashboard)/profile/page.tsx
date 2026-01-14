import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ProfileForm } from '@/components/profile/ProfileForm';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

// Página de perfil de usuario
export default async function ProfilePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const supabase = await createClient();

  // Obtener usuario autenticado
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  // Obtener perfil del usuario
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) {
    return (
      <div className="p-4">
        <p className="text-destructive">No se pudo cargar el perfil</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Mi Perfil
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Administra tu información personal y preferencias
        </p>
      </div>

      <div className="grid gap-6">
        {/* Formulario de edición */}
        <Card>
          <CardHeader>
            <CardTitle>Editar Perfil</CardTitle>
            <CardDescription>
              Actualiza tus datos personales y preferencias de perfil
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProfileForm profile={profile} />
          </CardContent>
        </Card>

        {/* Información de cuenta */}
        <Card>
          <CardHeader>
            <CardTitle>Información de la Cuenta</CardTitle>
            <CardDescription>
              Datos de tu cuenta de TrekPeru
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</p>
                <p className="text-base text-gray-900 dark:text-white">{user.email}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Cuenta creada</p>
                <p className="text-base text-gray-900 dark:text-white">
                  {new Date(user.created_at).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
              <div className="space-y-1 md:col-span-2">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">ID de Usuario</p>
                <p className="text-xs text-muted-foreground font-mono break-all">{user.id}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
