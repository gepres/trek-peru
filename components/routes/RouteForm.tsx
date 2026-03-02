'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
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
import { RouteMapEditor } from '@/components/maps/RouteMapEditor';
import { ImageUpload } from '@/components/shared/ImageUpload';
import { ImageGallery } from '@/components/shared/ImageGallery';
import { Loader2 } from 'lucide-react';

interface RouteFormProps {
  route?: Route;
  locale: string;
}

// Formulario completo para crear/editar rutas
export function RouteForm({ route, locale }: RouteFormProps) {
  const t = useTranslations('routes');
  const router = useRouter();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estado para datos geográficos del mapa
  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>(
    route?.route_coordinates?.coordinates || []
  );
  const [meetingPoint, setMeetingPoint] = useState<MeetingPoint | null>(
    route?.meeting_point || null
  );
  const [waypoints, setWaypoints] = useState<Waypoint[]>(
    route?.waypoints || []
  );

  // Estado para imágenes
  const [featuredImage, setFeaturedImage] = useState<string | undefined>(
    route?.featured_image
  );
  const [images, setImages] = useState<string[]>(
    route?.images || []
  );

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RouteFormInput>({
    resolver: zodResolver(routeFormSchema),
    defaultValues: route ? {
      title: route.title,
      description: route.description || '',
      difficulty: route.difficulty,
      distance: route.distance || undefined,
      elevation_gain: route.elevation_gain || undefined,
      elevation_loss: route.elevation_loss || undefined,
      estimated_duration: route.estimated_duration || undefined,
      min_altitude: route.min_altitude || undefined,
      max_altitude: route.max_altitude || undefined,
      region: route.region || '',
      province: route.province || '',
      max_capacity: route.max_capacity || undefined,
      cost: route.cost || undefined,
      currency: route.currency || 'PEN',
      emergency_contact: route.emergency_contact || '',
      status: route.status || 'draft',
      visibility: route.visibility || 'public',
    } : {
      difficulty: 'moderate',
      currency: 'PEN',
      status: 'draft',
      visibility: 'public',
    },
  });

  // Manejar envío del formulario
  async function onSubmit(data: RouteFormInput) {
    try {
      setIsLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Debes iniciar sesión para crear una ruta');
        return;
      }

      // Preparar datos geográficos e imágenes
      const routeData = {
        ...data,
        route_coordinates: routeCoordinates.length > 0
          ? {
              type: 'LineString',
              coordinates: routeCoordinates
            }
          : null,
        meeting_point: meetingPoint,
        waypoints: waypoints.length > 0 ? waypoints : null,
        featured_image: featuredImage || null,
        images: images.length > 0 ? images : null,
      };

      if (route) {
        // Actualizar ruta existente
        const { error: updateError } = await supabase
          .from('routes')
          .update({
            ...routeData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', route.id);

        if (updateError) throw updateError;

        router.push(`/${locale}/routes/${route.slug}`);
      } else {
        // Crear nueva ruta
        const { data: newRoute, error: insertError } = await supabase
          .from('routes')
          .insert({
            ...routeData,
            creator_id: user.id,
          })
          .select()
          .single();

        if (insertError) throw insertError;
        if (newRoute) {
          router.push(`/${locale}/routes/${newRoute.slug}`);
        }
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  }

  const difficulty = watch('difficulty');
  const status = watch('status');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Información Básica */}
      <Card>
        <CardHeader>
          <CardTitle>Información Básica</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Título */}
          <div className="space-y-2">
            <Label htmlFor="title">{t('form.title')} *</Label>
            <Input
              id="title"
              {...register('title')}
              placeholder="Ej: Trekking al Nevado Huascarán"
              disabled={isLoading}
            />
            {errors.title && (
              <p className="text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>

          {/* Descripción */}
          <div className="space-y-2">
            <Label htmlFor="description">{t('form.description')}</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Describe la ruta, qué verán, qué esperar..."
              rows={4}
              disabled={isLoading}
            />
            {errors.description && (
              <p className="text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          {/* Dificultad */}
          <div className="space-y-2">
            <Label htmlFor="difficulty">{t('form.difficulty')} *</Label>
            <Select
              value={difficulty}
              onValueChange={(value) => setValue('difficulty', value as any)}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">{t('difficulty.easy')}</SelectItem>
                <SelectItem value="moderate">{t('difficulty.moderate')}</SelectItem>
                <SelectItem value="hard">{t('difficulty.hard')}</SelectItem>
                <SelectItem value="extreme">{t('difficulty.extreme')}</SelectItem>
              </SelectContent>
            </Select>
            {errors.difficulty && (
              <p className="text-sm text-red-600">{errors.difficulty.message}</p>
            )}
          </div>

          {/* Región y Provincia */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="region">{t('form.region')}</Label>
              <Input
                id="region"
                {...register('region')}
                placeholder="Ej: Ancash"
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="province">{t('form.province')}</Label>
              <Input
                id="province"
                {...register('province')}
                placeholder="Ej: Huaraz"
                disabled={isLoading}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detalles Técnicos */}
      <Card>
        <CardHeader>
          <CardTitle>Detalles Técnicos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Distancia */}
            <div className="space-y-2">
              <Label htmlFor="distance">{t('form.distance')}</Label>
              <Input
                id="distance"
                type="number"
                step="0.01"
                {...register('distance', { valueAsNumber: true })}
                placeholder="15.5"
                disabled={isLoading}
              />
              {errors.distance && (
                <p className="text-sm text-red-600">{errors.distance.message}</p>
              )}
            </div>

            {/* Duración estimada */}
            <div className="space-y-2">
              <Label htmlFor="estimated_duration">{t('form.duration')}</Label>
              <Input
                id="estimated_duration"
                type="number"
                step="0.5"
                {...register('estimated_duration', { valueAsNumber: true })}
                placeholder="8"
                disabled={isLoading}
              />
            </div>

            {/* Desnivel positivo */}
            <div className="space-y-2">
              <Label htmlFor="elevation_gain">{t('form.elevationGain')}</Label>
              <Input
                id="elevation_gain"
                type="number"
                {...register('elevation_gain', { valueAsNumber: true })}
                placeholder="1200"
                disabled={isLoading}
              />
            </div>

            {/* Desnivel negativo */}
            <div className="space-y-2">
              <Label htmlFor="elevation_loss">{t('form.elevationLoss')}</Label>
              <Input
                id="elevation_loss"
                type="number"
                {...register('elevation_loss', { valueAsNumber: true })}
                placeholder="800"
                disabled={isLoading}
              />
            </div>

            {/* Altitud mínima */}
            <div className="space-y-2">
              <Label htmlFor="min_altitude">{t('form.minAltitude')}</Label>
              <Input
                id="min_altitude"
                type="number"
                {...register('min_altitude', { valueAsNumber: true })}
                placeholder="2800"
                disabled={isLoading}
              />
            </div>

            {/* Altitud máxima */}
            <div className="space-y-2">
              <Label htmlFor="max_altitude">{t('form.maxAltitude')}</Label>
              <Input
                id="max_altitude"
                type="number"
                {...register('max_altitude', { valueAsNumber: true })}
                placeholder="4200"
                disabled={isLoading}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mapa de la Ruta */}
      <Card>
        <CardHeader>
          <CardTitle>Mapa de la Ruta</CardTitle>
        </CardHeader>
        <CardContent>
          <RouteMapEditor
            initialRouteCoordinates={
              route?.route_coordinates?.coordinates ?? undefined
            }
            initialMeetingPoint={route?.meeting_point}
            initialWaypoints={route?.waypoints || []}
            onRouteChange={setRouteCoordinates}
            onMeetingPointChange={setMeetingPoint}
            onWaypointsChange={setWaypoints}
            height="500px"
          />
        </CardContent>
      </Card>

      {/* Imágenes de la Ruta */}
      <Card>
        <CardHeader>
          <CardTitle>Imágenes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Imagen destacada */}
            <div className="space-y-3">
              <div>
                <h4 className="font-medium text-sm mb-1">Imagen Destacada</h4>
                <p className="text-xs text-muted-foreground">
                  Esta imagen se mostrará como portada de la ruta
                </p>
              </div>
              <ImageUpload
                bucket="route-images"
                folder={route?.id || 'temp'}
                currentImageUrl={featuredImage}
                onUploadComplete={setFeaturedImage}
                onRemove={() => setFeaturedImage(undefined)}
                aspectRatio="aspect-video"
                showPreview={true}
              />
            </div>

            {/* Galería de imágenes */}
            <div className="space-y-3 lg:col-span-2">
              <div className="border-t border-border pt-6">
                <h4 className="font-medium text-sm mb-1">Galería de Imágenes</h4>
                <p className="text-xs text-muted-foreground mb-4">
                  Sube hasta 10 imágenes adicionales de la ruta
                </p>
                <ImageGallery
                  images={images}
                  onImagesChange={setImages}
                  bucket="route-images"
                  folder={route?.id || 'temp'}
                  maxImages={10}
                  editable={true}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logística */}
      <Card>
        <CardHeader>
          <CardTitle>Logística y Capacidad</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Capacidad máxima */}
            <div className="space-y-2">
              <Label htmlFor="max_capacity">{t('form.maxCapacity')}</Label>
              <Input
                id="max_capacity"
                type="number"
                {...register('max_capacity', { valueAsNumber: true })}
                placeholder="15"
                disabled={isLoading}
              />
            </div>

            {/* Costo */}
            <div className="space-y-2">
              <Label htmlFor="cost">{t('form.cost')}</Label>
              <Input
                id="cost"
                type="number"
                step="0.01"
                {...register('cost', { valueAsNumber: true })}
                placeholder="150.00"
                disabled={isLoading}
              />
            </div>

            {/* Contacto de emergencia */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="emergency_contact">{t('form.emergencyContact')}</Label>
              <Input
                id="emergency_contact"
                {...register('emergency_contact')}
                placeholder="+51 987 654 321"
                disabled={isLoading}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estado y Visibilidad */}
      <Card>
        <CardHeader>
          <CardTitle>Publicación</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Estado */}
            <div className="space-y-2">
              <Label htmlFor="status">Estado</Label>
              <Select
                value={status}
                onValueChange={(value) => setValue('status', value as any)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">{t('status.draft')}</SelectItem>
                  <SelectItem value="published">{t('status.published')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Visibilidad */}
            <div className="space-y-2">
              <Label htmlFor="visibility">Visibilidad</Label>
              <Select
                value={watch('visibility')}
                onValueChange={(value) => setValue('visibility', value as any)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">{t('visibility.public')}</SelectItem>
                  <SelectItem value="private">{t('visibility.private')}</SelectItem>
                  <SelectItem value="link">{t('visibility.link')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error general */}
      {error && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Botones de acción */}
      <div className="flex gap-4 justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isLoading}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {route ? 'Actualizar Ruta' : 'Crear Ruta'}
        </Button>
      </div>
    </form>
  );
}
