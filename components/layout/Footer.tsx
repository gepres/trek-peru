import Link from 'next/link';
import { Mountain } from 'lucide-react';
import Image from 'next/image';

interface FooterProps {
  locale: string;
}

// Componente de pie de página
export function Footer({ locale }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-primary text-primary-foreground dark:bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo y descripción */}
          <div className="col-span-1 md:col-span-2">
            <Link href={`/${locale}`} className="flex items-center space-x-2 mb-4">
              <div className="size-8 text-primary bg-white rounded-lg flex items-center justify-center">
                {/* <Mountain className="h-5 w-5" /> */}
                <Image
                  src="/images/logo/logo-trek2.svg"
                  alt="Logo"
                  width={34}
                  height={34}
                />
              </div>
              <span className="font-bold text-xl">TrekPeru</span>
            </Link>
            <p className="text-sm text-primary-foreground/80 max-w-md">
              Plataforma colaborativa para compartir y organizar rutas de trekking en Perú.
              Descubre nuevas aventuras y conecta con otros apasionados del trekking.
            </p>
          </div>

          {/* Enlaces rápidos */}
          <div>
            <h3 className="font-semibold mb-4 text-white">Enlaces Rápidos</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href={`/${locale}/routes`} className="text-primary-foreground/70 hover:text-white transition-colors">
                  Explorar Rutas
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/my-routes`} className="text-primary-foreground/70 hover:text-white transition-colors">
                  Mis Rutas
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/profile`} className="text-primary-foreground/70 hover:text-white transition-colors">
                  Mi Perfil
                </Link>
              </li>
            </ul>
          </div>

          {/* Información */}
          <div>
            <h3 className="font-semibold mb-4 text-white">Información</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="text-primary-foreground/70 hover:text-white transition-colors">
                  Acerca de
                </a>
              </li>
              <li>
                <a href="#" className="text-primary-foreground/70 hover:text-white transition-colors">
                  Términos de Uso
                </a>
              </li>
              <li>
                <a href="#" className="text-primary-foreground/70 hover:text-white transition-colors">
                  Política de Privacidad
                </a>
              </li>
              <li>
                <a href="#" className="text-primary-foreground/70 hover:text-white transition-colors">
                  Contacto
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-8 border-t border-primary-foreground/10 text-center text-sm text-primary-foreground/60">
          <p>© {currentYear} TrekPeru. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
