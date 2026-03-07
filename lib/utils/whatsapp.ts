// Utilidades para generar enlaces de WhatsApp (wa.me)
// No requiere API — el usuario hace clic y envía manualmente

/** Limpia un número de teléfono y genera el link base de wa.me */
export function buildWaLink(phone: string, message: string): string {
  // Quitar todo lo que no sea dígito o el signo +
  const cleaned = phone.replace(/[^\d+]/g, '');
  // Quitar el + inicial si existe (wa.me acepta sin +)
  const digits = cleaned.startsWith('+') ? cleaned.slice(1) : cleaned;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

/** Mensaje que se envía al creador cuando un usuario solicita inscripción */
export function buildInscriptionMessage(params: {
  userName: string;
  routeTitle: string;
  routeDate?: string;
  userPhone: string;
}): string {
  const { userName, routeTitle, routeDate, userPhone } = params;
  const dateStr = routeDate
    ? new Date(routeDate).toLocaleDateString('es-PE', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : 'fecha por confirmar';

  return (
    `Hola, soy *${userName}* y me acabo de inscribir a tu ruta:\n\n` +
    `🏔️ *${routeTitle}*\n` +
    `📅 Fecha: ${dateStr}\n` +
    `📱 Mi teléfono: ${userPhone}\n\n` +
    `Quedo atento a tu confirmación. ¡Gracias!`
  );
}

/** Mensaje que el asistente confirmado envía al creador para pedir reactivación tras cancelar */
export function buildReinstatementMessage(params: {
  userName: string;
  routeTitle: string;
  routeDate?: string;
}): string {
  const { userName, routeTitle, routeDate } = params;
  const dateStr = routeDate
    ? new Date(routeDate).toLocaleDateString('es-PE', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : 'fecha por confirmar';

  return (
    `Hola, soy *${userName}*. Anteriormente cancelé mi inscripción a tu ruta:\n\n` +
    `🏔️ *${routeTitle}*\n` +
    `📅 Fecha: ${dateStr}\n\n` +
    `¿Sería posible reactivar mi inscripción? ¡Gracias!`
  );
}

/** Mensaje que el creador envía al asistente al confirmar su inscripción */
export function buildApprovalMessage(params: {
  attendeeName: string;
  routeTitle: string;
  routeDate?: string;
  meetingPoint?: string;
  meetingTime?: string;
  creatorMessage?: string;
}): string {
  const { attendeeName, routeTitle, routeDate, meetingPoint, meetingTime, creatorMessage } = params;
  const dateStr = routeDate
    ? new Date(routeDate).toLocaleDateString('es-PE', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : 'fecha por confirmar';

  let msg =
    `Hola *${attendeeName}* 🎉\n\n` +
    `Tu inscripción a la ruta *${routeTitle}* ha sido *confirmada*.\n\n` +
    `📅 Fecha: ${dateStr}\n`;

  if (meetingTime) msg += `⏰ Hora de encuentro: ${meetingTime}\n`;
  if (meetingPoint) msg += `📍 Punto de encuentro: ${meetingPoint}\n`;
  if (creatorMessage) msg += `\n💬 Mensaje del organizador:\n${creatorMessage}\n`;

  msg += `\n¡Te esperamos! 🥾`;
  return msg;
}
