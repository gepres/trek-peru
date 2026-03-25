import type { Metadata } from 'next';
import { Suspense } from 'react';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales } from '@/i18n';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { GlobalJsonLd } from '@/components/seo/GlobalJsonLd';
import { GoogleAnalytics } from '@/components/analytics/GoogleAnalytics';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.trek-peru.com';

// metadataBase resuelve todas las URLs relativas (canonical, OG, hreflang) al dominio de producción
export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  openGraph: {
    siteName: 'TrekPeru',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@trekperu',
  },
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Validar que el locale sea válido
  if (!locales.includes(locale as any)) {
    notFound();
  }

  // Obtener mensajes de traducción
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body>
        {/* GA4: Suspense requerido por useSearchParams en GoogleAnalytics */}
        <Suspense fallback={null}>
          <GoogleAnalytics />
        </Suspense>
        <GlobalJsonLd locale={locale} />
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <NextIntlClientProvider messages={messages}>
            {children}
            <Toaster />
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
