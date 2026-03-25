// Utilidades para Google Analytics 4
// Referencia: https://developers.google.com/analytics/devguides/collection/ga4

declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
    dataLayer: unknown[];
  }
}

// ID de medición de GA4 (G-XXXXXXXXXX)
export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

// Verificar si GA4 está habilitado y disponible
export const isGAEnabled =
  typeof window !== 'undefined' &&
  typeof window.gtag === 'function' &&
  !!GA_MEASUREMENT_ID;

// ─── Pageview ────────────────────────────────────────────────────────────────

export function trackPageview(url: string) {
  if (!isGAEnabled) return;
  window.gtag('config', GA_MEASUREMENT_ID!, { page_path: url });
}

// ─── Eventos personalizados ───────────────────────────────────────────────────

type GaEventParams = {
  [key: string]: string | number | boolean | undefined;
};

export function trackEvent(
  eventName: string,
  params?: GaEventParams
) {
  if (!isGAEnabled) return;
  window.gtag('event', eventName, params);
}

// ─── Eventos específicos de TrekPeru ─────────────────────────────────────────

export const analytics = {
  // Rutas
  routeView: (routeId: string, routeName: string) =>
    trackEvent('route_view', { route_id: routeId, route_name: routeName }),

  routeCreate: (routeName: string) =>
    trackEvent('route_create', { route_name: routeName }),

  routeJoin: (routeId: string, routeName: string) =>
    trackEvent('route_join', { route_id: routeId, route_name: routeName }),

  routeLeave: (routeId: string) =>
    trackEvent('route_leave', { route_id: routeId }),

  routeDelete: (routeId: string) =>
    trackEvent('route_delete', { route_id: routeId }),

  // Búsqueda
  search: (query: string, resultsCount?: number) =>
    trackEvent('search', { search_term: query, results_count: resultsCount }),

  // Favoritos
  favoriteAdd: (routeId: string) =>
    trackEvent('favorite_add', { route_id: routeId }),

  favoriteRemove: (routeId: string) =>
    trackEvent('favorite_remove', { route_id: routeId }),

  // Comentarios
  commentAdd: (routeId: string) =>
    trackEvent('comment_add', { route_id: routeId }),

  commentDelete: () =>
    trackEvent('comment_delete'),

  // Autenticación
  signUp: (method: 'email' = 'email') =>
    trackEvent('sign_up', { method }),

  login: (method: 'email' = 'email') =>
    trackEvent('login', { method }),

  // Perfil
  profileUpdate: () =>
    trackEvent('profile_update'),

  // Compartir
  share: (routeId: string, method: string) =>
    trackEvent('share', { route_id: routeId, method }),
};
