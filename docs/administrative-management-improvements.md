# Mejoras de gestión administrativa

Rama `feature/mejoras-gestion-administrativa`, creada desde `develop` sincronizado con `origin/develop`. Los cambios de Inventario permanecen en sus ramas y commits originales.

## Usuarios: asignación de ubicación implementada

La fuente vigente de esta integración es la rama `refact/logistica` de `backend-api`, consultada sin cambiarla ni modificar sus archivos. Prisma contiene `User.locationId` opcional y la relación con `Location`. CreateUserHttpDto y UpdateUserHttpDto aceptan `locationId?: string | null`; UserResponseDto devuelve `locationId` y `locationName`. El repositorio persiste la referencia y consulta el nombre relacionado en altas, ediciones y listado. `updatedAt` permanece intacto.

La tabla conserva exactamente Nombre, Correo, Rol, Estado, Ubicación física y Acciones. Muestra el nombre devuelto por el servidor y Sin asignar cuando no existe asignación. No se usa almacenamiento local ni el antiguo filtro global para asignar empleados.

### Contratos y reglas verificadas

- `GET /users`, `POST /users` y `PATCH /users/:id`: JWT y rol ADMIN. La creación y edición envían la ubicación seleccionada y muestran la respuesta persistida.
- `GET /locations?active=true`: carga de ubicaciones activas reales para los formularios.
- ADMIN: el backend fuerza ubicación nula; el formulario no ofrece una asignación incompatible.
- VENDEDOR y TECNICO: requieren una ubicación activa de tipo PUESTO; no se pueden asignar al almacén ni guardar sin puesto.
- ENCARGADO_ALMACEN: puede elegir una ubicación activa; cuando no se envía ubicación o es nula, el servidor resuelve automáticamente un Almacén Central activo. Esa opción no representa una desasignación.
- Una ubicación actual inactiva no se elimina de forma silenciosa: debe elegirse una opción válida antes de guardar según las validaciones actuales del servidor.
- `PATCH /users/me` sigue admitiendo solo los datos personales existentes. Mi perfil no incorpora edición de ubicación. No se añaden restricciones de ventas ni traslados temporales.

El impedimento contractual anterior queda resuelto. Se verifica la integración de solicitudes/respuestas y la recuperación del listado con pruebas controladas. La comprobación de persistencia contra el backend ejecutándose queda pendiente del entorno: localhost:3000 no estaba accesible durante esta intervención, también fuera del sandbox. No se modifican ni crean usuarios reales para probarlo.

## Bitácora y encabezado

Las traducciones se presentan mediante el mecanismo existente; los filtros y registros conservan sus identificadores originales. Las acciones desconocidas reciben una descripción neutral en español, sin atribuirles un significado no documentado.

Se retira el selector global del encabezado sin reemplazarlo por otro control. El contexto operativo antiguo no debe dejar filtros invisibles activos; los filtros locales de los módulos permanecen disponibles. Los stores y servicios compartidos siguen existiendo donde tienen consumidores.

No se modifica backend, Prisma, base de datos ni registros de auditoría. No se crean commits ni publicaciones antes de la revisión visual solicitada.
