import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Middleware de Supabase para manejar autenticación
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Importante: no escribir lógica entre createServerClient y
  // supabase.auth.getUser(). Un simple error puede hacer que el
  // usuario sea aleatorio en cada request.

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Aquí puedes agregar lógica de protección de rutas si es necesario
  // Por ejemplo, redirigir a login si no hay usuario en rutas protegidas

  return supabaseResponse
}
