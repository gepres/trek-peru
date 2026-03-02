import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Ruta de callback para el flujo PKCE de Supabase Auth.
// Supabase redirige aquí tras verificar el email/magic-link con un `code` de un solo uso.
// Esta ruta intercambia ese código por una sesión real y setea las cookies de autenticación.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  // `next` permite redirigir a una ruta específica tras el login (ej. /es/routes)
  const next = searchParams.get('next') ?? '/';

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
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Redirigir al destino solicitado (con locale ya incluido en `next`)
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Si no hay código o falló el intercambio, redirigir a login con indicador de error
  const loginUrl = new URL('/', origin);
  loginUrl.searchParams.set('error', 'auth_callback_failed');
  return NextResponse.redirect(loginUrl);
}
