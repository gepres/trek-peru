import { Users, MessageCircle } from 'lucide-react';

// Visual animado para "Comunidad Activa"
// Avatares orbitando alrededor del logo central + burbujas de chat
export function CommunityVisual() {
  const avatars = [
    { bg: 'from-orange-400 to-red-500', initials: 'LM', delay: '0s' },
    { bg: 'from-emerald-400 to-teal-600', initials: 'CR', delay: '1s' },
    { bg: 'from-sky-400 to-blue-600', initials: 'JP', delay: '2s' },
    { bg: 'from-fuchsia-400 to-pink-600', initials: 'AV', delay: '3s' },
    { bg: 'from-amber-400 to-yellow-600', initials: 'DS', delay: '4s' },
  ];

  return (
    <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-gradient-to-br from-primary/5 via-background to-accent/10 border border-border shadow-xl flex items-center justify-center">
      {/* Círculos concéntricos decorativos */}
      <div className="absolute inset-0 flex items-center justify-center">
        {[240, 180, 120].map((size, i) => (
          <span
            key={i}
            className="absolute rounded-full border border-dashed border-primary/20"
            style={{ width: size, height: size }}
          />
        ))}
      </div>

      {/* Centro: logo/icono */}
      <div className="relative z-10 flex flex-col items-center gap-2">
        <div className="relative">
          <span className="absolute inset-0 rounded-full bg-accent/30 animate-pulse-ring" />
          <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary/70 shadow-xl flex items-center justify-center border-4 border-background">
            <Users className="h-9 w-9 text-white" />
          </div>
        </div>
        <div className="bg-background/90 backdrop-blur-sm px-3 py-1 rounded-full border border-border shadow-sm">
          <span className="text-xs font-bold text-primary">+1,240 trekkers</span>
        </div>
      </div>

      {/* Avatares orbitando */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="relative w-0 h-0">
          {avatars.map((av, i) => {
            const radius = i % 2 === 0 ? 110 : 90;
            const baseAngle = (i * 360) / avatars.length;
            return (
              <div
                key={i}
                className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2"
                style={{
                  transform: `rotate(${baseAngle}deg) translateX(${radius}px) rotate(-${baseAngle}deg)`,
                }}
              >
                <div
                  className="animate-float-slow"
                  style={{ animationDelay: av.delay }}
                >
                  <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${av.bg} text-white font-bold text-sm flex items-center justify-center shadow-lg border-2 border-background`}>
                    {av.initials}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Burbujas de chat */}
      <div className="absolute top-6 right-6 bg-white dark:bg-card rounded-2xl rounded-tr-sm shadow-lg px-3 py-2 border border-border animate-slide-up-fade max-w-[160px]">
        <div className="flex items-start gap-1.5">
          <MessageCircle className="h-3 w-3 text-accent mt-0.5 flex-shrink-0" />
          <p className="text-[10px] leading-tight font-medium text-foreground">
            ¿Alguien va el sábado a Huayna Picchu?
          </p>
        </div>
      </div>

      <div
        className="absolute bottom-6 left-6 bg-primary text-primary-foreground rounded-2xl rounded-bl-sm shadow-lg px-3 py-2 animate-slide-up-fade max-w-[160px]"
        style={{ animationDelay: '0.6s', animationFillMode: 'both', opacity: 0 }}
      >
        <p className="text-[10px] leading-tight font-medium">
          ¡Yo me apunto! Llevaré el GPS 🙌
        </p>
      </div>
    </div>
  );
}
