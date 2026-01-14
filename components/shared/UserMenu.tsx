'use client';

import { User, LogOut, Settings, Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu';

interface UserMenuProps {
  user: {
    email?: string;
  };
  profile?: {
    full_name?: string;
    avatar_url?: string;
  } | null;
  locale: string;
  onSignOut: () => void;
}

export function UserMenu({ user, profile, locale, onSignOut }: UserMenuProps) {
  const t = useTranslations('navigation');
  const { setTheme, theme } = useTheme();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="size-10 rounded-full border-2 border-primary overflow-hidden cursor-pointer hover:border-accent transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt="Avatar"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
              {profile?.full_name ? getInitials(profile.full_name) : <User className="h-5 w-5" />}
            </div>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64">
        {/* User Info */}
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {profile?.full_name || 'Usuario'}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {/* Profile Link */}
        <DropdownMenuItem asChild>
          <Link href={`/${locale}/profile`} className="cursor-pointer">
            <User className="mr-2 h-4 w-4" />
            <span>{t('profile')}</span>
          </Link>
        </DropdownMenuItem>

        {/* My Routes */}
        <DropdownMenuItem asChild>
          <Link href={`/${locale}/my-routes`} className="cursor-pointer">
            <Settings className="mr-2 h-4 w-4" />
            <span>{t('myRoutes')}</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Theme Submenu */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Monitor className="mr-2 h-4 w-4" />
            <span>Tema</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem onClick={() => setTheme('light')}>
              <Sun className="mr-2 h-4 w-4" />
              <span>Claro</span>
              {theme === 'light' && <span className="ml-auto">✓</span>}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme('dark')}>
              <Moon className="mr-2 h-4 w-4" />
              <span>Oscuro</span>
              {theme === 'dark' && <span className="ml-auto">✓</span>}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme('system')}>
              <Monitor className="mr-2 h-4 w-4" />
              <span>Sistema</span>
              {theme === 'system' && <span className="ml-auto">✓</span>}
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSeparator />

        {/* Logout */}
        <DropdownMenuItem
          onClick={onSignOut}
          className="cursor-pointer text-destructive focus:text-destructive"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>{t('logout')}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
