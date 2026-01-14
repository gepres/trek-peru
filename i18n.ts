import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';

// Locales soportados
export const locales = ['es', 'en'] as const;
export const defaultLocale = 'es' as const;

export type Locale = (typeof locales)[number];

export default getRequestConfig(async ({ requestLocale }) => {
  // Obtener el locale de la request
  let locale = await requestLocale;

  // Validar que el locale existe
  if (!locale || !locales.includes(locale as Locale)) {
    notFound();
  }

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default
  };
});
