'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log del error para monitoreo
    console.error('Route page error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="text-center max-w-md">
        {/* Icono */}
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-amber-500/10 flex items-center justify-center">
          <AlertTriangle className="h-10 w-10 text-amber-500" />
        </div>

        {/* Mensaje */}
        <h1 className="text-3xl font-bold mb-4">Algo salió mal</h1>
        <p className="text-muted-foreground mb-8">
          Ocurrió un error al cargar esta ruta. Por favor intenta de nuevo.
        </p>

        {/* Acciones */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button onClick={reset} variant="default" size="lg">
            <RefreshCw className="h-4 w-4 mr-2" />
            Intentar de nuevo
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/es/routes">
              <Home className="h-4 w-4 mr-2" />
              Ver todas las rutas
            </Link>
          </Button>
        </div>

        {/* Código de error (solo en desarrollo) */}
        {process.env.NODE_ENV === 'development' && error.digest && (
          <p className="text-xs text-muted-foreground mt-8 font-mono">
            Error ID: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
