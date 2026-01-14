import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Mountain, ArrowLeft, Search } from 'lucide-react';

export default function RouteNotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="text-center max-w-md">
        {/* Icono animado */}
        <div className="relative w-32 h-32 mx-auto mb-8">
          <div className="absolute inset-0 bg-primary/10 rounded-full animate-pulse" />
          <div className="absolute inset-4 bg-primary/20 rounded-full animate-pulse delay-75" />
          <Mountain className="absolute inset-0 m-auto h-16 w-16 text-primary" />
        </div>

        {/* Mensaje */}
        <h1 className="text-4xl font-bold mb-4">Ruta no encontrada</h1>
        <p className="text-muted-foreground mb-8">
          La ruta que buscas no existe o ha sido eliminada.
          Puede que el enlace esté incorrecto o que la ruta haya cambiado de ubicación.
        </p>

        {/* Acciones */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild variant="default" size="lg">
            <Link href="/es/routes">
              <Search className="h-4 w-4 mr-2" />
              Explorar rutas
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/es">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al inicio
            </Link>
          </Button>
        </div>

        {/* Sugerencia */}
        <p className="text-sm text-muted-foreground mt-8">
          ¿Buscas algo específico? Usa nuestro buscador para encontrar rutas de trekking en Perú.
        </p>
      </div>
    </div>
  );
}
