'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { AttendeeWithUser } from '@/types/route.types';

interface ExportExcelButtonProps {
  attendees: AttendeeWithUser[];
  routeTitle: string;
}

// Botón que exporta la lista de asistentes a un archivo Excel (.xlsx)
export function ExportExcelButton({ attendees, routeTitle }: ExportExcelButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const t = useTranslations('excel');
  const tStatus = useTranslations('attendees.status');
  const tPayment = useTranslations('attendees.payment');
  const tExp = useTranslations('attendees.experience');
  const tDash = useTranslations('attendees.dashboard');

  async function handleExport() {
    try {
      setIsExporting(true);

      // Importar xlsx dinámicamente — compatible con CJS en Next.js/webpack
      const XLSXModule = await import('xlsx');
      const XLSX = XLSXModule.default ?? XLSXModule;

      // Etiquetas traducidas
      const STATUS_LABELS: Record<string, string> = {
        pending: tStatus('pending'), confirmed: tStatus('confirmed'),
        cancelled: tStatus('cancelled'), waiting_list: tStatus('waiting_list'),
        completed: tStatus('completed'),
      };
      const ATTENDANCE_LABELS: Record<string, string> = {
        attended: t('attended'), absent: t('absent'),
      };
      const PAYMENT_LABELS: Record<string, string> = {
        unpaid: tPayment('unpaid'), pending_payment: tPayment('pending_payment'),
        paid: tPayment('paid'),
      };
      const EXPERIENCE_LABELS: Record<string, string> = {
        beginner: tExp('beginner'), intermediate: tExp('intermediate'),
        advanced: tExp('advanced'), expert: tExp('expert'),
      };

      // Construir las filas del Excel
      const rows = attendees.map((a, index) => ({
        '#': index + 1,
        [t('name')]: a.user.full_name || '',
        [t('user')]: a.user.username ? `@${a.user.username}` : '',
        [t('phone')]: a.user.phone || '',
        [t('level')]: EXPERIENCE_LABELS[a.experience_level ?? ''] ?? '',
        [t('status')]: STATUS_LABELS[a.status] ?? a.status,
        [t('payment')]: PAYMENT_LABELS[a.payment_status] ?? a.payment_status,
        [t('emergencyContact')]: a.emergency_contact || '',
        [t('allergies')]: a.allergies || '',
        [t('medicalConditions')]: a.medical_conditions || '',
        [t('notes')]: a.notes || '',
        [t('organizerMessage')]: a.creator_message || '',
        [t('registrationDate')]: a.registration_date
          ? new Date(a.registration_date).toLocaleDateString('es-PE')
          : '',
        [t('confirmationDate')]: a.confirmation_date
          ? new Date(a.confirmation_date).toLocaleDateString('es-PE')
          : '',
        'Asistencia': a.attendance_status
          ? ATTENDANCE_LABELS[a.attendance_status] ?? a.attendance_status
          : t('notRecorded'),
        [t('attendanceDate')]: a.attendance_recorded_at
          ? new Date(a.attendance_recorded_at).toLocaleDateString('es-PE')
          : '',
      }));

      // Crear hoja y libro de Excel
      const worksheet = XLSX.utils.json_to_sheet(rows);

      // Ajustar ancho de columnas automáticamente
      const colWidths = Object.keys(rows[0] ?? {}).map((key) => ({
        wch: Math.max(key.length, 15),
      }));
      worksheet['!cols'] = colWidths;

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Asistentes');

      // Nombre del archivo: ruta_asistentes_fecha.xlsx
      const safeTitle = routeTitle
        .replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s]/g, '')
        .slice(0, 40)
        .trim();
      const dateStr = new Date().toISOString().slice(0, 10);
      const filename = `${safeTitle}_asistentes_${dateStr}.xlsx`;

      // Usar Blob + anchor para descarga — más confiable en Next.js (evita fs de Node.js)
      const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = filename;
      anchor.click();
      URL.revokeObjectURL(url);

      toast({
        title: '✅ ' + t('exported'),
        description: t('exportedDesc', { count: attendees.length }),
      });
    } catch (err) {
      console.error('Error exportando Excel:', err);
      toast({
        title: t('exportError'),
        description: t('exportErrorDesc'),
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={isExporting || attendees.length === 0}
      className="gap-2"
    >
      <Download className="h-4 w-4" />
      {isExporting ? tDash('exporting') : tDash('export')}
    </Button>
  );
}
