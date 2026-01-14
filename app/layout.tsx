import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'TrekPeru - Rutas de Trekking en Perú',
  description: 'Plataforma colaborativa para compartir y organizar rutas de trekking en Perú',
  icons: {
    icon: '/images/logo.svg',
  },

}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
