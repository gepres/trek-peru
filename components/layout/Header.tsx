'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/presentation/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from './LanguageSwitcher';
import { UserMenu } from '@/components/shared/UserMenu';
import { Menu, X, Plus, Sun, Moon, Monitor } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import Image from 'next/image';
import { cn } from '@/lib/utils/cn';

interface HeaderProps {
  locale: string;
}

// Componente de encabezado con navegación
export function Header({ locale }: HeaderProps) {
  const t = useTranslations('navigation');
  const pathname = usePathname();
  const { user, profile, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { theme, setTheme } = useTheme();

  // Detectar scroll para cambiar estilos del header
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    // Verificar posición inicial
    handleScroll();

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Home: efecto transparente → glass oscuro con scroll
  const isHomePage = pathname === `/${locale}` || pathname === `/${locale}/`;

  // Páginas con glass oscuro permanente: detalle de ruta /routes/[id]
  // Excluye /routes/new y /routes/[id]/edit (tienen formularios, no hero oscuro)
  const pathSegments = pathname.split('/');
  const isDarkGlassPage =
    pathSegments.length === 4 &&
    pathSegments[2] === 'routes' &&
    pathSegments[3] !== 'new';

  // Texto blanco en: home (hero oscuro o glass) y páginas con glass permanente
  const useWhiteText = isHomePage || isDarkGlassPage;

  // Enlaces de navegación
  const navLinks = [
    { href: `/${locale}/routes`, label: t('routes') },
  ];

  // Enlaces autenticados
  const authenticatedLinks = [
    { href: `/${locale}/my-routes`, label: t('myRoutes') },
    { href: `/${locale}/my-attendances`, label: t('myAttendances') },
    { href: `/${locale}/favorites`, label: t('favorites') },
  ];

  // Función para cerrar sesión
  const handleSignOut = async () => {
    await signOut();
    window.location.href = `/${locale}`;
  };

  // Clase para los links del nav desktop y mobile
  const getLinkClass = (href: string, mobile = false) =>
    cn(
      "text-sm font-medium transition-colors",
      mobile && "px-3 py-2 rounded-lg",
      useWhiteText
        ? pathname === href
          ? mobile ? "text-white bg-white/10" : "text-white"
          : mobile
          ? "text-white/70 hover:text-white hover:bg-white/5"
          : "text-white/70 hover:text-white"
        : pathname === href
        ? mobile ? "text-foreground bg-accent/10" : "text-foreground"
        : mobile
        ? "text-muted-foreground hover:text-foreground hover:bg-accent/5"
        : "text-muted-foreground hover:text-foreground"
    );

  return (
    <header
      className={cn(
        "fixed top-0 z-50 w-full transition-all duration-200",
        (isHomePage || isDarkGlassPage)
          ? isScrolled
            // Hero pages + scroll → glass oscuro con borde sutil
            ? "bg-[rgba(17,24,22,0.7)] backdrop-blur-[12px] border-b border-white/5"
            // Hero pages + top → transparente, borde invisible (evita flash al volver al top)
            : "bg-transparent border-b border-transparent"
          : // Otras páginas → siempre fondo adaptativo al tema
            "bg-background/90 dark:bg-[rgba(17,24,22,0.85)] backdrop-blur-[12px] border-b border-border dark:border-white/5"
      )}
    >
      <div className="px-6 lg:px-10 py-3 flex items-center justify-between max-w-[1440px] mx-auto">
        {/* Logo */}
        <Link
          href={`/${locale}`}
          className="flex items-center gap-4"
        >
          <div className="size-8 text-primary bg-white rounded-lg flex items-center justify-center">
            <Image
              src="/images/logo/logo-trek2.svg"
              alt="Logo"
              width={34}
              height={34}
            />
          </div>
          <h2
            className={cn(
              "text-lg font-bold tracking-tight",
              useWhiteText ? "text-white" : "text-foreground dark:text-white"
            )}
          >
            TrekPeru
          </h2>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className={getLinkClass(link.href)}>
              {link.label}
            </Link>
          ))}

          {user && authenticatedLinks.map((link) => (
            <Link key={link.href} href={link.href} className={getLinkClass(link.href)}>
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Language Switcher */}
          <div className="hidden sm:block">
            <LanguageSwitcher locale={locale} />
          </div>

          {/* Auth section */}
          {user ? (
            <>
              {/* Create Route Button - Desktop */}
              <Button
                asChild
                size="sm"
                className="hidden lg:flex h-9 px-4 rounded-xl bg-accent hover:bg-accent/90 text-white font-bold shadow-lg shadow-accent/20 transition-all"
              >
                <Link href={`/${locale}/routes/new`}>
                  <Plus className="h-4 w-4 mr-1" />
                  Crear Ruta
                </Link>
              </Button>

              {/* User Menu - Desktop & Mobile */}
              <div className="hidden sm:block">
                <UserMenu
                  user={user}
                  profile={profile}
                  locale={locale}
                  onSignOut={handleSignOut}
                />
              </div>
            </>
          ) : (
            /* Guest buttons - Desktop */
            <div className="hidden lg:flex items-center gap-2">
              <Button
                asChild
                variant="ghost"
                size="sm"
                className={cn(
                  useWhiteText
                    ? "text-white hover:bg-white/10"
                    : "text-foreground dark:text-white hover:bg-accent/10"
                )}
              >
                <Link href={`/${locale}/login`}>Iniciar Sesión</Link>
              </Button>
              <Button
                asChild
                size="sm"
                className="h-9 px-4 rounded-xl bg-accent hover:bg-accent/90 text-white font-bold shadow-lg shadow-accent/20 transition-all"
              >
                <Link href={`/${locale}/register`}>Registrarse</Link>
              </Button>
            </div>
          )}

          {/* Mobile menu button — visible hasta lg (1024px) para incluir tablet */}
          <button
            className={cn(
              "lg:hidden p-2 rounded-lg transition-colors",
              useWhiteText
                ? "text-white hover:bg-white/10"
                : "text-foreground dark:text-white hover:bg-accent/10"
            )}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile/Tablet Navigation — visible hasta lg (1024px).
          En páginas hero sin scroll el header es transparente, por eso el dropdown
          necesita su propio fondo para que el contenido sea legible */}
      {mobileMenuOpen && (
        <div
          className={cn(
            "lg:hidden py-4 border-t",
            useWhiteText
              // Hero pages: siempre dark glass en el dropdown (independiente del scroll)
              ? "bg-[rgba(0,0,0,0.2)] backdrop-blur-[15px] border-white/10"
              : "bg-background/95 backdrop-blur-[12px] border-border dark:bg-[rgba(17,24,22,0.92)] dark:border-white/10"
          )}
        >
          <nav className="flex flex-col space-y-3 px-6">
            {/* Main nav links */}
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={getLinkClass(link.href, true)}
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}

            {/* Authenticated links */}
            {user && authenticatedLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={getLinkClass(link.href, true)}
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}

            {/* Language Switcher - Mobile */}
            <div
              className={cn(
                "pt-3 border-t",
                useWhiteText ? "border-white/10" : "border-border dark:border-white/10"
              )}
            >
              <LanguageSwitcher locale={locale} />
            </div>

            {/* Theme Toggle - Mobile */}
            <div
              className={cn(
                "pt-3 border-t",
                useWhiteText ? "border-white/10" : "border-border dark:border-white/10"
              )}
            >
              <p
                className={cn(
                  "text-xs font-medium mb-2 px-1",
                  useWhiteText ? "text-white/50" : "text-muted-foreground"
                )}
              >
                Tema
              </p>
              <div className="flex gap-2">
                {/* Claro */}
                <button
                  onClick={() => setTheme('light')}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    useWhiteText
                      ? theme === 'light'
                        ? "bg-white/20 text-white"
                        : "text-white/60 hover:text-white hover:bg-white/10"
                      : theme === 'light'
                      ? "bg-accent/15 text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/10"
                  )}
                >
                  <Sun className="h-4 w-4" />
                  Claro
                </button>
                {/* Oscuro */}
                <button
                  onClick={() => setTheme('dark')}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    useWhiteText
                      ? theme === 'dark'
                        ? "bg-white/20 text-white"
                        : "text-white/60 hover:text-white hover:bg-white/10"
                      : theme === 'dark'
                      ? "bg-accent/15 text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/10"
                  )}
                >
                  <Moon className="h-4 w-4" />
                  Oscuro
                </button>
                {/* Sistema */}
                <button
                  onClick={() => setTheme('system')}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    useWhiteText
                      ? theme === 'system'
                        ? "bg-white/20 text-white"
                        : "text-white/60 hover:text-white hover:bg-white/10"
                      : theme === 'system'
                      ? "bg-accent/15 text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/10"
                  )}
                >
                  <Monitor className="h-4 w-4" />
                  Sistema
                </button>
              </div>
            </div>

            {/* Auth section - Mobile */}
            <div
              className={cn(
                "pt-3 border-t space-y-2",
                useWhiteText ? "border-white/10" : "border-border dark:border-white/10"
              )}
            >
              {user ? (
                <>
                  {/* User info */}
                  <div className="flex items-center justify-between px-3 py-2">
                    <div className="flex items-center gap-3">
                      {profile?.avatar_url ? (
                        <div className="size-10 rounded-full border-2 border-primary overflow-hidden">
                          <img
                            src={profile.avatar_url}
                            alt="Avatar"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                          {profile?.full_name?.[0]?.toUpperCase() || 'U'}
                        </div>
                      )}
                      <div>
                        <p
                          className={cn(
                            "text-sm font-medium",
                            useWhiteText ? "text-white" : "text-foreground dark:text-white"
                          )}
                        >
                          {profile?.full_name || 'Usuario'}
                        </p>
                        <p
                          className={cn(
                            "text-xs",
                            useWhiteText ? "text-white/60" : "text-muted-foreground"
                          )}
                        >
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Create Route - Mobile */}
                  <Button
                    asChild
                    className="w-full bg-accent hover:bg-accent/90 text-white font-bold"
                  >
                    <Link href={`/${locale}/routes/new`} onClick={() => setMobileMenuOpen(false)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Crear Ruta
                    </Link>
                  </Button>

                  {/* Logout */}
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full",
                      useWhiteText
                        ? "border-white/20 text-red-500 hover:bg-white/10"
                        : "border-border text-foreground dark:border-white/20 dark:text-white"
                    )}
                    onClick={() => {
                      handleSignOut();
                      setMobileMenuOpen(false);
                    }}
                  >
                    {t('logout')}
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    asChild
                    variant="outline"
                    className={cn(
                      "w-full",
                      useWhiteText
                        ? "border-white/20 text-white hover:bg-white/10"
                        : "border-border text-foreground dark:border-white/20 dark:text-white"
                    )}
                  >
                    <Link href={`/${locale}/login`} onClick={() => setMobileMenuOpen(false)}>
                      Iniciar Sesión
                    </Link>
                  </Button>
                  <Button
                    asChild
                    className="w-full bg-accent hover:bg-accent/90 text-white font-bold"
                  >
                    <Link href={`/${locale}/register`} onClick={() => setMobileMenuOpen(false)}>
                      Registrarse
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
