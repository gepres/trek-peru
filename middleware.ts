import createMiddleware from 'next-intl/middleware';
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { locales, defaultLocale } from './i18n';

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always'
});

// Rutas que no deben ser accesibles si el usuario ya está autenticado
// reset-password queda excluida porque necesita sesión temporal de recuperación
const AUTH_ROUTES = ['/login', '/register', '/forgot-password'];

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Verificar si la ruta actual es una ruta de autenticación (con cualquier locale)
  const isAuthRoute = locales.some(locale =>
    AUTH_ROUTES.some(route => pathname === `/${locale}${route}`)
  );

  if (isAuthRoute) {
    // Crear cliente Supabase para verificar sesión
    let response = NextResponse.next({ request });

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
            response = NextResponse.next({ request });
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      // Detectar el locale de la URL para redirigir al home correcto
      const locale = locales.find(l => pathname.startsWith(`/${l}/`) || pathname === `/${l}`) ?? defaultLocale;
      const homeUrl = new URL(`/${locale}`, request.url);
      return NextResponse.redirect(homeUrl);
    }
  }

  // Continuar con el middleware de i18n
  return intlMiddleware(request);
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};
