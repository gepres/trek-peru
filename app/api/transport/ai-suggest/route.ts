// Endpoint POST /api/transport/ai-suggest
// Recibe { from, to } y devuelve alternativas de transporte estimadas por Claude.
// Implementa cache de 30 días en transport_ai_cache para no repetir prompts.
//
// Comportamiento gracioso:
//  - Sin ANTHROPIC_API_KEY → devuelve [] sin error (feature deshabilitada).
//  - Sin SUPABASE_SERVICE_ROLE_KEY → intenta sólo lectura de cache; sin escritura.
//  - Cualquier error en el LLM → devuelve [] sin propagar el error al cliente.

import { NextResponse, type NextRequest } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import { createHash } from 'crypto';
import type {
  AggregatedAlternative,
  TransportCurrency,
  TransportMode,
} from '@/types/transport.types';
import { TRANSPORT_MODES } from '@/types/transport.types';

const CACHE_TTL_DAYS = 30;
const MODEL = 'claude-haiku-4-5-20251001';
const MAX_TOKENS = 800;

// Cuerpo esperado
interface RequestBody {
  from?: string;
  to?: string;
}

// Forma esperada del JSON que devuelve Claude — validamos antes de aceptar
interface AISuggestion {
  mode: TransportMode;
  operator?: string;
  cost_min?: number | null;
  cost_max?: number | null;
  currency: TransportCurrency;
  duration_minutes?: number | null;
}

function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

function hashKey(fromNorm: string, toNorm: string): string {
  return createHash('sha256').update(`${fromNorm}→${toNorm}`).digest('hex');
}

// Service-role client (sólo se crea si la env está disponible).
// Sin service-role no podemos escribir en transport_ai_cache, pero sí podemos leer.
function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createSupabaseClient(url, serviceKey, {
    auth: { persistSession: false },
  });
}

// Cliente público para leer cache (fallback cuando no hay service-role)
function getPublicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
  if (!url || !anonKey) return null;
  return createSupabaseClient(url, anonKey, {
    auth: { persistSession: false },
  });
}

// Filtra la respuesta del LLM dejando sólo entradas con shape válido
function sanitizeSuggestions(raw: unknown): AggregatedAlternative[] {
  if (!Array.isArray(raw)) return [];
  const validModes = new Set<TransportMode>(TRANSPORT_MODES);
  const out: AggregatedAlternative[] = [];

  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const s = item as Record<string, unknown>;
    const mode = s.mode as TransportMode;
    if (!validModes.has(mode)) continue;
    const currency = s.currency === 'USD' ? 'USD' : 'PEN';

    out.push({
      mode,
      operator: typeof s.operator === 'string' ? s.operator : undefined,
      cost_min:
        typeof s.cost_min === 'number' && s.cost_min >= 0
          ? s.cost_min
          : undefined,
      cost_max:
        typeof s.cost_max === 'number' && s.cost_max >= 0
          ? s.cost_max
          : undefined,
      currency,
      duration_minutes:
        typeof s.duration_minutes === 'number' && s.duration_minutes > 0
          ? s.duration_minutes
          : undefined,
      sample_size: 0,
      source: 'ai',
    });
  }

  // Limita a 5 sugerencias para mantener UI digerible
  return out.slice(0, 5);
}

// Llama a Claude y devuelve sugerencias parseadas. Cualquier error → [].
async function generateWithClaude(
  from: string,
  to: string,
): Promise<AggregatedAlternative[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return [];

  try {
    const client = new Anthropic({ apiKey });
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system:
        'Eres un experto en transporte público en Perú. Responde SIEMPRE con JSON válido, nada más. Sé conservador con precios y duraciones — usa rangos cuando no estés seguro.',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Lista 1-4 alternativas realistas de transporte público para ir de "${from}" a "${to}" en Perú.

Responde SOLO con un array JSON (sin texto antes ni después, sin markdown) con esta forma:
[
  {
    "mode": "bus" | "plane" | "taxi" | "combi" | "colectivo" | "train" | "motorcycle" | "boat" | "car" | "walk" | "bike" | "other",
    "operator": "nombre del operador conocido o null",
    "cost_min": número en la moneda local,
    "cost_max": número (igual a cost_min si precio único),
    "currency": "PEN" | "USD",
    "duration_minutes": número entero
  }
]

Reglas:
- Devuelve únicamente el JSON, sin explicaciones.
- Si no conoces un dato con razonable certeza, usa null.
- No inventes operadores que no existen.
- Prefiere "combi" o "colectivo" para tramos cortos rurales.
- Usa "PEN" salvo vuelos internacionales (entonces "USD").`,
            },
          ],
        },
      ],
    });

    // Concatenar todos los bloques de texto
    const text = message.content
      .filter((b) => b.type === 'text')
      .map((b) => (b as { type: 'text'; text: string }).text)
      .join('')
      .trim();

    // Extraer JSON (Claude a veces devuelve ```json ... ```)
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];
    const parsed = JSON.parse(jsonMatch[0]);

    return sanitizeSuggestions(parsed);
  } catch (err) {
    console.error('AI suggest error:', err);
    return [];
  }
}

export async function POST(request: NextRequest) {
  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json({ suggestions: [] }, { status: 400 });
  }

  const from = body.from?.trim();
  const to = body.to?.trim();
  if (!from || !to) {
    return NextResponse.json({ suggestions: [] }, { status: 400 });
  }

  const fromNorm = normalize(from);
  const toNorm = normalize(to);
  const cacheKey = hashKey(fromNorm, toNorm);

  // 1) Intentar leer cache (público — la tabla permite SELECT a todos)
  const reader = getPublicClient();
  if (reader) {
    const { data: cached } = await reader
      .from('transport_ai_cache')
      .select('suggestions, expires_at')
      .eq('cache_key', cacheKey)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (cached?.suggestions) {
      return NextResponse.json({
        suggestions: sanitizeSuggestions(cached.suggestions),
        cached: true,
      });
    }
  }

  // 2) Cache miss — generar con LLM
  const suggestions = await generateWithClaude(from, to);

  // 3) Escribir cache (sólo si tenemos service-role)
  if (suggestions.length > 0) {
    const writer = getServiceClient();
    if (writer) {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + CACHE_TTL_DAYS);

      // upsert por si dos requests concurrentes coincidieron
      await writer.from('transport_ai_cache').upsert(
        {
          cache_key: cacheKey,
          from_normalized: fromNorm,
          to_normalized: toNorm,
          suggestions,
          model: MODEL,
          expires_at: expiresAt.toISOString(),
        },
        { onConflict: 'cache_key' },
      );
    }
  }

  return NextResponse.json({ suggestions, cached: false });
}
