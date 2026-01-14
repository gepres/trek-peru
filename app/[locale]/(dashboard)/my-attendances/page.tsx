import { MyAttendancesList } from '@/components/routes/MyAttendancesList';

// Página de mis asistencias a rutas
export default async function MyAttendancesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Mis Asistencias
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Rutas en las que estás participando
        </p>
      </div>

      <MyAttendancesList locale={locale} />
    </div>
  );
}
