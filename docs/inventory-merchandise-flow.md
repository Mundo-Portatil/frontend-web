# Inventario: ingreso centralizado y consulta por modelo

Decisiones solicitadas y autorizadas el 21/11/2026. Referencia vigente por instrucción expresa del usuario: checkout `backend-api` en `refact/inventario`, contrastando `specs/API_CONTRACTS.md`, controladores, DTO y casos de uso. No se cambió de rama ni se alteró la modificación local de Prisma. Este documento complementa la implementación sin marcar capacidades diferidas de `specs/fase_1_core/task.md` como terminadas.

## Organización y permisos

- **Consultar inventario:** búsqueda de modelos y unidades, disponibilidad y ubicación. Solo lectura.
- **Ingreso de mercancía:** recibir modelos nuevos o existentes; corrección de conteos como operación separada. La consulta de componentes existentes sigue disponible; su asociación y separación están temporalmente bloqueadas.
- **Productos y categorías:** fichas maestras y edición descriptiva/estado. Un modelo agrupa sus unidades; no se edita stock desde la ficha.
- **Etiquetas:** etiquetas por modelo con copias, selección individual/múltiple de unidades y reimpresión de los datos contratados.

Lecturas y etiquetas: ADMIN, ENCARGADO_ALMACEN, VENDEDOR y TECNICO. Escrituras de inventario/catálogo/categorías: ADMIN y ENCARGADO_ALMACEN, conforme a los controladores actuales. La administración de usuarios, ubicaciones y bitácora conserva sus restricciones propias.

## Recepción de mercancía

1. Seleccionar un modelo existente o preparar los datos de uno nuevo. Preparar no escribe datos.
2. Indicar cantidad y una serie por unidad cuando corresponda. No se solicitan series para productos por cantidad.
3. Revisar modelo, cantidad, series, precios opcionales y destino.
4. Confirmar: para modelos nuevos se realiza `POST /catalog` una sola vez; después `POST /inventory/inbound` con `items: [{ catalogId, quantity, hasSerialNumbers, serialNumbers?, costPrice?, salePrice? }]`.

El catálogo actual identifica el modelo mediante marca y modelo; `name` no es un campo de su API. El nombre visible se deriva para presentación. El SKU puede omitirse al crear para que el servidor lo genere; no se inventan códigos en el cliente.

La API de ingreso devuelve `batchId`, ubicación, cantidad total y resultados por modelo, con series creadas y saldo resultante. No devuelve identificadores de HardwareItem; no se reconstruyen unidades ficticias.

La validación local comprueba enteros positivos, número de series y duplicados con la misma normalización trim/mayúsculas del servidor. `POST /hardware-items/validate-serials` permite comprobar colisiones antes de crear el modelo. El backend conserva la autoridad de unicidad y validación definitiva.

### Almacén Central

El nuevo endpoint resuelve la ubicación internamente por tipo `ALMACEN_CENTRAL` activo. No se envía una ubicación elegida arbitrariamente. El frontend verifica que exista exactamente una coincidencia activa antes de preparar el ingreso para evitar la selección ambigua del primer almacén por el servidor. Los ajustes existentes conservan su selector; los traslados físicos corresponden a Logística.

### Integridad y respuestas inciertas

El ingreso actualiza QuantityStock y crea HardwareItem en una transacción. La creación de la ficha de catálogo sigue siendo una operación separada: si se crea y el ingreso es rechazado, se conserva su identificador durante el flujo para no duplicarla al corregir y reintentar.

No se reintentan automáticamente escrituras ni se permite doble envío. Tras una respuesta ambigua de red/servidor se bloquea repetir y se ofrece consultar inventario, porque el endpoint no define una clave de idempotencia. Al recargar/abandonar la página, se debe buscar el modelo ya creado; no se persisten operaciones pendientes localmente.

## Consulta y disponibilidad

`GET /catalog` busca marca, modelo o SKU. La búsqueda exacta adicional usa `GET /hardware-items/scan/:code`; un 404 de unidad no elimina modelos coincidentes. Se conserva captura HID.

`GET /catalog/:id` proporciona `totalStockOverall` y `stockSummary.totalAvailable`. En esta rama, QuantityStock representa el saldo oficial de todos los modelos, incluidos los serializados. HardwareItem identifica sus unidades: no se suma `serializedCount` al saldo. Este cambio respecto a la regla anterior fue confirmado expresamente por el usuario. Carga, error y ausencia de datos nunca se convierten en cero ficticio.

La ficha ofrece consulta paginada de unidades con `GET /hardware-items` e historial contextual mediante `GET /hardware-items/:id/lifecycle`; se verificaron los DTO y filtros en `refact/inventario`. No se añade un módulo M6 ni escrituras de stock en la ficha.

## Etiquetas

`POST /inventory/barcode-labels/by-model` acepta `catalogId`, `copies` (1–100) y `locationId` opcional; sin ubicación el servidor resuelve Central. Se presenta el código devuelto (SKU), título, características pertinentes, ubicación y número de copia. No se modifica el formato ni se incluye el precio en la vista.

Para unidades se conserva `POST /hardware-items/barcode-labels/batch`, selección múltiple y reimpresión. La generación de datos no se presenta como impresión física realizada. El dispositivo/protocolo requiere su ADR previo.

## Dependencias y límites explícitos

- **Componentes:** el nuevo ingreso no acepta hijos ni relación padre-hijo y desaparecieron las rutas de acoplar/desacoplar. Por autorización expresa, se bloquean esas escrituras temporalmente; no se eliminan las relaciones existentes ni sus consultas. Backend debe definir una recepción que preserve la asociación y los saldos atómicamente, o restaurar operaciones compatibles.
- **Idempotencia:** faltan clave de idempotencia y consulta de resultado por clave para resolver reenvíos ambiguos; ficha + ingreso tampoco constituyen una única transacción.
- **Almacén principal:** hace falta una referencia única si se permiten varios centrales activos.
- **Impresión física y prefijos por categoría:** requieren ADR/contrato de formato y compatibilidad con lectores antes de cambiar códigos o integrar dispositivos.
- **Categorías de laptops:** no hay discriminador contractual; se conserva el desplegable técnico opcional para cualquier modelo y sus valores existentes, sin comparar nombres de categorías.
- **Segunda mano:** existe `POST /hardware-items/approve-used` para incorporar piezas al stock. El ingreso general bloquea modelos usados para no eludir aprobación. La cola de extracción/aprobaciones M2/M5 permanece fuera de este cambio; no se simula aprobación.
- **Stock bajo:** el repositorio actual sigue filtrando `lowStock` después de paginar; el filtrado y total global requieren corrección del backend. El frontend no fabrica un total alternativo.
- **Datos antiguos:** los registros serializados anteriores deben tener su saldo coherente en QuantityStock para aparecer correctamente en el nuevo resumen. No se migran ni corrigen datos desde el frontend.

No se modificó el backend, Prisma, Supabase ni migraciones. Las comprobaciones contra un backend en ejecución se informan por separado de las pruebas con respuestas controladas.


## Referencia de usabilidad y cierre

Se revisó `origin/refact/inventario` del frontend exclusivamente mediante lectura de Git, sin checkout ni integración. Se tomaron como criterios las acciones explícitas, distinguir modelo nuevo de existente y mantener el destino visible. No se copiaron componentes ni diseño. Se conservan los avances previos de formularios compactos, cantidades visibles, estado en edición y navegación lateral.

El flujo antiguo de ingreso por lote y sus servicios sin endpoint vigente se retiraron; sus verificaciones se sustituyen por pruebas del ingreso unificado (modelo nuevo, reposición, varias series, errores y doble envío). La consulta conserva las relaciones existentes, pero no ofrece crear ni separar componentes mientras falta contrato. No se presentan formularios que aparenten poder guardar esas asociaciones.

Se añadieron límites de tiempo a las consultas auxiliares de contexto para que una consulta de ubicación no deje una serie encontrada cargando indefinidamente. La administración de usuarios reconoce el rol de almacén que ya define el backend; sus rutas continúan restringidas a ADMIN.
