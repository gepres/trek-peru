'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
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
  const t = useTranslations('attendees.joinModal');
  const tExp = useTranslations('attendees.experience');
  const tc = useTranslations('common');
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
          toast({ title: t('alreadyRegistered'), description: t('alreadyRegisteredDesc'), variant: 'destructive' });
          return;
        }
        throw error;
      }

      toast({
        title: isFull ? '🕐 ' + t('addedToWaitlist') : '✅ ' + t('registrationDone'),
        description: isFull
          ? t('waitlistNotify')
          : t('requestSent'),
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
        description: err instanceof Error ? err.message : t('couldNotComplete'),
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
                {isFull ? t('joinWaitingList') : t('joinRoute')}
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                <span className="font-medium">{routeTitle}</span>
                {' — '}{t('completeData')}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
              {/* Contacto de emergencia — obligatorio */}
              <div className="space-y-1.5">
                <Label htmlFor="emergency_contact">
                  {t('emergencyContact')} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="emergency_contact"
                  placeholder={t('emergencyContactHint')}
                  {...register('emergency_contact')}
                  disabled={isSubmitting}
                />
                {errors.emergency_contact && (
                  <p className="text-xs text-red-600">{errors.emergency_contact.message}</p>
                )}
              </div>

              {/* Nivel de experiencia */}
              <div className="space-y-1.5">
                <Label>{t('experienceLevel')}</Label>
                <Select
                  onValueChange={(val) => setValue('experience_level', val as JoinRouteInput['experience_level'])}
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('selectLevel')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">{tExp('beginner')}</SelectItem>
                    <SelectItem value="intermediate">{tExp('intermediate')}</SelectItem>
                    <SelectItem value="advanced">{tExp('advanced')}</SelectItem>
                    <SelectItem value="expert">{tExp('expert')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Alergias */}
              <div className="space-y-1.5">
                <Label htmlFor="allergies">{t('allergiesOptional')}</Label>
                <Textarea
                  id="allergies"
                  placeholder={t('allergiesPlaceholder')}
                  rows={2}
                  {...register('allergies')}
                  disabled={isSubmitting}
                />
              </div>

              {/* Condiciones médicas */}
              <div className="space-y-1.5">
                <Label htmlFor="medical_conditions">{t('medicalOptional')}</Label>
                <Textarea
                  id="medical_conditions"
                  placeholder={t('medicalPlaceholder')}
                  rows={2}
                  {...register('medical_conditions')}
                  disabled={isSubmitting}
                />
              </div>

              {/* Mensaje para el organizador */}
              <div className="space-y-1.5">
                <Label htmlFor="notes">{t('notesOptional')}</Label>
                <Textarea
                  id="notes"
                  placeholder={t('notesPlaceholder')}
                  rows={2}
                  {...register('notes')}
                  disabled={isSubmitting}
                />
                <p className="text-xs text-muted-foreground">
                  {watch('notes')?.length ?? 0}/300 {t('characters')}
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={handleClose} disabled={isSubmitting}>
                  {tc('cancel')}
                </Button>
                <Button type="submit" className="flex-1" disabled={isSubmitting}>
                  {isSubmitting ? t('sending') : t('confirm')}
                </Button>
              </div>
            </form>
          </>
        ) : (
          /* ── Paso 2: Notificar al creador por WhatsApp ── */
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
                ✅ {t('successTitle')}
              </DialogTitle>
              <DialogDescription>
                {waLink
                  ? t('notifyWhatsapp')
                  : t('requestSentPanel')}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 mt-2">
              <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                <p className="text-sm text-green-800 dark:text-green-300">
                  {t('pendingConfirmation')}
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
                      {t('openWhatsapp')}
                    </Button>
                  </a>
                ) : (
                  /* El creador no tiene teléfono registrado */
                  <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 flex items-start gap-2">
                    <Phone className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                      {t('noWhatsapp')}
                    </p>
                  </div>
                )}
                <Button variant="outline" className="w-full" onClick={handleWaClick}>
                  {waLink ? t('skipNotify') : tc('close')}
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
