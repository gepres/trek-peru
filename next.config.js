/** @type {import('next').NextConfig} */
const withNextIntl = require('next-intl/plugin')('./i18n.ts');

// Content-Security-Policy en modo Report-Only para rollout seguro.
// Permite los dominios realmente usados por la app: Supabase, Mapbox, GA4 y EmailJS.
// 'unsafe-inline' y 'unsafe-eval' son necesarios para Next.js hydration y gtag.
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://api.mapbox.com",
  "style-src 'self' 'unsafe-inline' https://api.mapbox.com https://fonts.googleapis.com",
  "img-src 'self' data: blob: https://*.supabase.co https://lh3.googleusercontent.com https://www.google-analytics.com https://*.google-analytics.com https://*.googletagmanager.com https://api.mapbox.com https://*.tiles.mapbox.com https://*.mapbox.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://www.google-analytics.com https://*.google-analytics.com https://*.analytics.google.com https://api.mapbox.com https://events.mapbox.com https://*.tiles.mapbox.com https://api.emailjs.com",
  "worker-src 'self' blob:",
  "frame-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join('; ');

// Headers de seguridad aplicados a todas las rutas
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  // Report-Only primero para detectar violaciones sin bloquear tráfico real
  { key: 'Content-Security-Policy-Report-Only', value: csp },
];

const nextConfig = {
  // Ocultar el header X-Powered-By: Next.js (reduce fingerprinting)
  poweredByHeader: false,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Bloquear indexación en dominios Vercel preview (trek-peru.vercel.app)
          {
            key: 'X-Robots-Tag',
            value: process.env.VERCEL_URL?.includes('vercel.app')
              ? 'noindex, nofollow'
              : 'index, follow',
          },
          ...securityHeaders,
        ],
      },
    ];
  },
  async redirects() {
    return [
      // Raíz → locale por defecto con 308 permanente.
      // Google trata 308 como 301 (preserva PageRank). Evita el 307 temporal de next-intl
      // que no transfiere señales de ranking entre bots.
      {
        source: '/',
        destination: '/es',
        permanent: true,
      },
    ];
  },
};

module.exports = withNextIntl(nextConfig);
