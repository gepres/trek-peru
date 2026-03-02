'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AttendeeWithUser } from '@/types/route.types';

interface ExportExcelButtonProps {
  attendees: AttendeeWithUser[];
  routeTitle: string;
}

// Etiquetas para los estados
const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  cancelled: 'Cancelado',
  waiting_list: 'Lista de Espera',
  completed: 'Completado',
};

const PAYMENT_LABELS: Record<string, string> = {
  unpaid: 'Sin Pago',
  pending_payment: 'Pago Pendiente',
  paid: 'Pagado',
};

const EXPERIENCE_LABELS: Record<string, string> = {
  beginner: 'Principiante',
  intermediate: 'Intermedio',
  advanced: 'Avanzado',
  expert: 'Experto',
};

// Botón que exporta la lista de asistentes a un archivo Excel (.xlsx)
export function ExportExcelButton({ attendees, routeTitle }: ExportExcelButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  async function handleExport() {
    try {
      setIsExporting(true);

      // Importar xlsx de forma dinámica para no aumentar el bundle inicial
      const XLSX = (await import('xlsx')).default;

      // Construir las filas del Excel
      const rows = attendees.map((a, index) => ({
        '#': index + 1,
        'Nombre': a.user.full_name || '',
        'Usuario': a.user.username ? `@${a.user.username}` : '',
        'Teléfono': a.user.phone || '',
        'Nivel': EXPERIENCE_LABELS[a.experience_level ?? ''] ?? '',
        'Estado': STATUS_LABELS[a.status] ?? a.status,
        'Pago': PAYMENT_LABELS[a.payment_status] ?? a.payment_status,
        'Contacto Emergencia': a.emergency_contact || '',
        'Alergias': a.allergies || '',
        'Condiciones Médicas': a.medical_conditions || '',
        'Notas': a.notes || '',
        'Mensaje Organizador': a.creator_message || '',
        'Fecha Inscripción': a.registration_date
          ? new Date(a.registration_date).toLocaleDateString('es-PE')
          : '',
        'Fecha Confirmación': a.confirmation_date
          ? new Date(a.confirmation_date).toLocaleDateString('es-PE')
          : '',
      }));

      // Crear libro de Excel
      const worksheet = XLSX.utils.json_to_sheet(rows);

      // Ajustar ancho de columnas automáticamente
      const colWidths = Object.keys(rows[0] ?? {}).map((key) => ({
        wch: Math.max(key.length, 15),
      }));
      worksheet['!cols'] = colWidths;

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Asistentes');

      // Nombre del archivo: ruta_asistentes_fecha.xlsx
      const safeTitle = routeTitle.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s]/g, '').slice(0, 40).trim();
      const dateStr = new Date().toISOString().slice(0, 10);
      const filename = `${safeTitle}_asistentes_${dateStr}.xlsx`;

      XLSX.writeFile(workbook, filename);
    } catch (err) {
      console.error('Error exportando Excel:', err);
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
      {isExporting ? 'Exportando...' : 'Exportar Excel'}
    </Button>
  );
}
