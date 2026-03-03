import type { Metadata } from 'next'
import './globals.css'

// URL base de la aplicación (producción o desarrollo)
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://trek-peru.vercel.app';

export const metadata: Metadata = {
  // metadataBase es CRÍTICO: resuelve rutas relativas en openGraph.images, twitter.images, etc.
  metadataBase: new URL(APP_URL),

  // Plantilla de título: '%s | TrekPeru' — cada página pone su propio %s
  title: {
    default: 'TrekPeru — Rutas de Trekking en Perú',
    template: '%s | TrekPeru',
  },

  description:
    'Plataforma colaborativa para descubrir, compartir y organizar rutas de trekking en Perú. Camino Inca, Salkantay, Ausangate y cientos de rutas verificadas.',

  keywords: [
    'trekking Perú',
    'rutas trekking',
    'Camino Inca',
    'Salkantay',
    'Ausangate',
    'senderismo Perú',
    'turismo aventura',
    'montañismo',
    'hiking Peru',
  ],

  authors: [{ name: 'GEPRES Team', url: APP_URL }],
  creator: 'GEPRES Team',
  publisher: 'TrekPeru',

  // Favicons y manifest
  icons: {
    icon: [
      { url: '/images/favicon/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/images/favicon/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: '/images/favicon/apple-touch-icon.png',
    other: [
      { rel: 'manifest', url: '/images/favicon/site.webmanifest' },
    ],
  },

  // Open Graph base (cada página puede sobreescribir)
  openGraph: {
    type: 'website',
    siteName: 'TrekPeru',
    title: 'TrekPeru — Rutas de Trekking en Perú',
    description:
      'Plataforma colaborativa para descubrir, compartir y organizar rutas de trekking en Perú.',
    images: [
      {
        url: '/images/logo/logo-trek.png',
        width: 512,
        height: 512,
        alt: 'TrekPeru — Rutas de Trekking en Perú',
      },
    ],
  },

  // Twitter / X Card base
  twitter: {
    card: 'summary',
    site: '@TrekPeru',
    title: 'TrekPeru — Rutas de Trekking en Perú',
    description:
      'Plataforma colaborativa para descubrir, compartir y organizar rutas de trekking en Perú.',
    images: ['/images/logo/logo-trek.png'],
  },

  // Directiva de indexación por defecto (páginas privadas la sobreescriben a noindex)
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children;
}
