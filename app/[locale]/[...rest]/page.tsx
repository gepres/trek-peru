import { notFound } from 'next/navigation';

// Catch-all: captura cualquier ruta no definida bajo /[locale]/* y dispara not-found.tsx.
// Why: Next.js solo muestra app/[locale]/not-found.tsx si notFound() es llamado desde un
// segmento dentro de [locale]. Sin este catch-all, las URLs inexistentes caen al 404 global
// por defecto ("This page could not be found") en vez de al 404 personalizado con locale.
export default function CatchAllNotFound() {
  notFound();
}
