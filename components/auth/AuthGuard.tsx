'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/presentation/hooks/useAuth';

interface AuthGuardProps {
  children: React.ReactNode;
  locale: string;
}

// Componente para proteger rutas que requieren autenticación
export function AuthGuard({ children, locale }: AuthGuardProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Redirigir a login si no hay usuario autenticado
    if (!loading && !user) {
      router.push(`/${locale}/login`);
    }
  }, [user, loading, router, locale]);

  // Mostrar loading mientras se verifica la autenticación
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="mt-2 text-sm text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  // No mostrar contenido si no hay usuario
  if (!user) {
    return null;
  }

  // Mostrar contenido protegido
  return <>{children}</>;
}
