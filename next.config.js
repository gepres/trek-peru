/** @type {import('next').NextConfig} */
const withNextIntl = require('next-intl/plugin')('./i18n.ts');

// Headers de seguridad aplicados a todas las rutas
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];

const nextConfig = {
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
};

module.exports = withNextIntl(nextConfig);
