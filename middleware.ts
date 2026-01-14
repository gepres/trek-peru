import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './i18n';

export default createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always'
});

export const config = {
  // Matcher para rutas que necesitan i18n
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};
