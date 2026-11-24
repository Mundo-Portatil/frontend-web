# Mejoras de gestión administrativa

Rama `feature/mejoras-gestion-administrativa`, creada desde `develop` sincronizado con `origin/develop`. Los cambios de Inventario permanecen en sus ramas y commits originales.

## Usuarios: ubicación física pendiente de backend

La tabla mantiene Nombre, Correo, Rol, Estado y Acciones, sustituyendo únicamente Actualizado por Ubicación física. `updatedAt` permanece en el modelo y en el contrato. Actualmente se muestra Sin asignar: el backend revisado no dispone de una asignación persistida.

Se contrastaron `backend-api` (checkout `refact/inventario`), `prisma/schema.prisma`, CreateUserHttpDto, UpdateUserHttpDto y UserResponseDto. User no tiene locationId ni relación Location; los DTO tampoco admiten ubicación. No se añaden controles de asignación que aparenten guardar ni almacenamiento local.

Para habilitar la función se requiere autorización y trabajo en backend:

- Relación opcional User.locationId -> Location.id y relación inversa, conservando usuarios existentes sin asignación. Requiere migración.
- Extender POST /users y PATCH /users/:id para aceptar locationId opcional, validar existencia y estado activo, y definir cómo desasignar (por ejemplo null).
- Devolver locationId y nombre de la ubicación en GET /users y respuestas de creación/edición. Definir el comportamiento de asignaciones a ubicaciones posteriormente desactivadas; se recomienda conservar la referencia y permitir cambiarla por una activa.
- Mantener la asignación exclusiva de ADMIN. PATCH /users/me no debe aceptar la ubicación ni permitir que el empleado la cambie desde su perfil.

Con ese contrato, el frontend podrá cargar ubicaciones activas desde GET /locations?active=true y persistir la selección; no se implementan restricciones de ventas ni traslados temporales.

## Bitácora y encabezado

Las traducciones se presentan mediante el mecanismo existente; los filtros y registros conservan sus identificadores originales. Las acciones desconocidas reciben una descripción neutral en español, sin atribuirles un significado no documentado.

Se retira el selector global del encabezado sin reemplazarlo por otro control. El contexto operativo antiguo no debe dejar filtros invisibles activos; los filtros locales de los módulos permanecen disponibles. Los stores y servicios compartidos siguen existiendo donde tienen consumidores.

No se modifica backend, Prisma, base de datos ni registros de auditoría. No se crean commits ni publicaciones antes de la revisión visual solicitada.
