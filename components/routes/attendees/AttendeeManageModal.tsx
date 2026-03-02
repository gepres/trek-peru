'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { MessageCircle, Phone, User, AlertCircle, Heart, FileText, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AttendeeWithUser } from '@/types/route.types';
import { attendeeUpdateSchema, type AttendeeUpdateInput } from '@/lib/validations/user.schema';
import { buildWaLink, buildApprovalMessage } from '@/lib/utils/whatsapp';

interface AttendeeManageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  attendee: AttendeeWithUser | null;
  routeTitle: string;
  routeDate?: string;
  meetingPoint?: string;
  meetingTime?: string;
  requesterId: string;
  routeCreatorId: string;
  onSave: (attendeeId: string, data: AttendeeUpdateInput) => Promise<void>;
}

// Etiquetas legibles para los estados
const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmar',
  cancelled: 'Rechazar',
  waiting_list: 'Lista de espera',
};

const PAYMENT_LABELS: Record<string, string> = {
  unpaid: 'Sin pago',
  pending_payment: 'Pago pendiente',
  paid: 'Pagado',
};

const EXPERIENCE_LABELS: Record<string, string> = {
  beginner: 'Principiante',
  intermediate: 'Intermedio',
  advanced: 'Avanzado',
  expert: 'Experto',
};

// Modal para que el creador gestione un asistente (aprobar, rechazar, pago, mensaje)
export function AttendeeManageModal({
  open,
  onOpenChange,
  attendee,
  routeTitle,
  routeDate,
  meetingPoint,
  meetingTime,
  requesterId,
  routeCreatorId,
  onSave,
}: AttendeeManageModalProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [savedStatus, setSavedStatus] = useState<string | null>(null);
  const [creatorMsg, setCreatorMsg] = useState('');

  const {
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<AttendeeUpdateInput>({
    resolver: zodResolver(attendeeUpdateSchema),
    defaultValues: {
      status: 'pending',
      payment_status: 'unpaid',
      creator_message: '',
    },
  });

  // Sincronizar valores cuando cambia el asistente seleccionado
  useEffect(() => {
    if (attendee) {
      setValue('status', attendee.status as AttendeeUpdateInput['status']);
      setValue('payment_status', attendee.payment_status as AttendeeUpdateInput['payment_status']);
      const msg = attendee.creator_message ?? '';
      setValue('creator_message', msg);
      setCreatorMsg(msg);
      setSavedStatus(null);
    }
  }, [attendee, setValue]);

  const watchedStatus = watch('status');
  const watchedPayment = watch('payment_status');

  async function onSubmit(data: AttendeeUpdateInput) {
    if (!attendee) return;
    try {
      setIsSaving(true);
      await onSave(attendee.id, data);
      setSavedStatus(data.status);
    } finally {
      setIsSaving(false);
    }
  }

  function buildWaApprovalLink(): string | null {
    const phone = attendee?.user?.phone;
    if (!phone) return null;
    const msg = buildApprovalMessage({
      attendeeName: attendee?.user?.full_name || attendee?.user?.username || 'Asistente',
      routeTitle,
      routeDate,
      meetingPoint,
      meetingTime,
      creatorMessage: creatorMsg || undefined,
    });
    return buildWaLink(phone, msg);
  }

  function handleClose() {
    reset();
    setSavedStatus(null);
    onOpenChange(false);
  }

  if (!attendee) return null;

  const waLink = buildWaApprovalLink();

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gestionar Asistente</DialogTitle>
        </DialogHeader>

        {/* ── Info del asistente ── */}
        <div className="rounded-lg border p-4 space-y-3 bg-muted/30">
          <div className="flex items-center gap-2 font-semibold">
            <User className="h-4 w-4 text-muted-foreground" />
            <span>{attendee.user.full_name || attendee.user.username}</span>
            {attendee.user.username && (
              <span className="text-sm text-muted-foreground font-normal">@{attendee.user.username}</span>
            )}
          </div>

          {attendee.user.phone && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="h-4 w-4" />
              <span>{attendee.user.phone}</span>
            </div>
          )}

          {attendee.experience_level && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Award className="h-4 w-4" />
              <span>{EXPERIENCE_LABELS[attendee.experience_level] ?? attendee.experience_level}</span>
            </div>
          )}

          {attendee.emergency_contact && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <AlertCircle className="h-4 w-4" />
              <span><strong>Emergencia:</strong> {attendee.emergency_contact}</span>
            </div>
          )}

          {attendee.allergies && (
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <Heart className="h-4 w-4 mt-0.5" />
              <span><strong>Alergias:</strong> {attendee.allergies}</span>
            </div>
          )}

          {attendee.medical_conditions && (
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <Heart className="h-4 w-4 mt-0.5" />
              <span><strong>Condiciones:</strong> {attendee.medical_conditions}</span>
            </div>
          )}

          {attendee.notes && (
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <FileText className="h-4 w-4 mt-0.5" />
              <span><em>&quot;{attendee.notes}&quot;</em></span>
            </div>
          )}
        </div>

        {/* ── Formulario del creador ── */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Estado de inscripción */}
          <div className="space-y-1.5">
            <Label>Decisión</Label>
            <Select
              value={watchedStatus}
              onValueChange={(val) => setValue('status', val as AttendeeUpdateInput['status'])}
              disabled={isSaving}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">⏳ Pendiente</SelectItem>
                <SelectItem value="confirmed">✅ Confirmar</SelectItem>
                <SelectItem value="cancelled">❌ Rechazar</SelectItem>
                <SelectItem value="waiting_list">🕐 Lista de espera</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Estado de pago */}
          <div className="space-y-1.5">
            <Label>Estado de pago</Label>
            <Select
              value={watchedPayment}
              onValueChange={(val) => setValue('payment_status', val as AttendeeUpdateInput['payment_status'])}
              disabled={isSaving}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar estado de pago" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unpaid">💸 Sin pago</SelectItem>
                <SelectItem value="pending_payment">⏳ Pago pendiente</SelectItem>
                <SelectItem value="paid">✅ Pagado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Mensaje personalizado */}
          <div className="space-y-1.5">
            <Label htmlFor="creator_message">Mensaje personalizado (opcional)</Label>
            <Textarea
              id="creator_message"
              placeholder="Ej: Recuerda traer bastones y crema solar. Nos vemos en el paradero..."
              rows={3}
              value={creatorMsg}
              onChange={(e) => {
                setCreatorMsg(e.target.value);
                setValue('creator_message', e.target.value);
              }}
              disabled={isSaving}
            />
            <p className="text-xs text-muted-foreground">{creatorMsg.length}/300 caracteres</p>
          </div>

          {/* Botón guardar */}
          <div className="flex gap-3">
            <Button type="button" variant="outline" className="flex-1" onClick={handleClose} disabled={isSaving}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={isSaving}>
              {isSaving ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </div>
        </form>

        {/* ── Botón WhatsApp (aparece tras guardar con status=confirmed) ── */}
        {savedStatus === 'confirmed' && waLink && (
          <div className="mt-2 p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 space-y-3">
            <p className="text-sm text-green-800 dark:text-green-300 font-medium">
              ✅ Asistente confirmado. ¿Deseas notificarle por WhatsApp?
            </p>
            <a href={waLink} target="_blank" rel="noopener noreferrer">
              <Button className="w-full bg-[#25D366] hover:bg-[#1ebe5d] text-white gap-2">
                <MessageCircle className="h-4 w-4" />
                Enviar Confirmación por WhatsApp
              </Button>
            </a>
          </div>
        )}

        {savedStatus === 'cancelled' && (
          <div className="mt-2 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-800 dark:text-red-300 font-medium">
              ❌ Inscripción rechazada y guardada.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
