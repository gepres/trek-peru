import { z } from 'zod';

// Helper: NaN/vacío/null → undefined para campos numéricos opcionales
const nanToUndefined = (val: unknown): unknown =>
  val === '' ||
  val === null ||
  val === undefined ||
  (typeof val === 'number' && isNaN(val))
    ? undefined
    : val;

const optionalNum = (inner: z.ZodNumber) =>
  z.preprocess(nanToUndefined, inner.optional());

// Helper para URL opcional: string vacío → undefined
const trimUrl = (val: unknown): unknown => {
  if (typeof val !== 'string') return val;
  const trimmed = val.trim();
  return trimmed === '' ? undefined : trimmed;
};

const optionalText = (max?: number) => {
  const base = z.string().trim();
  const withMax = max ? base.max(max) : base;
  return z.preprocess(
    (val) => (typeof val === 'string' && val.trim() === '' ? undefined : val),
    withMax.optional(),
  );
};

export const transportModeSchema = z.enum([
  'bus',
  'plane',
  'taxi',
  'combi',
  'colectivo',
  'train',
  'motorcycle',
  'boat',
  'car',
  'walk',
  'bike',
  'other',
]);

export const costTypeSchema = z.enum([
  'per_person',
  'per_vehicle',
  'per_group',
  'free',
]);

export const timeModeSchema = z.enum(['exact', 'approximate', 'range']);

export const currencySchema = z.enum(['PEN', 'USD']);

// Schema para una opción de transporte (alternativa)
export const transportOptionSchema = z
  .object({
    mode: transportModeSchema,
    operator: optionalText(120),
    class: optionalText(40),

    time_mode: timeModeSchema.default('approximate'),
    departure_time: optionalText(40),
    arrival_time: optionalText(40),
    duration_minutes: optionalNum(z.number().int().min(0).max(10_000)),

    cost_type: costTypeSchema.default('per_person'),
    cost_min: optionalNum(z.number().min(0).max(1_000_000)),
    cost_max: optionalNum(z.number().min(0).max(1_000_000)),
    currency: currencySchema.default('PEN'),

    frequency: optionalText(120),
    booking_location: optionalText(200),
    booking_url: z.preprocess(
      trimUrl,
      z.string().url('URL inválida').optional(),
    ),

    is_recommended: z.boolean().default(false),
    notes: optionalText(),
  })
  .refine(
    (data) =>
      data.cost_min === undefined ||
      data.cost_max === undefined ||
      data.cost_max >= data.cost_min,
    {
      message: 'El costo máximo debe ser mayor o igual al mínimo',
      path: ['cost_max'],
    },
  );

export type TransportOptionInput = z.input<typeof transportOptionSchema>;
export type TransportOptionOutput = z.output<typeof transportOptionSchema>;

// Schema para un segmento (paso A→B)
export const transportSegmentSchema = z.object({
  title: optionalText(160),
  from_label: z
    .string()
    .trim()
    .min(2, 'El origen debe tener al menos 2 caracteres')
    .max(160, 'El origen no puede exceder 160 caracteres'),
  to_label: z
    .string()
    .trim()
    .min(2, 'El destino debe tener al menos 2 caracteres')
    .max(160, 'El destino no puede exceder 160 caracteres'),
  notes: optionalText(),
});

export type TransportSegmentInput = z.input<typeof transportSegmentSchema>;
export type TransportSegmentOutput = z.output<typeof transportSegmentSchema>;
