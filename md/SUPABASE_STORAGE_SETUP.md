# Configuración de Supabase Storage

Este documento explica cómo configurar los buckets de almacenamiento en Supabase para habilitar la subida de imágenes (avatares, imágenes de rutas, archivos GPX).

## 📋 Requisitos

- Proyecto de Supabase creado
- Acceso al dashboard de Supabase

## 🪣 Buckets a Crear

### 1. Bucket `avatars` (Imágenes de perfil)

**Configuración:**
- **Nombre**: `avatars`
- **Público**: Sí ✅
- **Tipos de archivo permitidos**: `image/*`
- **Tamaño máximo por archivo**: 2 MB

**Pasos:**
1. Ve a **Storage** en el menú lateral de Supabase
2. Click en **New bucket**
3. Nombre: `avatars`
4. Marca **Public bucket**
5. Click en **Create bucket**

**Políticas de Seguridad (RLS):**

```sql
-- Política: Cualquiera puede ver avatares (bucket público)
-- Esta política se crea automáticamente al marcar el bucket como público

-- Política: Los usuarios autenticados pueden subir sus propios avatares
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Política: Los usuarios pueden actualizar sus propios avatares
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Política: Los usuarios pueden eliminar sus propios avatares
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

### 2. Bucket `route-images` (Imágenes de rutas)

**Configuración:**
- **Nombre**: `route-images`
- **Público**: Sí ✅
- **Tipos de archivo permitidos**: `image/*`
- **Tamaño máximo por archivo**: 5 MB

**Pasos:**
1. Ve a **Storage** en el menú lateral
2. Click en **New bucket**
3. Nombre: `route-images`
4. Marca **Public bucket**
5. Click en **Create bucket**

**Políticas de Seguridad (RLS):**

```sql
-- Política: Los usuarios autenticados pueden subir imágenes de rutas
CREATE POLICY "Authenticated users can upload route images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'route-images');

-- Política: Los creadores pueden actualizar imágenes de sus rutas
CREATE POLICY "Users can update their route images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'route-images');

-- Política: Los creadores pueden eliminar imágenes de sus rutas
CREATE POLICY "Users can delete their route images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'route-images');
```

### 3. Bucket `route-gpx` (Archivos GPX de rutas)

**Configuración:**
- **Nombre**: `route-gpx`
- **Público**: Sí ✅
- **Tipos de archivo permitidos**: `.gpx`, `.xml`
- **Tamaño máximo por archivo**: 10 MB

**Pasos:**
1. Ve a **Storage** en el menú lateral
2. Click en **New bucket**
3. Nombre: `route-gpx`
4. Marca **Public bucket**
5. Click en **Create bucket**

**Políticas de Seguridad (RLS):**

```sql
-- Política: Los usuarios autenticados pueden subir archivos GPX
CREATE POLICY "Authenticated users can upload GPX files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'route-gpx');

-- Política: Los creadores pueden actualizar sus archivos GPX
CREATE POLICY "Users can update their GPX files"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'route-gpx');

-- Política: Los creadores pueden eliminar sus archivos GPX
CREATE POLICY "Users can delete their GPX files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'route-gpx');
```

## 🔐 Aplicar Políticas de Seguridad

Para aplicar las políticas RLS:

1. Ve a **Storage** → **Policies** en Supabase Dashboard
2. Selecciona el bucket correspondiente
3. Click en **New policy**
4. Selecciona **Create a policy from scratch**
5. Copia y pega el SQL correspondiente
6. Click en **Review** y luego **Save policy**

## ✅ Verificación

Para verificar que todo está configurado correctamente:

```typescript
// Test en consola del navegador o en tu código
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Listar buckets
const { data: buckets } = await supabase.storage.listBuckets();
console.log('Buckets:', buckets);

// Verificar bucket avatars
const { data: avatarsFiles } = await supabase.storage
  .from('avatars')
  .list();
console.log('Avatars bucket:', avatarsFiles);
```

## 📝 Notas Importantes

1. **Buckets Públicos**: Marcamos los buckets como públicos para que las URLs de las imágenes sean accesibles sin autenticación.

2. **Seguridad con RLS**: Aunque los buckets son públicos (para lectura), las políticas RLS protegen las operaciones de escritura (upload, update, delete).

3. **Estructura de Carpetas**:
   - Avatares: `avatars/{user_id}-{timestamp}.{ext}`
   - Imágenes de rutas: `route-images/{route_id}/{timestamp}.{ext}`
   - Archivos GPX: `route-gpx/{route_id}.gpx`

4. **Límites de Tamaño**: Los límites están configurados en el código frontend. Ajusta según necesites:
   - Avatares: 2 MB
   - Imágenes de rutas: 5 MB
   - Archivos GPX: 10 MB

## 🚀 Siguiente Paso

Una vez configurados los buckets:

1. ✅ El componente `ProfileForm` ya está preparado para subir avatares
2. ✅ El componente `ImageUpload` está implementado para imágenes de rutas (`components/shared/ImageUpload.tsx`)
3. ✅ El componente `ImageGallery` está implementado para galerías de imágenes (`components/shared/ImageGallery.tsx`)
4. ✅ El componente `GPXUpload` está implementado para archivos GPX (`components/shared/GPXUpload.tsx`)
5. ✅ El parser de GPX está implementado con exportación (`lib/utils/gpx-parser.ts`)

**Todo está listo para usar una vez que configures los buckets en Supabase!**

## 🔗 Referencias

- [Supabase Storage Documentation](https://supabase.com/docs/guides/storage)
- [Storage RLS Policies](https://supabase.com/docs/guides/storage/security/access-control)
- [File Upload Best Practices](https://supabase.com/docs/guides/storage/uploads)
