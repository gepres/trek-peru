'use client';

import { usePathname, useRouter } from 'next/navigation';
import { locales, type Locale } from '@/i18n';
import { Globe, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

interface LanguageSwitcherProps {
  locale: string;
}

// Componente para cambiar de idioma
export function LanguageSwitcher({ locale }: LanguageSwitcherProps) {
  const pathname = usePathname();
  const router = useRouter();

  // Cambiar idioma
  const switchLocale = (newLocale: Locale) => {
    // Reemplazar el locale en la URL actual
    const segments = pathname.split('/');
    segments[1] = newLocale;
    const newPath = segments.join('/');

    router.push(newPath);
  };

  const languageNames = {
    es: 'Español',
    en: 'English',
    pt: 'Português'
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-9 px-3 text-white/70 hover:text-white hover:bg-white/10 gap-2 data-[state=open]:bg-white/10 data-[state=open]:text-white"
        >
          <Globe className="h-4 w-4" />
          <span className="uppercase text-xs font-semibold">{locale}</span>
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[150px]">
        {locales.map((loc) => (
          <DropdownMenuItem 
            key={loc} 
            onClick={() => switchLocale(loc)}
            className="cursor-pointer"
          >
            <span className={locale === loc ? 'font-bold' : ''}>
              {languageNames[loc as keyof typeof languageNames] || loc.toUpperCase()}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
