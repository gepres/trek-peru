'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EquipmentList } from '../EquipmentList';
import {
  Mountain, Ruler, TrendingUp, TrendingDown, AlertCircle, Backpack,
  Droplets, Home, Signal, Thermometer, Footprints, Gauge,
  Lightbulb, Copy, Check, ChevronDown, ChevronUp, ExternalLink
} from 'lucide-react';
import { UseFormRegister, FieldErrors, UseFormSetValue, UseFormWatch, Controller, Control } from 'react-hook-form';
import { RouteFormInput } from '@/lib/validations/route.schema';
import { useTranslations } from 'next-intl';

interface StepTechnicalDetailsProps {
  register: UseFormRegister<RouteFormInput>;
  errors: FieldErrors<RouteFormInput>;
  equipment: string[];
  setEquipment: (equipment: string[]) => void;
  setValue: UseFormSetValue<RouteFormInput>;
  watch: UseFormWatch<RouteFormInput>;
  control: Control<RouteFormInput>;
}

const TERRAIN_TYPES = [
  'Sendero',
  'Bosque',
  'Montaña',
  'Roca',
  'Nieve',
  'Arena',
  'Lodo',
  'Río/Agua',
  'Glaciar',
  'Desierto',
  'Selva',
  'Pradera',
];


// Tip con prompt de IA para obtener datos técnicos difíciles de conocer
function AltitudeTip({
  routeTitle,
  departureDate,
  meetingTime,
  region,
  province,
}: {
  routeTitle: string;
  departureDate?: string;
  meetingTime?: string;
  region?: string;
  province?: string;
}) {
  const t = useTranslations('routeForm');
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const nombre = routeTitle?.trim() || 'nombre de la ruta';

  // Construir la línea de ubicación con región y provincia (si la hay)
  const ubicacionLinea = region
    ? `en la región de ${region}${province ? `, provincia de ${province}` : ''}`
    : 'en Perú';

  // Formatear fecha YYYY-MM-DD → DD/MM/YYYY para el prompt
  function formatDate(raw?: string): string {
    if (!raw) return '';
    const parts = raw.substring(0, 10).split('-');
    if (parts.length !== 3) return raw;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }

  // Construir la línea de clima según los datos del Paso 2
  const fechaFormateada = formatDate(departureDate);
  let climaLinea: string;
  if (fechaFormateada && meetingTime) {
    climaLinea = `el ${fechaFormateada} a las ${meetingTime}`;
  } else if (fechaFormateada) {
    climaLinea = `el ${fechaFormateada}`;
  } else {
    climaLinea = '(agrega la fecha de salida en el Paso 2 — Logística)';
  }

  const prompt = `Dame los datos técnicos de la ruta de trekking "${nombre}" ${ubicacionLinea}:
- Distancia total (km)
- Desnivel positivo (m)
- Desnivel negativo (m)
- Altitud mínima (m.s.n.m)
- Altitud máxima (m.s.n.m)
- Clima esperado ${climaLinea}`;

  // Query de Google incluye región y provincia para afinar la búsqueda
  const ubicacionQuery = [region, province].filter(Boolean).join(' ') || 'Perú';
  const googleQuery = `datos técnicos trekking "${nombre}" ${ubicacionQuery} desnivel altitud`;
  const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(googleQuery)}`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* silencioso */
    }
  }

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800/40 dark:bg-amber-900/10">
      {/* Header siempre visible */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
          <Lightbulb className="h-4 w-4 shrink-0" />
          <span className="text-sm font-medium">
            {t('helpPromptLabel')}
          </span>
        </div>
        {open
          ? <ChevronUp className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
          : <ChevronDown className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
        }
      </button>

      {/* Contenido expandible */}
      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-amber-200 dark:border-amber-800/40 pt-3">
          <p className="text-xs text-amber-700 dark:text-amber-400">
            {t('copyPromptLabel')}
          </p>

          {/* Prompt copiable */}
          <div className="relative">
            <pre className="text-xs bg-white dark:bg-black/20 border border-amber-200 dark:border-amber-800/40 rounded-lg p-3 pr-24 whitespace-pre-wrap text-muted-foreground font-mono leading-relaxed">
              {prompt}
            </pre>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="absolute top-2 right-2 h-7 gap-1 text-xs border-amber-300 hover:bg-amber-100 dark:border-amber-700 dark:hover:bg-amber-900/30"
              onClick={handleCopy}
            >
              {copied
                ? <><Check className="h-3 w-3 text-green-600" /> {t('copied')}</>
                : <><Copy className="h-3 w-3" /> {t('copy')}</>
              }
            </Button>
          </div>

          {/* Alternativa: Google */}
          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-amber-200 dark:bg-amber-800/40" />
            <span className="text-xs text-amber-600 dark:text-amber-500">{t('orSearchGoogle')}</span>
            <div className="h-px flex-1 bg-amber-200 dark:bg-amber-800/40" />
          </div>

          <a
            href={googleUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 text-xs text-amber-700 dark:text-amber-400 hover:underline"
          >
            <ExternalLink className="h-3 w-3" />
            {t('searchInGoogle', { name: nombre })}
          </a>
        </div>
      )}
    </div>
  );
}

export function StepTechnicalDetails({
  register,
  errors,
  equipment,
  setEquipment,
  setValue,
  watch,
  control,
}: StepTechnicalDetailsProps) {
  const t = useTranslations('routeForm');

  const TECHNICAL_LEVELS = [
    { value: 'none', label: t('techNone') },
    { value: 'basic', label: t('techBasic') },
    { value: 'intermediate', label: t('techIntermediate') },
    { value: 'advanced', label: t('techAdvanced') },
    { value: 'expert', label: t('techExpert') },
  ];

  const waterAvailable = watch('water_available');
  const shelters = watch('shelters');
  const mobileSignal = watch('mobile_signal');
  const terrainType = watch('terrain_type') || [];
  // Título, región y provincia del Paso 1 — se usan en el tip de IA
  const routeTitle = watch('title') || '';
  const region = watch('region') || '';
  const province = watch('province') || '';
  // Fecha y hora del Paso 2 — se incluyen en el prompt de clima
  const departureDate = watch('departure_date') || '';
  const meetingTime = watch('meeting_time') || '';
  // Tab de unidad de temperatura para el campo Clima Esperado
  const [tempUnit, setTempUnit] = useState<'C' | 'F'>('C');

  // Estado local del texto de clima sin unidad (la unidad se concatena al guardar)
  // Al iniciar, si ya hay un valor guardado, quitar el sufijo °C/°F para mostrarlo limpio
  const [weatherText, setWeatherText] = useState<string>(() => {
    const stored = watch('expected_weather') || '';
    return stored.replace(/°[CF]$/i, '').trim();
  });

  // Cada vez que cambia el texto O la unidad, actualizar el valor del formulario
  useEffect(() => {
    const suffix = tempUnit === 'C' ? '°C' : '°F';
    setValue('expected_weather', weatherText ? `${weatherText}${suffix}` : '');
  }, [weatherText, tempUnit, setValue]);

  const toggleTerrainType = (terrain: string) => {
    const current = terrainType || [];
    if (current.includes(terrain)) {
      setValue('terrain_type', current.filter(t => t !== terrain));
    } else {
      setValue('terrain_type', [...current, terrain]);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('step4Title')}</CardTitle>
          <CardDescription>
            {t('step4Desc')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Distancia y desnivel */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Distancia */}
            <div className="space-y-2">
              <Label htmlFor="distance" className="flex items-center gap-2">
                <Ruler className="h-4 w-4" />
                {t('distance')}
              </Label>
              <Input
                id="distance"
                type="number"
                min="0"
                step="0.1"
                {...register('distance', { valueAsNumber: true })}
                placeholder={t('distancePlaceholder')}
                className={errors.distance ? 'border-destructive' : ''}
              />
              {errors.distance && (
                <p className="text-sm text-destructive">{errors.distance.message}</p>
              )}
            </div>

            {/* Desnivel positivo */}
            <div className="space-y-2">
              <Label htmlFor="elevation_gain" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                {t('elevationGain')}
              </Label>
              <Input
                id="elevation_gain"
                type="number"
                min="0"
                {...register('elevation_gain', { valueAsNumber: true })}
                placeholder={t('elevationGainPlaceholder')}
                className={errors.elevation_gain ? 'border-destructive' : ''}
              />
              {errors.elevation_gain && (
                <p className="text-sm text-destructive">{errors.elevation_gain.message}</p>
              )}
            </div>

            {/* Desnivel negativo */}
            <div className="space-y-2">
              <Label htmlFor="elevation_loss" className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-red-500" />
                {t('elevationLoss')}
              </Label>
              <Input
                id="elevation_loss"
                type="number"
                min="0"
                {...register('elevation_loss', { valueAsNumber: true })}
                placeholder={t('elevationLossPlaceholder')}
                className={errors.elevation_loss ? 'border-destructive' : ''}
              />
              {errors.elevation_loss && (
                <p className="text-sm text-destructive">{errors.elevation_loss.message}</p>
              )}
            </div>
          </div>

          {/* Altitudes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Altitud mínima */}
            <div className="space-y-2">
              <Label htmlFor="min_altitude" className="flex items-center gap-2">
                <Mountain className="h-4 w-4" />
                {t('minAltitude')}
              </Label>
              <Input
                id="min_altitude"
                type="number"
                min="0"
                {...register('min_altitude', { valueAsNumber: true })}
                placeholder={t('minAltitudePlaceholder')}
                className={errors.min_altitude ? 'border-destructive' : ''}
              />
              {errors.min_altitude && (
                <p className="text-sm text-destructive">{errors.min_altitude.message}</p>
              )}
            </div>

            {/* Altitud máxima */}
            <div className="space-y-2">
              <Label htmlFor="max_altitude" className="flex items-center gap-2">
                <Mountain className="h-4 w-4" />
                {t('maxAltitudeLabel')}
              </Label>
              <Input
                id="max_altitude"
                type="number"
                min="0"
                {...register('max_altitude', { valueAsNumber: true })}
                placeholder={t('maxAltitudePlaceholder')}
                className={errors.max_altitude ? 'border-destructive' : ''}
              />
              {errors.max_altitude && (
                <p className="text-sm text-destructive">{errors.max_altitude.message}</p>
              )}
            </div>
          </div>

          {/* ── Tip de IA — prompt listo para copiar ── */}
          <AltitudeTip
            routeTitle={routeTitle}
            departureDate={departureDate}
            meetingTime={meetingTime}
            region={region}
            province={province}
          />

          {/* Equipo esencial */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Backpack className="h-4 w-4" />
              {t('essentialEquipment')}
            </Label>
            <EquipmentList
              value={equipment}
              onChange={(items) => {
                setEquipment(items);
                setValue('essential_equipment', items);
              }}
            />
            <p className="text-xs text-muted-foreground">
              {t('equipmentHint')}
            </p>
          </div>

          {/* Contacto de emergencia */}
          <div className="space-y-2">
            <Label htmlFor="emergency_contact" className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {t('emergencyContact')}
            </Label>
            <Input
              id="emergency_contact"
              type="text"
              {...register('emergency_contact')}
              placeholder={t('emergencyPlaceholder')}
              className={errors.emergency_contact ? 'border-destructive' : ''}
            />
            <p className="text-xs text-muted-foreground">
              {t('emergencyHint')}
            </p>
            {errors.emergency_contact && (
              <p className="text-sm text-destructive">{errors.emergency_contact.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Condiciones y Servicios */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Thermometer className="h-5 w-5 text-amber-500" />
            {t('conditionsTitle')}
          </CardTitle>
          <CardDescription>
            {t('conditionsDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Switches de servicios */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Agua disponible */}
            <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${waterAvailable ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted text-muted-foreground'}`}>
                  <Droplets className="h-5 w-5" />
                </div>
                <div>
                  <Label htmlFor="water_available" className="font-medium cursor-pointer">
                    {t('waterAvailable')}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {t('waterHint')}
                  </p>
                </div>
              </div>
              <Switch
                id="water_available"
                checked={waterAvailable}
                onCheckedChange={(checked) => setValue('water_available', checked)}
              />
            </div>

            {/* Refugios */}
            <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${shelters ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted text-muted-foreground'}`}>
                  <Home className="h-5 w-5" />
                </div>
                <div>
                  <Label htmlFor="shelters" className="font-medium cursor-pointer">
                    {t('shelters')}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {t('sheltersHint')}
                  </p>
                </div>
              </div>
              <Switch
                id="shelters"
                checked={shelters}
                onCheckedChange={(checked) => setValue('shelters', checked)}
              />
            </div>

            {/* Señal móvil */}
            <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${mobileSignal ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted text-muted-foreground'}`}>
                  <Signal className="h-5 w-5" />
                </div>
                <div>
                  <Label htmlFor="mobile_signal" className="font-medium cursor-pointer">
                    {t('mobileSignal')}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {t('mobileSignalHint')}
                  </p>
                </div>
              </div>
              <Switch
                id="mobile_signal"
                checked={mobileSignal}
                onCheckedChange={(checked) => setValue('mobile_signal', checked)}
              />
            </div>
          </div>

          {/* Clima esperado */}
          <div className="space-y-2">
            {/* Label + tabs °C / °F en la misma fila */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <Label htmlFor="expected_weather" className="flex items-center gap-2">
                <Thermometer className="h-4 w-4" />
                {t('expectedWeather')}
              </Label>
              {/* Tabs de unidad de temperatura */}
              <div className="flex rounded-lg border overflow-hidden text-xs h-7">
                <button
                  type="button"
                  onClick={() => setTempUnit('C')}
                  className={`px-3 font-medium transition-colors ${
                    tempUnit === 'C'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-background text-muted-foreground hover:bg-muted'
                  }`}
                >
                  °C Celsius
                </button>
                <button
                  type="button"
                  onClick={() => setTempUnit('F')}
                  className={`px-3 font-medium transition-colors border-l ${
                    tempUnit === 'F'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-background text-muted-foreground hover:bg-muted'
                  }`}
                >
                  °F Fahrenheit
                </button>
              </div>
            </div>

            {/* Input con sufijo de unidad concatenado visualmente */}
            <div className="flex">
              <Input
                id="expected_weather"
                type="text"
                value={weatherText}
                onChange={(e) => setWeatherText(e.target.value)}
                placeholder={tempUnit === 'C' ? t('weatherPlaceholderC') : t('weatherPlaceholderF')}
                className={`rounded-r-none ${errors.expected_weather ? 'border-destructive' : ''}`}
              />
              {/* Sufijo de unidad — solo visual, la unidad se concatena al valor del form */}
              <span className="flex items-center px-3 border border-l-0 rounded-r-md bg-muted text-sm font-semibold text-foreground select-none">
                {tempUnit === 'C' ? '°C' : '°F'}
              </span>
            </div>

            {/* Hint compacto */}
            <p className="text-xs text-muted-foreground">
              {t('weatherSaveHint')}{' '}
              <code className="px-1 py-0.5 rounded bg-muted font-mono">
                {weatherText || (tempUnit === 'C' ? '16-20' : '61-68')}{tempUnit === 'C' ? '°C' : '°F'}
              </code>
            </p>
          </div>

          {/* Tipo de terreno */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Footprints className="h-4 w-4" />
              {t('terrainType')}
            </Label>
            <div className="flex flex-wrap gap-2">
              {TERRAIN_TYPES.map((terrain) => (
                <button
                  key={terrain}
                  type="button"
                  onClick={() => toggleTerrainType(terrain)}
                  className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${
                    terrainType.includes(terrain)
                      ? 'bg-primary/10 border-primary text-primary'
                      : 'bg-background border-border text-muted-foreground hover:border-primary/50'
                  }`}
                >
                  {terrain}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {t('terrainHint')}
            </p>
          </div>

          {/* Nivel técnico */}
          <div className="space-y-2">
            <Label htmlFor="technical_level" className="flex items-center gap-2">
              <Gauge className="h-4 w-4" />
              {t('technicalLevel')}
            </Label>
            <Controller
              control={control}
              name="technical_level"
              render={({ field }) => (
                <Select value={field.value || ''} onValueChange={field.onChange}>
                  <SelectTrigger className={errors.technical_level ? 'border-destructive' : ''}>
                    <SelectValue placeholder={t('selectTechnicalLevel')} />
                  </SelectTrigger>
                  <SelectContent>
                    {TECHNICAL_LEVELS.map((level) => (
                      <SelectItem key={level.value} value={level.value}>
                        {level.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <p className="text-xs text-muted-foreground">
              {t('technicalLevelHint')}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
