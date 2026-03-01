'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/presentation/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from './LanguageSwitcher';
import { UserMenu } from '@/components/shared/UserMenu';
import { Menu, X, Mountain, Plus } from 'lucide-react';
import { useState, useEffect } from 'react';
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

  return (
    <header
      className={cn(
        "fixed top-0 z-50 w-full transition-all duration-200",
        isScrolled
          ? "bg-[rgba(17,24,22,0.7)] backdrop-blur-[12px] border-b border-white/5"
          : "bg-transparent backdrop-blur-[2px]"
      )}
    >
      <div className="px-6 md:px-10 py-3 flex items-center justify-between max-w-[1440px] mx-auto">
        {/* Logo */}
        <Link href={`/${locale}`} className="flex items-center gap-4 text-white">
          <div className="size-8 text-primary bg-white rounded-lg flex items-center justify-center">
            {/* <Mountain className="h-5 w-5" /> */}
            <Image
              src="/images/logo/logo-trek2.svg"
              alt="Logo"
              width={34}
              height={34}
            />
          </div>
          <h2 className="text-white text-lg font-bold tracking-tight">TrekPeru</h2>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition-colors ${
                pathname === link.href
                  ? 'text-white'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              {link.label}
            </Link>
          ))}

          {user && authenticatedLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition-colors ${
                pathname === link.href
                  ? 'text-white'
                  : 'text-white/70 hover:text-white'
              }`}
            >
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
                className="hidden md:flex h-9 px-4 rounded-xl bg-accent hover:bg-accent/90 text-white font-bold shadow-lg shadow-accent/20 transition-all "
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
            <>
              {/* Guest buttons - Desktop */}
              <div className="hidden md:flex items-center gap-2">
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/10"
                >
                  <Link href={`/${locale}/login`}>
                    Iniciar Sesión
                  </Link>
                </Button>
                <Button
                  asChild
                  size="sm"
                  className="h-9 px-4 rounded-xl bg-accent hover:bg-accent/90 text-white font-bold shadow-lg shadow-accent/20 transition-all"
                >
                  <Link href={`/${locale}/register`}>
                    Registrarse
                  </Link>
                </Button>
              </div>
            </>
          )}

          {/* Mobile menu button */}
          <button
            className="sm:hidden text-white p-2 hover:bg-white/10 rounded-lg transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="sm:hidden py-4 border-t border-white/10">
            <nav className="flex flex-col space-y-3 px-6">
              {/* Main nav links */}
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm font-medium transition-colors px-3 py-2 rounded-lg ${
                    pathname === link.href
                      ? 'text-white bg-white/10'
                      : 'text-white/70 hover:text-white hover:bg-white/5'
                  }`}
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
                  className={`text-sm font-medium transition-colors px-3 py-2 rounded-lg ${
                    pathname === link.href
                      ? 'text-white bg-white/10'
                      : 'text-white/70 hover:text-white hover:bg-white/5'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}

              {/* Language Switcher - Mobile */}
              <div className="pt-3 border-t border-white/10">
                <LanguageSwitcher locale={locale} />
              </div>

              {/* Auth section - Mobile */}
              <div className="pt-3 border-t border-white/10 space-y-2">
                {user ? (
                  <>
                    {/* User info with menu */}
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
                          <p className="text-sm font-medium text-white">
                            {profile?.full_name || 'Usuario'}
                          </p>
                          <p className="text-xs text-white/60">
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
                      className="w-full border-white/20 text-white hover:bg-white/10"
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
                      className="w-full border-white/20 text-white hover:bg-white/10"
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
