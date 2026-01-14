'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { routeFormSchema, type RouteFormInput } from '@/lib/validations/route.schema';
import { Route } from '@/types/route.types';
import { MeetingPoint, Waypoint } from '@/types/database.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Steps, Step } from '@/components/ui/steps';
import { RouteMapEditor } from '@/components/maps/RouteMapEditor';
import { ImageUpload } from '@/components/shared/ImageUpload';
import { ImageGallery } from '@/components/shared/ImageGallery';
import { EquipmentList } from './EquipmentList';
import { DailyItinerary, type DayItinerary } from './DailyItinerary';
import { Loader2, ChevronLeft, ChevronRight, Check, Link as LinkIcon, Calendar, Clock } from 'lucide-react';
import { StepBasicInfo } from './form-steps/StepBasicInfo';
import { StepLogistics } from './form-steps/StepLogistics';
import { StepPublication } from './form-steps/StepPublication';
import { StepTechnicalDetails } from './form-steps/StepTechnicalDetails';
import { StepMap } from './form-steps/StepMap';
import { StepImages } from './form-steps/StepImages';

interface RouteFormStepsProps {
  route?: Route;
  locale: string;
}

const steps: Step[] = [
  { id: '1', title: 'Información Básica', description: 'Datos esenciales' },
  { id: '2', title: 'Logística', description: 'Fechas y capacidad' },
  { id: '3', title: 'Publicación', description: 'Estado y visibilidad' },
  { id: '4', title: 'Detalles Técnicos', description: 'Opcional' },
  { id: '5', title: 'Mapa', description: 'Ruta y ubicación' },
  { id: '6', title: 'Imágenes', description: 'Fotos de la ruta' },
];

export function RouteFormSteps({ route, locale }: RouteFormStepsProps) {
  const t = useTranslations('routes');
  const router = useRouter();
  const supabase = createClient();

  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estados del mapa
  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>(
    route?.route_coordinates?.coordinates || []
  );
  const [meetingPoint, setMeetingPoint] = useState<MeetingPoint | null>(
    route?.meeting_point || null
  );
  const [waypoints, setWaypoints] = useState<Waypoint[]>(
    route?.waypoints || []
  );

  // Estados de imágenes
  const [featuredImage, setFeaturedImage] = useState<string | undefined>(
    route?.featured_image
  );
  const [images, setImages] = useState<string[]>(
    route?.images || []
  );

  // Estados de equipo e itinerario
  const [equipment, setEquipment] = useState<string[]>(
    route?.required_equipment || []
  );
  const [dailyItinerary, setDailyItinerary] = useState<DayItinerary[]>(
    route?.daily_itinerary || []
  );

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    trigger,
    formState: { errors },
  } = useForm<RouteFormInput>({
    resolver: zodResolver(routeFormSchema),
    mode: 'onChange',
    defaultValues: route ? {
      title: route.title,
      description: route.description || '',
      difficulty: route.difficulty,
      region: route.region || '',
      province: route.province || '',
      duration_type: route.duration_type || 'hours',
      duration_value: route.duration_value || route.estimated_duration || 1,
      daily_itinerary: route.daily_itinerary || undefined,
      departure_date: route.departure_date || '',
      meeting_time: route.meeting_time || '',
      max_capacity: route.max_capacity || undefined,
      cost: route.cost || undefined,
      currency: route.currency || 'PEN',
      status: route.status || 'draft',
      visibility: route.visibility || 'public',
      distance: route.distance || undefined,
      elevation_gain: route.elevation_gain || undefined,
      elevation_loss: route.elevation_loss || undefined,
      min_altitude: route.min_altitude || undefined,
      max_altitude: route.max_altitude || undefined,
      google_maps_link: route.google_maps_link || '',
      essential_equipment: [],
      emergency_contact: route.emergency_contact || '',
      // Condiciones y servicios
      water_available: route.water_available || false,
      shelters: route.shelters || false,
      mobile_signal: route.mobile_signal || false,
      expected_weather: route.expected_weather || '',
      terrain_type: route.terrain_type || [],
      technical_level: route.technical_level || '',
    } : {
      difficulty: 'moderate',
      currency: 'PEN',
      status: 'draft',
      visibility: 'public',
      duration_type: 'hours',
      duration_value: 1,
      essential_equipment: [],
      water_available: false,
      shelters: false,
      mobile_signal: false,
      terrain_type: [],
    },
  });

  const durationType = watch('duration_type');
  const durationValue = watch('duration_value');

  // Manejar cambio de tipo de duración
  const handleDurationTypeChange = (type: 'hours' | 'days') => {
    setValue('duration_type', type);
    if (type === 'days' && durationValue > 1) {
      // Inicializar itinerario
      const itinerary: DayItinerary[] = Array.from({ length: durationValue }, (_, i) => ({
        day: i + 1,
        title: `Día ${i + 1}`,
        description: '',
      }));
      setDailyItinerary(itinerary);
    }
  };

  // Navegación entre pasos
  const goToNextStep = async () => {
    const fieldsToValidate = getFieldsForStep(currentStep);
    const isValid = await trigger(fieldsToValidate);

    if (isValid) {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const goToPrevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goToStep = (stepIndex: number) => {
    setCurrentStep(stepIndex);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Definir campos a validar por paso
  function getFieldsForStep(step: number): (keyof RouteFormInput)[] {
    switch (step) {
      case 0: // Información Básica
        return ['title', 'description', 'difficulty', 'region', 'duration_type', 'duration_value'];
      case 1: // Logística
        return ['departure_date', 'meeting_time', 'max_capacity', 'cost'];
      case 2: // Publicación
        return ['status', 'visibility'];
      case 3: // Detalles Técnicos (todos opcionales)
        return [];
      case 4: // Mapa
        return [];
      case 5: // Imágenes
        return [];
      default:
        return [];
    }
  }

  // Generar slug a partir del título
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
      .replace(/[^a-z0-9\s-]/g, '') // Eliminar caracteres especiales
      .trim()
      .replace(/\s+/g, '-') // Reemplazar espacios con guiones
      .replace(/-+/g, '-') // Eliminar guiones duplicados
      .substring(0, 100); // Limitar longitud
  };

  // Manejar envío del formulario
  async function onSubmit(data: RouteFormInput) {
    console.log('onSubmit llamado con datos:', data);
    console.log('Errores del formulario:', errors);

    try {
      setIsLoading(true);
      setError(null);

      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        setError('Debes iniciar sesión para crear una ruta');
        return;
      }

      // Preparar datos - eliminar solo essential_equipment que no está en la DB
      const { essential_equipment, ...restData } = data;

      // Generar slug único
      const baseSlug = generateSlug(data.title);
      const timestamp = Date.now();
      const slug = `${baseSlug}-${timestamp}`;

      // Preparar datos para la base de datos
      const routeData = {
        ...restData,
        slug,
        creator_id: userData.user.id,
        featured_image: featuredImage,
        images,
        required_equipment: equipment, // Usar required_equipment en lugar de essential_equipment
        route_coordinates: routeCoordinates.length > 0 ? {
          type: 'LineString',
          coordinates: routeCoordinates,
        } : null,
        meeting_point: meetingPoint,
        waypoints,
        // Mantener duration_type, duration_value y daily_itinerary
        // También calcular estimated_duration para compatibilidad con código antiguo
        estimated_duration: data.duration_type === 'hours'
          ? data.duration_value
          : data.duration_value * 24,
      };

      console.log('Datos a enviar:', routeData);

      let result;
      if (route) {
        // Actualizar ruta existente
        const { data: updatedRoute, error: updateError } = await supabase
          .from('routes')
          .update(routeData)
          .eq('id', route.id)
          .select()
          .single();

        if (updateError) {
          console.error('Error al actualizar:', updateError);
          throw updateError;
        }
        result = updatedRoute;
      } else {
        // Crear nueva ruta
        const { data: newRoute, error: insertError } = await supabase
          .from('routes')
          .insert(routeData)
          .select()
          .single();

        if (insertError) {
          console.error('Error al insertar:', insertError);
          throw insertError;
        }
        result = newRoute;
      }

      router.push(`/${locale}/routes/${result.slug}`);
    } catch (err: any) {
      console.error('Error al guardar ruta:', err);
      setError(err.message || 'Error al guardar la ruta');
    } finally {
      setIsLoading(false);
    }
  }

  // Manejar errores de validación
  const onError = (errors: any) => {
    console.log('Errores de validación:', errors);
    setError('Por favor completa todos los campos requeridos antes de continuar');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Prevenir submit accidental con Enter
  const handleKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key === 'Enter') {
      const target = e.target as HTMLElement;
      // Solo permitir Enter si el foco está en el botón de submit o en un textarea
      if (target.tagName !== 'BUTTON' && target.tagName !== 'TEXTAREA') {
        e.preventDefault();
      }
    }
  };

  return (
    <form
      onSubmit={(e) => e.preventDefault()}
      onKeyDown={handleKeyDown}
      className="space-y-8"
    >
      {/* Steps Navigation */}
      <Card>
        <CardContent className="pt-6">
          <Steps
            steps={steps}
            currentStep={currentStep}
            onStepClick={goToStep}
          />
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && (
        <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          {error}
        </div>
      )}

      {/* Step Content */}
      <div className="min-h-[500px]">
        {currentStep === 0 && (
          <StepBasicInfo
            register={register}
            errors={errors}
            watch={watch}
            setValue={setValue}
            durationType={durationType}
            durationValue={durationValue}
            onDurationTypeChange={handleDurationTypeChange}
            dailyItinerary={dailyItinerary}
            setDailyItinerary={setDailyItinerary}
          />
        )}

        {currentStep === 1 && (
          <StepLogistics register={register} errors={errors} watch={watch} />
        )}

        {currentStep === 2 && (
          <StepPublication register={register} errors={errors} watch={watch} setValue={setValue} />
        )}

        {currentStep === 3 && (
          <StepTechnicalDetails
            register={register}
            errors={errors}
            equipment={equipment}
            setEquipment={setEquipment}
            setValue={setValue}
            watch={watch}
            control={control}
          />
        )}

        {currentStep === 4 && (
          <StepMap
            routeCoordinates={routeCoordinates}
            setRouteCoordinates={setRouteCoordinates}
            meetingPoint={meetingPoint}
            setMeetingPoint={setMeetingPoint}
            waypoints={waypoints}
            setWaypoints={setWaypoints}
          />
        )}

        {currentStep === 5 && (
          <StepImages
            featuredImage={featuredImage}
            setFeaturedImage={setFeaturedImage}
            images={images}
            setImages={setImages}
          />
        )}
      </div>

      {/* Navigation Buttons */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={goToPrevStep}
              disabled={currentStep === 0 || isLoading}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Anterior
            </Button>

            <span className="text-sm text-muted-foreground">
              Paso {currentStep + 1} de {steps.length}
            </span>

            {currentStep === steps.length - 1 ? (
              <Button
                type="button"
                disabled={isLoading}
                onClick={() => handleSubmit(onSubmit, onError)()}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    {route ? 'Actualizar Ruta' : 'Crear Ruta'}
                  </>
                )}
              </Button>
            ) : (
              <Button type="button" onClick={goToNextStep} disabled={isLoading}>
                Siguiente
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
