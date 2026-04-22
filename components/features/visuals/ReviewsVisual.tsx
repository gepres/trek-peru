import { Star, Shield } from 'lucide-react';

// Visual animado para "Reseñas Verificadas"
// Cards de reseñas apiladas con estrellas que se rellenan
export function ReviewsVisual() {
  const reviews = [
    {
      name: 'María L.',
      route: 'Salkantay Trek',
      rating: 5,
      text: 'Experiencia increíble. La descripción de la ruta fue exacta.',
      color: 'from-orange-400 to-red-500',
      delay: '0s',
      rotate: '-rotate-3',
    },
    {
      name: 'Carlos R.',
      route: 'Laguna 69',
      rating: 5,
      text: 'Perfecto para un día. El mapa con waypoints fue clave.',
      color: 'from-emerald-400 to-teal-600',
      delay: '0.3s',
      rotate: 'rotate-2',
    },
    {
      name: 'Julia P.',
      route: 'Ausangate',
      rating: 4,
      text: 'Alta dificultad bien calificada. Información muy útil.',
      color: 'from-sky-400 to-blue-600',
      delay: '0.6s',
      rotate: '-rotate-1',
    },
  ];

  return (
    <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-gradient-to-br from-amber-50 via-background to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-border shadow-xl p-6">
      {/* Badge "Verificado" */}
      <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-primary text-primary-foreground px-2.5 py-1.5 rounded-full shadow-lg animate-scale-in z-20">
        <Shield className="h-3 w-3" />
        <span className="text-[10px] font-bold">Verificado</span>
      </div>

      {/* Rating grande (decorativo) */}
      <div className="absolute top-4 left-4 animate-slide-up-fade">
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-black text-foreground">4.9</span>
          <span className="text-xs text-muted-foreground">/5</span>
        </div>
        <div className="flex items-center gap-0.5 mt-1">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="relative">
              <Star className="h-3 w-3 text-muted" />
              <div
                className="absolute inset-0 animate-star-fill origin-left"
                style={{ animationDelay: `${0.3 + i * 0.15}s`, animationFillMode: 'both', clipPath: 'inset(0 100% 0 0)' }}
              >
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              </div>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground mt-1">+324 reseñas</p>
      </div>

      {/* Stack de cards de reseñas */}
      <div className="absolute inset-0 flex items-center justify-center pt-8">
        <div className="relative w-[85%] max-w-[280px]">
          {reviews.map((r, i) => (
            <div
              key={i}
              className={`${i === 0 ? 'relative' : 'absolute inset-0'} ${r.rotate} animate-slide-up-fade`}
              style={{
                animationDelay: r.delay,
                animationFillMode: 'both',
                opacity: 0,
                transform: `translateY(${i * 8}px) translateX(${i * 6}px)`,
                zIndex: reviews.length - i,
              }}
            >
              <div className="bg-card rounded-xl shadow-lg border border-border p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${r.color} text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0`}>
                    {r.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold text-foreground leading-tight truncate">{r.name}</p>
                    <p className="text-[9px] text-muted-foreground truncate">{r.route}</p>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: r.rating }).map((_, idx) => (
                      <Star key={idx} className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground leading-snug line-clamp-2">
                  {r.text}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
