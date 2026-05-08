# Memory - Trek / GEPRES

## Contexto general

Proyecto Next.js + Supabase ubicado en `D:\PROYECTOS\gepres\trek`.

El trabajo reciente se enfocó en:

- Resolver dudas de Supabase Auth por `email rate limit exceeded`.
- Desactivar `Confirm email` y validar que el flujo de registro no dependa de `data.user && !data.session`.
- Crear flujo de traspaso de rutas entre usuarios.
- Crear base del flujo de grupos/comunidad.
- Conectar grupos con rutas.
- Agregar configuracion de grupos en `/groups/[slug]/settings`.

## Supabase Auth

Se explicó que el error:

```json
{
  "code": "over_email_send_rate_limit",
  "message": "email rate limit exceeded"
}
```

viene del limite de envio de correos de Supabase Auth.

Decision actual:

- `Confirm email` fue desactivado.
- No se requiere cambio de codigo si el registro ya maneja `authData.session`.
- Para produccion se recomienda SMTP propio o proveedor externo para no depender del limite de correos default de Supabase.

## Usuarios sin confirmar

Si `Confirm email` se desactiva, los usuarios nuevos quedan confirmados automaticamente.

Los usuarios antiguos que quedaron sin confirmar pueden requerir:

- confirmacion manual desde Supabase Dashboard, o
- script/admin action para marcarlos como confirmados, si aplica.

## Traspaso de rutas

Se implemento flujo para transferir una ruta de una cuenta a otra.

Comportamiento definido:

- Transferencia por correo o username valido.
- La ruta pasa directamente al usuario destino.
- El usuario destino ve la ruta en su listado.
- Si la ruta estaba asociada a un grupo, al transferirla queda `sin asociar`.
- Se dejo pendiente futuro flujo de notificaciones.

Archivos principales:

- `application/routes/transfer-route.usecase.ts`
- `components/routes/MyRoutesList.tsx`
- `supabase/migrations/013_transfer_route_ownership.sql`

## Grupos / Comunidad

Se implemento la base de grupos:

- Tabla `groups`.
- Tabla `group_members`.
- Tabla `group_followers`.
- Roles:
  - `owner`
  - `admin`
  - `organizer`
  - `member`
- Tipos de grupo:
  - `community`
  - `company`
- Campos extra para empresa:
  - razon social
  - RUC / codigo fiscal
  - correo
  - telefono
  - web
  - direccion
  - estado de verificacion

Migracion principal:

- `supabase/migrations/014_groups_foundation.sql`

Nota: en esa migracion se corrigio el trigger para usar `update_updated_at()` porque Supabase marco error con `update_updated_at_column()`.

## Rutas asociadas a grupos

Se agregaron campos a `routes`:

- `group_id`
- `show_creator_on_group_routes`

Flujo definido:

- En el formulario de ruta, organizador por defecto es `Mi cuenta personal`.
- Tambien puede seleccionar `Asociar a un grupo`.
- Solo se listan grupos donde el usuario puede organizar.
- En vista individual de ruta:
  - si hay grupo, se muestra como organizador el grupo.
  - opcionalmente puede mostrar "Ruta creada por [usuario]" si `show_creator_on_group_routes` esta activo.

Archivos principales:

- `components/routes/RouteFormSteps.tsx`
- `components/routes/form-steps/StepPublication.tsx`
- `lib/validations/route.schema.ts`
- `app/[locale]/routes/[id]/page.tsx`
- `types/route.types.ts`

## Vista de grupos

Se agregaron rutas/vistas:

- `/groups`
- `/groups/new`
- `/groups/[slug]`
- `/groups/[slug]/settings`

Archivos principales:

- `app/[locale]/(dashboard)/groups/page.tsx`
- `app/[locale]/(dashboard)/groups/new/page.tsx`
- `app/[locale]/groups/[slug]/page.tsx`
- `app/[locale]/(dashboard)/groups/[slug]/settings/page.tsx`
- `components/groups/GroupForm.tsx`
- `components/groups/GroupsList.tsx`
- `components/groups/FollowGroupButton.tsx`
- `components/groups/GroupSettings.tsx`

Tambien se agrego entrada `Grupos` al header autenticado.

## Configuracion de grupo

La ruta `/groups/[slug]/settings` ya no muestra placeholder.

Ahora carga `GroupSettings` y permite:

- editar nombre, slogan, descripcion;
- cambiar logo usando bucket `route-images`, carpeta `group-logos`;
- cambiar tipo comunidad/empresa;
- editar campos de empresa;
- listar miembros;
- agregar miembro por correo o username;
- cambiar rol;
- eliminar miembros;
- proteger al creador del grupo para que no sea eliminado ni degradado.

Migracion agregada:

- `supabase/migrations/015_group_member_management.sql`

Esta migracion crea RPC:

- `add_group_member_by_identifier`
- `update_group_member_role`
- `remove_group_member`

Pendiente necesario:

- Ejecutar `015_group_member_management.sql` en Supabase antes de probar agregar/cambiar miembros desde navegador.

## Emergencias en vista individual de ruta

Se movio el bloque de `Contacto de emergencia` en:

- `app/[locale]/routes/[id]/page.tsx`

Ahora debe aparecer debajo de `LiveCapacity`, con estilo del mismo grupo lateral.

## Error de navegador / Next cache

Error reportado:

```txt
Cannot find module './5611.js'
Require stack:
- .next/server/webpack-runtime.js
...
```

Diagnostico probable:

- cache `.next` desincronizada por correr build/dev con cambios recientes.

Estado:

- `npm run build` compilo correctamente y mostro la ruta `/[locale]/groups/[slug]/settings`.

Si el error sigue en dev:

1. detener `npm run dev`;
2. eliminar `.next`;
3. levantar `npm run dev` nuevamente.

## Verificaciones recientes

Ejecutado correctamente:

- `npm run type-check`
- `npm run lint`
- `npx -y react-doctor@latest . --verbose --diff`
- `npm run build`

Notas:

- Lint mantiene warnings existentes sobre `<img>` y algunos `useEffect` en archivos antiguos.
- React Doctor dio `93/100`.

## Pendientes sugeridos

- Correr migracion `015_group_member_management.sql` en Supabase.
- Probar en navegador:
  - crear grupo;
  - entrar a `/groups/[slug]/settings`;
  - editar datos;
  - subir logo;
  - agregar miembro por correo/username;
  - cambiar rol;
  - crear ruta asociada a grupo;
  - transferir ruta asociada y validar que queda sin grupo.
- Si vuelve el error de chunk, limpiar `.next`.
- Futuro: sistema de notificaciones para transferencias y seguidores de grupo.
- Futuro: validacion real/certificado para empresas.
