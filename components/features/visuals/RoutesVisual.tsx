import { Mountain, Clock, TrendingUp, CheckCircle2 } from 'lucide-react';

// Visual animado para "Rutas Verificadas"
// Tarjetas de rutas con badges de dificultad, stats animadas
export function RoutesVisual() {
  return (
    <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-gradient-to-br from-primary/10 via-background to-emerald-50 dark:to-emerald-950/30 border border-border shadow-xl p-5">
      {/* Silueta de montañas de fondo */}
      <svg className="absolute bottom-0 left-0 w-full opacity-20" viewBox="0 0 400 120" preserveAspectRatio="none">
        <path d="M0,120 L50,60 L100,90 L160,30 L220,70 L280,20 L340,60 L400,40 L400,120 Z" fill="currentColor" className="text-primary" />
      </svg>

      {/* Card de ruta principal (destacada) */}
      <div className="relative bg-card rounded-xl shadow-xl border border-border overflow-hidden animate-slide-up-fade">
        <div className="relative h-16 bg-gradient-to-br from-emerald-400 via-primary to-teal-700 overflow-hidden">
          <div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"
            style={{ backgroundSize: '200% 100%' }}
          />
          <div className="absolute inset-0 flex items-center justify-between px-3">
            <div className="flex items-center gap-1.5">
              <Mountain className="h-4 w-4 text-white" />
              <span className="text-[11px] font-bold text-white">Camino Inca</span>
            </div>
            <span className="flex items-center gap-1 bg-white/25 backdrop-blur-sm px-2 py-0.5 rounded-full">
              <CheckCircle2 className="h-3 w-3 text-white" />
              <span className="text-[9px] font-bold text-white">Verificada</span>
            </span>
          </div>
        </div>

        <div className="p-3 space-y-2">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-2">
            <div className="animate-slide-up-fade" style={{ animationDelay: '0.4s', animationFillMode: 'both', opacity: 0 }}>
              <div className="flex items-center gap-1 text-[9px] text-muted-foreground mb-0.5">
                <Clock className="h-2.5 w-2.5" />
                <span>Duración</span>
              </div>
              <p className="text-[11px] font-bold text-foreground">4 días</p>
            </div>
            <div className="animate-slide-up-fade" style={{ animationDelay: '0.55s', animationFillMode: 'both', opacity: 0 }}>
              <div className="flex items-center gap-1 text-[9px] text-muted-foreground mb-0.5">
                <TrendingUp className="h-2.5 w-2.5" />
                <span>Elevación</span>
              </div>
              <p className="text-[11px] font-bold text-foreground">4,215 m</p>
            </div>
            <div className="animate-slide-up-fade" style={{ animationDelay: '0.7s', animationFillMode: 'both', opacity: 0 }}>
              <div className="flex items-center gap-1 text-[9px] text-muted-foreground mb-0.5">
                <Mountain className="h-2.5 w-2.5" />
                <span>Dificultad</span>
              </div>
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <span
                    key={i}
                    className={`w-1.5 h-3 rounded-sm origin-bottom animate-bar-grow ${i <= 4 ? 'bg-accent' : 'bg-muted'}`}
                    style={{ animationDelay: `${0.9 + i * 0.1}s` }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Checklist equipo */}
          <div className="pt-1.5 border-t border-border space-y-1">
            {['Casco y guantes', 'Bastones de trekking', 'Saco de dormir'].map((item, i) => (
              <div
                key={item}
                className="flex items-center gap-1.5 animate-slide-up-fade"
                style={{ animationDelay: `${1.2 + i * 0.15}s`, animationFillMode: 'both', opacity: 0 }}
              >
                <CheckCircle2 className="h-2.5 w-2.5 text-emerald-500 flex-shrink-0" />
                <span className="text-[9px] text-foreground">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Badges flotantes decorativas */}
      <div
        className="absolute top-4 right-4 bg-accent text-accent-foreground px-2.5 py-1 rounded-full shadow-lg animate-float"
        style={{ animationDelay: '1s' }}
      >
        <span className="text-[9px] font-bold">⭐ Top #1</span>
      </div>

      <div
        className="absolute bottom-4 right-4 bg-card border border-border px-2.5 py-1.5 rounded-lg shadow-lg animate-float-slow"
      >
        <p className="text-[9px] font-bold text-foreground">+150 rutas</p>
        <p className="text-[8px] text-muted-foreground">verificadas</p>
      </div>
    </div>
  );
}
