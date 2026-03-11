import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Ruta de callback para el flujo PKCE de Supabase Auth.
// Supabase redirige aquí tras verificar el email/magic-link o el OAuth de Google.
// Intercambia el código por una sesión y verifica si el perfil está completo.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';
  const locale = searchParams.get('locale') ?? 'es';

  if (code) {
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    // Intercambiar el código PKCE por una sesión válida
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Verificar si el perfil tiene username y phone (requerido tras login Google)
      const { data: profile } = await supabase
        .from('profiles')
        .select('username, phone')
        .eq('id', data.user.id)
        .single();

      // Si falta username o phone → completar perfil antes de continuar
      if (!profile?.username || !profile?.phone) {
        return NextResponse.redirect(`${origin}/${locale}/complete-profile`);
      }

      // Perfil completo → ir al destino solicitado
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Si no hay código o falló el intercambio, redirigir a login con indicador de error
  const loginUrl = new URL('/', origin);
  loginUrl.searchParams.set('error', 'auth_callback_failed');
  return NextResponse.redirect(loginUrl);
}
