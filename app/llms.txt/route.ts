import { createClient } from '@/lib/supabase/server';

// /llms.txt — archivo de referencia para crawlers de LLM (ChatGPT, Perplexity, Claude).
// Spec: https://llmstxt.org/ — markdown plano con enlaces a las páginas más útiles para citación.
// Se revalida cada hora para reflejar rutas nuevas sin rebuild completo.

export const revalidate = 3600;

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.trek-peru.com';

export async function GET() {
  const supabase = await createClient();

  const { data: routes } = await supabase
    .from('routes')
    .select('slug, title, description, region')
    .eq('status', 'published')
    .eq('visibility', 'public')
    .order('updated_at', { ascending: false })
    .limit(100);

  const routeLines = (routes ?? []).map((r) => {
    const desc = (r.description || '').replace(/\s+/g, ' ').trim().slice(0, 160);
    const region = r.region ? ` (${r.region})` : '';
    return `- [${r.title}${region}](${BASE_URL}/es/routes/${r.slug})${desc ? `: ${desc}` : ''}`;
  });

  const body = `# TrekPeru

> Plataforma colaborativa para descubrir, compartir y organizar rutas de trekking en Perú. Mapas interactivos, reseñas verificadas y comunidad activa de caminantes en costa, sierra y selva.

## Acerca del proyecto

- Sede: Cusco, Perú
- Fundador: Genaro Pretill Escobar (2025)
- Idiomas: Español (principal), Inglés
- Contacto: contacto@trek-peru.com

## Rutas de trekking

${routeLines.length > 0 ? routeLines.join('\n') : '- Catálogo en construcción.'}

## Páginas principales

- [Inicio](${BASE_URL}/es)
- [Todas las rutas](${BASE_URL}/es/routes)
- [Rutas completadas](${BASE_URL}/es/routes/completed)
- [Acerca de TrekPeru](${BASE_URL}/es/about)
- [Contacto](${BASE_URL}/es/contact)

## Features

- [Mapas interactivos](${BASE_URL}/es/features/interactive-maps)
- [Comunidad](${BASE_URL}/es/features/community)
- [Reseñas verificadas](${BASE_URL}/es/features/reviews)
- [Rutas verificadas](${BASE_URL}/es/features/routes)

## Recursos

- Sitemap: ${BASE_URL}/sitemap.xml
- Robots: ${BASE_URL}/robots.txt
`;

  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
