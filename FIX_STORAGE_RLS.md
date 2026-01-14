# ⚠️ FIX: Error 403 - Row Level Security en Storage

## Problema

Error al subir imágenes:
```json
{
  "statusCode": "403",
  "error": "Unauthorized",
  "message": "new row violates row-level security policy"
}
```

## Causa

Las políticas de Row Level Security (RLS) en Supabase Storage están bloqueando las operaciones de subida de archivos.

## Solución Rápida

### Paso 1: Ve a Supabase Dashboard

1. Abre https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Ve a **Storage** en el menú lateral
4. Selecciona el bucket `route-images` (o `avatars`)

### Paso 2: Verifica que el bucket sea PÚBLICO

1. Click en el bucket `route-images`
2. Click en los 3 puntos (⋮) → **Edit bucket**
3. Asegúrate de que **Public bucket** esté activado ✅
4. Click en **Save**

### Paso 3: Agrega las Políticas RLS

Ve a **Storage** → **Policies** y ejecuta estos SQL:

#### Para bucket `route-images`:

```sql
-- Política 1: Permitir lectura pública (ver imágenes)
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'route-images');

-- Política 2: Usuarios autenticados pueden INSERTAR
CREATE POLICY "Authenticated users can upload route images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'route-images');

-- Política 3: Usuarios autenticados pueden ACTUALIZAR sus archivos
CREATE POLICY "Authenticated users can update route images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'route-images')
WITH CHECK (bucket_id = 'route-images');

-- Política 4: Usuarios autenticados pueden ELIMINAR sus archivos
CREATE POLICY "Authenticated users can delete route images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'route-images');
```

#### Para bucket `avatars`:

```sql
-- Política 1: Permitir lectura pública
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Política 2: Usuarios pueden subir su propio avatar
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Política 3: Usuarios pueden actualizar su propio avatar
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Política 4: Usuarios pueden eliminar su propio avatar
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

### Paso 4: Aplicar las Políticas

**Opción A - Desde SQL Editor:**
1. Ve a **SQL Editor** en Supabase Dashboard
2. Click en **New query**
3. Copia y pega las políticas SQL de arriba
4. Click en **Run**

**Opción B - Desde Storage Policies:**
1. Ve a **Storage** → **Policies**
2. Click en **New policy**
3. Selecciona el bucket (`route-images` o `avatars`)
4. Click en **Create policy from scratch**
5. Copia el SQL de cada política
6. Click en **Review** → **Save**

### Paso 5: Verifica la Configuración

Ejecuta esto en SQL Editor para verificar:

```sql
-- Ver todas las políticas de storage
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'objects';
```

Deberías ver las 4 políticas para cada bucket (INSERT, SELECT, UPDATE, DELETE).

## Verificación Rápida

Después de aplicar las políticas, intenta subir una imagen nuevamente. El error 403 debería desaparecer.

## Notas Importantes

1. **Buckets públicos**: Marcarlos como públicos solo permite LEER los archivos sin autenticación. Las operaciones de WRITE (INSERT, UPDATE, DELETE) siguen requiriendo autenticación gracias a las políticas RLS.

2. **Seguridad**: Las políticas permiten que usuarios autenticados suban/editen/eliminen archivos, pero solo pueden LEER públicamente. Esto es correcto para una app de rutas donde las imágenes deben ser visibles para todos.

3. **Carpetas por usuario**: Para avatares, usamos `(storage.foldername(name))[1] = auth.uid()::text` para que cada usuario solo pueda modificar sus propios archivos.

## Troubleshooting

### Si sigue sin funcionar:

1. **Verifica autenticación**: Asegúrate de estar logueado
   ```typescript
   const { data: { user } } = await supabase.auth.getUser();
   console.log('User:', user); // Debe mostrar tu usuario
   ```

2. **Verifica el bucket existe**:
   ```typescript
   const { data: buckets } = await supabase.storage.listBuckets();
   console.log('Buckets:', buckets); // Debe incluir 'route-images'
   ```

3. **Revisa las políticas**:
   - Ve a Storage → Policies
   - Asegúrate de que haya 4 políticas para cada bucket
   - Verifica que estén habilitadas (toggle verde)

4. **Borra políticas duplicadas**:
   - A veces crear políticas múltiples veces causa conflictos
   - Elimina las políticas antiguas y crea nuevas

## Alternativa: Deshabilitar RLS (NO RECOMENDADO)

⚠️ **Solo para desarrollo/testing**:

```sql
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;
```

**NO uses esto en producción**. Solo es para probar rápidamente si el problema es RLS.

Para volver a habilitar:
```sql
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
```

---

## Resumen

El error 403 se debe a que Supabase Storage tiene RLS habilitado pero sin las políticas necesarias. Aplicando las políticas SQL de arriba, los usuarios autenticados podrán subir/editar/eliminar archivos, mientras que cualquiera puede verlos (lectura pública).
