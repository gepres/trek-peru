// Visual animado para la feature "Mapas Interactivos"
// Muestra una ruta SVG dibujándose con waypoints pulsantes y un mini chart de elevación
export function InteractiveMapsVisual() {
  return (
    <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-gradient-to-br from-emerald-50 to-sky-50 dark:from-emerald-950/40 dark:to-sky-950/40 border border-border shadow-xl">
      {/* Grid sutil estilo mapa */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(6,76,57,0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(6,76,57,0.1) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      {/* Curvas de nivel decorativas */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 300" preserveAspectRatio="none">
        <defs>
          <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#064c39" />
          </linearGradient>
        </defs>

        {/* Contorno de montañas (silueta) */}
        <path
          d="M0,240 L50,180 L100,210 L160,140 L220,190 L280,120 L340,170 L400,150 L400,300 L0,300 Z"
          fill="rgba(6,76,57,0.08)"
        />
        <path
          d="M0,270 L60,230 L130,250 L200,200 L260,240 L330,210 L400,230 L400,300 L0,300 Z"
          fill="rgba(6,76,57,0.06)"
        />

        {/* Ruta que se dibuja */}
        <path
          d="M40,220 Q100,180 140,170 T220,140 T300,90 T360,70"
          fill="none"
          stroke="url(#routeGradient)"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray="1000"
          className="animate-draw-line"
        />
      </svg>

      {/* Waypoints con pulse */}
      {[
        { x: '10%', y: '73%', delay: '0s', label: 'Inicio' },
        { x: '35%', y: '57%', delay: '0.7s', label: 'Mirador' },
        { x: '55%', y: '47%', delay: '1.4s' },
        { x: '75%', y: '30%', delay: '2s' },
        { x: '90%', y: '23%', delay: '2.5s', label: 'Cumbre' },
      ].map((wp, i) => (
        <div
          key={i}
          className="absolute -translate-x-1/2 -translate-y-1/2"
          style={{ left: wp.x, top: wp.y, animationDelay: wp.delay }}
        >
          <span className="absolute inset-0 -m-1 rounded-full bg-accent/50 animate-pulse-ring" style={{ animationDelay: wp.delay }} />
          <span className="relative block w-3 h-3 rounded-full bg-accent border-2 border-white shadow-md" />
          {wp.label && (
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-semibold px-1.5 py-0.5 bg-white dark:bg-card rounded-md shadow-sm text-foreground whitespace-nowrap">
              {wp.label}
            </span>
          )}
        </div>
      ))}

      {/* Panel elevación flotante */}
      <div className="absolute bottom-3 right-3 bg-white/95 dark:bg-card/95 backdrop-blur-sm rounded-lg shadow-lg p-3 border border-border animate-float w-36">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-bold text-foreground">Elevación</span>
          <span className="text-[10px] text-accent font-bold">4,215 m</span>
        </div>
        <div className="flex items-end gap-0.5 h-10">
          {[30, 45, 40, 60, 55, 75, 70, 90, 85, 100].map((h, i) => (
            <div
              key={i}
              className="flex-1 bg-gradient-to-t from-primary to-accent rounded-sm origin-bottom animate-bar-grow"
              style={{ height: `${h}%`, animationDelay: `${i * 0.08 + 1.5}s` }}
            />
          ))}
        </div>
      </div>

      {/* Badge superior */}
      <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-white/95 dark:bg-card/95 backdrop-blur-sm px-2.5 py-1.5 rounded-lg shadow-md border border-border animate-slide-up-fade">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-[10px] font-bold text-foreground">Ruta en vivo</span>
      </div>
    </div>
  );
}
