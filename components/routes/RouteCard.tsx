'use client';

import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Footprints, Star } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { RouteWithCreator } from '@/types/route.types';
import { Button } from '@/components/ui/button';
import { FavoriteButton } from './FavoriteButton';

interface RouteCardProps {
  route: RouteWithCreator;
  locale: string;
}

// Componente de tarjeta de ruta
export function RouteCard({ route, locale }: RouteCardProps) {
  const t = useTranslations('routes');

  // Configuración de dificultad con colores
  const difficultyConfig = {
    easy: {
      label: t('difficulty.easy'),
      className: 'bg-green-500/20 text-green-400',
    },
    moderate: {
      label: t('difficulty.moderate'),
      className: 'bg-yellow-500/20 text-yellow-400',
    },
    hard: {
      label: t('difficulty.hard'),
      className: 'bg-red-500/20 text-red-400',
    },
    extreme: {
      label: t('difficulty.extreme'),
      className: 'bg-purple-500/20 text-purple-400',
    },
  };

  const difficulty = difficultyConfig[route.difficulty] || difficultyConfig.moderate;

  // Rating promedio de la ruta
  const averageRating = route.average_rating || 0;

  return (
    <Link href={`/${locale}/routes/${route.slug}`}>
      <div className="group flex flex-col bg-card border border-border rounded-2xl overflow-hidden hover:shadow-2xl hover:shadow-primary/10 hover:border-primary/30 transition-all duration-300 h-full">
        {/* Imagen */}
        <div className="relative h-48 overflow-hidden bg-muted">
          {route.featured_image ? (
            <Image
              src={route.featured_image}
              alt={route.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="flex items-center justify-center h-full bg-gradient-to-br from-primary/20 to-primary/10">
              <MapPin className="h-16 w-16 text-primary/40" />
            </div>
          )}

          {/* Rating Badge */}
          {averageRating > 0 && (
            <div className="absolute top-3 left-3 glass-dark px-2.5 py-1 rounded-lg flex items-center gap-1">
              <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
              <span className="text-white text-xs font-bold">{averageRating.toFixed(1)}</span>
            </div>
          )}

          {/* Badge "Completada" para rutas en ese estado */}
          {route.status === 'completed' && (
            <div className="absolute top-3 right-3 bg-purple-600/90 backdrop-blur-sm text-white text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-lg">
              Completada
            </div>
          )}

          {/* Favorite Button — solo en rutas no completadas */}
          {route.status !== 'completed' && (
            <div className="absolute top-3 right-3">
              <FavoriteButton
                routeId={route.id}
                initialCount={route.favorites || 0}
                size="sm"
                className="bg-black/30 backdrop-blur-sm hover:bg-black/50 text-white border-0"
              />
            </div>
          )}
        </div>

        {/* Contenido */}
        <div className="p-5 flex flex-col flex-1">
          {/* Difficulty & Duration */}
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${difficulty.className}`}>
              {difficulty.label}
            </span>
            <span className="text-muted-foreground text-xs">•</span>
            <span className="text-muted-foreground text-xs font-medium">
              {route.estimated_duration
                ? route.estimated_duration >= 24
                  ? `${Math.floor(route.estimated_duration / 24)} ${Math.floor(route.estimated_duration / 24) === 1 ? 'Día' : 'Días'}`
                  : `${route.estimated_duration}h`
                : '1 Día'}
            </span>
          </div>

          {/* Título */}
          <h3 className="text-foreground text-lg font-bold leading-tight mb-2 group-hover:text-primary transition-colors">
            {route.title}
          </h3>

          {/* Descripción */}
          <p className="text-muted-foreground text-sm line-clamp-2 mb-4">
            {route.description || 'Descubre esta increíble ruta de trekking.'}
          </p>

          {/* Footer */}
          <div className="mt-auto pt-4 border-t border-border flex items-center justify-between">
            {/* Distancia */}
            {route.distance && (
              <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                <Footprints className="h-4 w-4" />
                <span>{route.distance}km</span>
              </div>
            )}

            {/* Botón de acción */}
            <Button
              size="sm"
              className="ml-auto bg-primary/20 hover:bg-primary hover:text-primary-foreground text-primary border border-primary/30 font-bold transition-all"
              onClick={(e) => {
                e.preventDefault();
                window.location.href = `/${locale}/routes/${route.slug}`;
              }}
            >
              Ver Ruta
            </Button>
          </div>
        </div>
      </div>
    </Link>
  );
}
