'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { MessageCircle, Phone, UserPlus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { createClient } from '@/lib/supabase/client';
import { joinRouteSchema, type JoinRouteInput } from '@/lib/validations/user.schema';
import { buildWaLink, buildInscriptionMessage } from '@/lib/utils/whatsapp';

interface JoinRouteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  routeId: string;
  routeTitle: string;
  routeDate?: string;
  isFull: boolean;
  currentUserId: string;
  currentUserName: string;
  currentUserPhone?: string;
  creatorPhone?: string;
  onSuccess: () => void;
}

// Modal de inscripción detallada a una ruta
export function JoinRouteModal({
  open,
  onOpenChange,
  routeId,
  routeTitle,
  routeDate,
  isFull,
  currentUserId,
  currentUserName,
  currentUserPhone,
  creatorPhone,
  onSuccess,
}: JoinRouteModalProps) {
  const supabase = createClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Controla si la inscripción fue exitosa (muestra el paso 2)
  const [inscriptionDone, setInscriptionDone] = useState(false);
  // Enlace WhatsApp — solo se genera si el creador tiene teléfono
  const [waLink, setWaLink] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<JoinRouteInput>({
    resolver: zodResolver(joinRouteSchema),
  });

  async function onSubmit(data: JoinRouteInput) {
    try {
      setIsSubmitting(true);

      // Determinar estado inicial según capacidad
      const initialStatus = isFull ? 'waiting_list' : 'pending';

      const { error } = await supabase.from('attendees').insert({
        route_id: routeId,
        user_id: currentUserId,
        status: initialStatus,
        registration_date: new Date().toISOString(),
        emergency_contact: data.emergency_contact,
        experience_level: data.experience_level ?? null,
        allergies: data.allergies ?? null,
        medical_conditions: data.medical_conditions ?? null,
        notes: data.notes ?? null,
        payment_status: 'unpaid',
      });

      if (error) {
        if (error.code === '23505') {
          toast({ title: 'Ya estás inscrito', description: 'Ya te has inscrito a esta ruta.', variant: 'destructive' });
          return;
        }
        throw error;
      }

      toast({
        title: isFull ? '🕐 Agregado a lista de espera' : '✅ Inscripción registrada',
        description: isFull
          ? 'El organizador te notificará si hay un lugar disponible.'
          : 'Tu solicitud ha sido enviada. El organizador la revisará pronto.',
      });

      // Generar enlace wa.me si el creador tiene teléfono registrado
      if (creatorPhone) {
        const msg = buildInscriptionMessage({
          userName: currentUserName,
          routeTitle,
          routeDate,
          userPhone: currentUserPhone ?? 'no registrado',
        });
        setWaLink(buildWaLink(creatorPhone, msg));
      }
      // Siempre mostrar el paso 2 (con o sin teléfono del creador)
      setInscriptionDone(true);
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'No se pudo completar la inscripción',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleClose() {
    reset();
    setWaLink(null);
    setInscriptionDone(false);
    onOpenChange(false);
  }

  function handleWaClick() {
    onSuccess();
    handleClose();
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        {/* ── Paso 1: Formulario ── */}
        {!inscriptionDone ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                {isFull ? 'Unirme a Lista de Espera' : 'Inscribirse a la Ruta'}
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                <span className="font-medium">{routeTitle}</span>
                {' — '}Completa los datos para tu inscripción
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
              {/* Contacto de emergencia — obligatorio */}
              <div className="space-y-1.5">
                <Label htmlFor="emergency_contact">
                  Contacto de emergencia <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="emergency_contact"
                  placeholder="Nombre y teléfono de un familiar"
                  {...register('emergency_contact')}
                  disabled={isSubmitting}
                />
                {errors.emergency_contact && (
                  <p className="text-xs text-red-600">{errors.emergency_contact.message}</p>
                )}
              </div>

              {/* Nivel de experiencia */}
              <div className="space-y-1.5">
                <Label>Nivel de experiencia en trekking</Label>
                <Select
                  onValueChange={(val) => setValue('experience_level', val as JoinRouteInput['experience_level'])}
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona tu nivel" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Principiante</SelectItem>
                    <SelectItem value="intermediate">Intermedio</SelectItem>
                    <SelectItem value="advanced">Avanzado</SelectItem>
                    <SelectItem value="expert">Experto</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Alergias */}
              <div className="space-y-1.5">
                <Label htmlFor="allergies">Alergias (opcional)</Label>
                <Textarea
                  id="allergies"
                  placeholder="Ej: Penicilina, picaduras de abeja..."
                  rows={2}
                  {...register('allergies')}
                  disabled={isSubmitting}
                />
              </div>

              {/* Condiciones médicas */}
              <div className="space-y-1.5">
                <Label htmlFor="medical_conditions">Condiciones médicas (opcional)</Label>
                <Textarea
                  id="medical_conditions"
                  placeholder="Ej: Asma leve, hipertensión controlada..."
                  rows={2}
                  {...register('medical_conditions')}
                  disabled={isSubmitting}
                />
              </div>

              {/* Mensaje para el organizador */}
              <div className="space-y-1.5">
                <Label htmlFor="notes">Mensaje para el organizador (opcional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Preguntas, comentarios o información adicional..."
                  rows={2}
                  {...register('notes')}
                  disabled={isSubmitting}
                />
                <p className="text-xs text-muted-foreground">
                  {watch('notes')?.length ?? 0}/300 caracteres
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={handleClose} disabled={isSubmitting}>
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1" disabled={isSubmitting}>
                  {isSubmitting ? 'Enviando...' : 'Confirmar Inscripción'}
                </Button>
              </div>
            </form>
          </>
        ) : (
          /* ── Paso 2: Notificar al creador por WhatsApp ── */
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
                ✅ ¡Inscripción registrada!
              </DialogTitle>
              <DialogDescription>
                {waLink
                  ? 'Notifica al organizador por WhatsApp para que procese tu solicitud más rápido.'
                  : 'Tu solicitud ha sido enviada. El organizador la revisará en su panel.'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 mt-2">
              <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                <p className="text-sm text-green-800 dark:text-green-300">
                  Tu inscripción está <strong>pendiente de confirmación</strong>. El organizador
                  revisará tu solicitud y te notificará cuando sea aprobada.
                </p>
              </div>

              <div className="flex flex-col gap-3">
                {waLink ? (
                  /* El creador tiene teléfono → mostrar botón WhatsApp */
                  <a
                    href={waLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={handleWaClick}
                  >
                    <Button className="w-full bg-[#25D366] hover:bg-[#1ebe5d] text-white gap-2">
                      <MessageCircle className="h-4 w-4" />
                      Abrir WhatsApp y notificar al organizador
                    </Button>
                  </a>
                ) : (
                  /* El creador no tiene teléfono registrado */
                  <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 flex items-start gap-2">
                    <Phone className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                      El organizador no tiene número de WhatsApp registrado.
                      Recibirá tu solicitud en su panel de gestión.
                    </p>
                  </div>
                )}
                <Button variant="outline" className="w-full" onClick={handleWaClick}>
                  {waLink ? 'Omitir por ahora' : 'Cerrar'}
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
