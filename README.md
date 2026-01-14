# TrekPeru 🏔️

Plataforma colaborativa multiusuario para compartir y organizar rutas de trekking en Perú.

## 📋 Características

- ✅ Crear y publicar rutas de trekking personalizadas
- ✅ Registrarse como asistente en rutas de otros usuarios
- ✅ Visualizar rutas en mapas interactivos
- ✅ Sistema de favoritos y calificaciones
- ✅ Búsqueda y filtros avanzados
- ✅ Gestión de perfil de usuario
- ✅ Dashboard personal con estadísticas
- ✅ Soporte multiidioma (Español/Inglés)
- ✅ Autenticación segura con Supabase
- ✅ Responsive design (móvil, tablet, desktop)

## 🛠️ Stack Tecnológico

- **Frontend**: Next.js 15 (App Router) + TypeScript + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Storage + Realtime)
- **Mapas**: Mapbox GL JS
- **UI Components**: shadcn/ui + Radix UI
- **Forms**: React Hook Form + Zod
- **i18n**: next-intl
- **State Management**: Zustand (opcional)

## 📁 Estructura del Proyecto

```
trek-peru/
├── app/                          # Next.js App Router
│   ├── [locale]/                 # Rutas con i18n (es/en)
│   │   ├── (auth)/              # Grupo de autenticación
│   │   ├── (dashboard)/         # Grupo de dashboard
│   │   └── page.tsx             # Landing page
│   ├── api/                     # API Routes
│   └── globals.css              # Estilos globales
├── components/                   # Componentes React
│   ├── ui/                      # Componentes UI base (shadcn)
│   ├── auth/                    # Componentes de autenticación
│   ├── routes/                  # Componentes de rutas
│   ├── layout/                  # Layout components
│   └── shared/                  # Componentes compartidos
├── lib/                         # Librerías y utilidades
│   ├── supabase/               # Configuración Supabase
│   ├── validations/            # Esquemas Zod
│   ├── utils/                  # Funciones utilitarias
│   └── hooks/                  # Custom hooks
├── types/                       # Tipos TypeScript
├── messages/                    # Traducciones i18n
├── supabase/                    # Migraciones y seeds
│   └── migrations/
├── public/                      # Archivos estáticos
└── README.md                    # Este archivo
```

## 🚀 Instalación

### Prerequisitos

- Node.js 18+ y npm
- Cuenta en [Supabase](https://supabase.com)
- Cuenta en [Mapbox](https://www.mapbox.com) (para mapas)

### Pasos de Instalación

1. **Clonar el repositorio o acceder al directorio del proyecto**

```bash
cd trek-peru
```

2. **Instalar dependencias** (ya instaladas en este proyecto)

```bash
npm install
```

3. **Configurar variables de entorno**

Crear archivo `.env.local` basado en `.env.local.example`:

```bash
cp .env.local.example .env.local
```

Editar `.env.local` con tus credenciales:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=tu-proyecto-url.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=tu-anon-key

# Mapbox Configuration
NEXT_PUBLIC_MAPBOX_TOKEN=tu-mapbox-token

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

4. **Configurar Supabase**

a. Crear un nuevo proyecto en [Supabase](https://supabase.com)

b. Ejecutar la migración SQL:
   - Ve a SQL Editor en tu dashboard de Supabase
   - Copia el contenido de `supabase/migrations/001_initial_schema.sql`
   - Ejecuta el script completo

c. Configurar Storage Buckets (opcional, para imágenes):
   - Ve a Storage en Supabase Dashboard
   - Crea los siguientes buckets:
     - `avatars` (público)
     - `route-images` (público)
     - `route-gpx` (público)

d. Configurar autenticación:
   - Ve a Authentication > Providers
   - Habilita Email/Password
   - (Opcional) Configura OAuth providers (Google, GitHub, etc.)

5. **Ejecutar en modo desarrollo**

```bash
npm run dev
```

La aplicación estará disponible en [http://localhost:3000](http://localhost:3000)

## 📊 Base de Datos

### Tablas Principales

- **profiles**: Perfiles de usuario
- **routes**: Rutas de trekking
- **attendees**: Participantes de rutas
- **favorites**: Rutas favoritas
- **comments**: Comentarios en rutas

### Funciones Importantes

- `generate_slug()`: Genera slugs únicos para rutas
- `update_routes_search()`: Actualiza vector de búsqueda de texto
- `check_capacity()`: Verifica capacidad máxima de rutas
- `get_route_with_details()`: Obtiene ruta con detalles completos
- `search_nearby_routes()`: Búsqueda geoespacial de rutas cercanas

## 🔐 Autenticación

El proyecto usa Supabase Auth para autenticación:

- Registro con email/password
- Login con email/password
- Recuperación de contraseña
- Row Level Security (RLS) para proteger datos

## 🗺️ Mapas

Integración con Mapbox GL JS para:

- Visualizar rutas en mapa interactivo
- Dibujar rutas al crear/editar
- Agregar waypoints
- Marcar punto de encuentro
- Carga de archivos GPX

## 🌍 Internacionalización

Soporte para español e inglés usando `next-intl`:

- Los archivos de traducción están en `messages/es.json` y `messages/en.json`
- Las rutas usan prefijo de locale: `/es/routes` o `/en/routes`
- Cambio de idioma con LanguageSwitcher component

## 🎨 Estilo y UI

- **Tailwind CSS**: Framework CSS utility-first
- **shadcn/ui**: Componentes UI accesibles y personalizables
- **Radix UI**: Componentes primitivos sin estilos
- **Lucide React**: Iconos modernos

### Temas

Soporta modo claro y oscuro (configurado en `app/globals.css`)

## 📝 Convenciones de Código

### ⚠️ IMPORTANTE

- **TODO el código en INGLÉS**: variables, funciones, clases, tablas DB, columnas, archivos
- **Comentarios y documentación en ESPAÑOL**: comentarios en código, README
- **UI text con i18n**: usar sistema de traducción para español/inglés

### Ejemplos

```typescript
// ✅ CORRECTO
const userName = "John"; // Nombre del usuario
const createRoute = () => {} // Crear nueva ruta
const MAX_PARTICIPANTS = 20; // Número máximo de participantes

// ❌ INCORRECTO
const nombreUsuario = "John"; // User name
const crearRuta = () => {} // Create new route
const MAX_PARTICIPANTES = 20; // Maximum participants
```

## 🧪 Testing

```bash
# Ejecutar type checking
npm run type-check

# Ejecutar linter
npm run lint
```

## 🚢 Deployment

### Vercel (Recomendado)

1. Conecta tu repositorio en [Vercel](https://vercel.com)
2. Configura las variables de entorno
3. Deploy automático en cada push

### Build para producción

```bash
npm run build
npm run start
```

## 📚 Scripts Disponibles

```bash
npm run dev          # Modo desarrollo
npm run build        # Build para producción
npm run start        # Ejecutar build de producción
npm run lint         # Ejecutar ESLint
npm run type-check   # Verificar tipos TypeScript
```

## 🔧 Configuración Adicional

### Mapbox

Para usar las funcionalidades de mapas:

1. Crea una cuenta en [Mapbox](https://www.mapbox.com)
2. Obtén tu Access Token
3. Agrégalo a `.env.local` como `NEXT_PUBLIC_MAPBOX_TOKEN`

### Supabase Storage

Para subir imágenes:

1. Configura los buckets en Supabase Storage
2. Ajusta las políticas de acceso (público o privado)
3. Usa los helpers en `lib/utils/` para subir archivos

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto es de código abierto y está disponible bajo la licencia MIT.

## 👥 Autores

- **GEPRES Team** - Desarrollo inicial

## 🙏 Agradecimientos

- Comunidad de trekking en Perú
- Supabase por el excelente BaaS
- Vercel por Next.js
- shadcn por los componentes UI

## 📞 Soporte

Si tienes preguntas o necesitas ayuda:

- Abre un issue en GitHub
- Contacta al equipo de desarrollo

---

**¡Felices Trekkings! 🥾⛰️**
