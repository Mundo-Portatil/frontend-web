# Plan de Implementación: Fase 1 — M1 Inventario y Catálogo

**Repositorio:** `frontend-web`
**Rama:** `feature/fase-1-core`
**Fase:** 1 — M1 Inventario y Catálogo
**Estado:** Propuesto
**Documento funcional de referencia:** `Casos de Uso - MP.md` (raíz del workspace; RF-01 a RF-04, módulo M1 y Fase 1)

## 0. Documentos de referencia y estado previo

Este plan se apoya en las siguientes fuentes de verdad:

| Documento | Uso |
|---|---|
| `specs/constitution.md` | Principios, stack, arquitectura, seguridad, pruebas y convenciones obligatorias. |
| `specs/fase_0_core/spec.md` | Alcance y criterios ya implementados en los cimientos transversales. |
| `specs/fase_0_core/plan.md` | Enfoque arquitectónico y decisiones reutilizables. |
| `specs/fase_0_core/task.md` | Estado real de la infraestructura existente. |
| `specs/fase_1_core/spec.md` | Especificación funcional de referencia; estado actual: borrador pendiente de aprobación. |
| `Casos de Uso - MP.md` (raíz del workspace) | Referencia funcional disponible mientras se redacta/aprueba la Spec frontend. |
| `../backend-api/specs/fase_1_inventario/spec.md` | Referencia de alcance del backend; no sustituye la Spec del frontend. |
| `../backend-api/specs/API_CONTRACTS.md` (`origin/develop`) | Contrato de integración oficial consultado para esta actualización. |

### 0.1. Estado de la especificación funcional

`specs/fase_1_core/spec.md` ya existe como borrador y complementa la referencia funcional de casos de uso. **La implementación no debe comenzar** hasta que:

1. Se revisen y aprueben `specs/fase_1_core/spec.md` y `plan.md`.
2. Ambos documentos se incorporen a `develop`.
3. La rama `feature/fase-1-core` se actualice desde `develop`.

### 0.2. Estado de los cimientos de la Fase 0

La Fase 0 dejó implementada, en la rama `feature/fase-0-cimientos`, la infraestructura que la Fase 1 debe reutilizar:

- Instancia centralizada de Axios y manejo de errores HTTP.
- `authStore` con sesión, perfil, expiración y cierre de sesión.
- `locationStore` con la ubicación operativa en memoria.
- Guards de ruta (`ProtectedRoute`, `RoleGuard`) y visibilidad condicional (`Can`).
- Componentes de feedback (carga, vacío, error) y notificaciones.
- Servicios de usuarios, ubicaciones y bitácora.
- Router centralizado y navegación lateral tipada.
- Vitest + React Testing Library configurados.

**Prerrequisito:** la Fase 0 debe estar integrada en `develop` antes de implementar la Fase 1. Si no lo está, la rama de la Fase 1 carecerá de esos cimientos y la implementación no podría ejecutarse según este plan.

## 1. Objetivo

Definir la solución técnica del módulo **M1 — Inventario y Catálogo** del frontend de Mundo Portátil, cubriendo:

- Gestión del catálogo maestro de productos.
- Categorías dinámicas de componentes.
- Ingreso serializado individual y masivo según `HardwareItems`; el contrato no contempla consulta/edición/anulación de lotes como recurso.
- Registro de productos serializados con relación padre-hijo entre chasis y componentes internos.
- Registro de stock por cantidad para productos no serializados.
- Asignación obligatoria de la ubicación física inicial.
- Consulta de inventario por ubicación y por identificadores.
- Generación e impresión de etiquetas 1D cuando el contrato y el ADR correspondiente lo permitan.
- Soporte de captura mediante lector de códigos 1D (HID).

El resultado debe ser reutilizable por los módulos M2, M3, M4, M7 y M8, que consumen el catálogo y el stock de M1.

## 2. Enfoque arquitectónico

Se mantiene la arquitectura modular por dominios de la Fase 0. El módulo M1 vivirá en `src/modules/inventory/` y consumirá exclusivamente la infraestructura transversal existente.

Principios aplicables:

- Separación entre presentación, coordinación, dominio frontend e infraestructura HTTP.
- Reutilización de Axios, guards, feedback, notificaciones, stores transversales y utilidades.
- Sin dependencias circulares entre módulos.
- Sin lógica de negocio dentro de los componentes visuales.
- Servicios HTTP del dominio en `src/modules/inventory/services/`.
- Estado global solo para información compartida entre módulos.
- Operación **online-only** durante esta fase: la capa Offline-First sigue aplazada a la Fase 8.

### 2.1. Tecnologías

| Responsabilidad | Tecnología | Estado |
|---|---|---|
| Interfaz | React | Existente |
| Build | Vite | Existente |
| Lenguaje | TypeScript | Existente |
| Estilos | Tailwind CSS | Existente |
| Navegación | React Router | Existente |
| Estado global | Zustand | Existente |
| HTTP | Axios | Existente |
| Pruebas | Vitest + React Testing Library | Existente |

No se incorporan dependencias nuevas sin justificación y aprobación. En particular, cualquier librería de codificación de códigos de barras o de impresión térmica requiere aprobación previa (ver secciones 7 y 12).

## 3. Alcance funcional de la fase

El alcance se deriva de RF-01 a RF-04 y del detalle del módulo M1:

| ID | Capacidad | Descripción |
|---|---|---|
| F1-C01 | Catálogo maestro | Registro y consulta de `CatalogItem`. |
| F1-C02 | Categorías dinámicas | Gestión de `Category`. |
| F1-C03 | Ingreso masivo | Alta atómica de hardware serializado y componentes mediante `POST /hardware-items/batch-inbound`; no existe recurso/API CRUD de lotes. |
| F1-C04 | Productos serializados | Registro de `HardwareItem` con identificador 1D y N/S. |
| F1-C05 | Relación padre-hijo | Vinculación chasis ↔ componentes internos críticos. |
| F1-C06 | Stock por cantidad | Registro de `QuantityStock` para productos no serializados. |
| F1-C07 | Ubicación inicial | Asignación obligatoria de una ubicación activa (`locationId`) al ingresar mercancía. |
| F1-C08 | Etiquetas 1D | Obtención de datos y emisión de etiquetas individuales o masivas mediante endpoints documentados; conexión física sujeta al ADR. |
| F1-C09 | Segunda mano aprobada | Aprobación de componente usado vía `POST /hardware-items/approve-used`; el flujo de productos por pase no tiene endpoint documentado. |
| F1-C10 | Captura por lector | Lectura de códigos 1D HID reutilizable. |
| F1-C11 | Consulta de inventario | Búsqueda por chasis, N/S, producto y ubicación. |

### 3.1. Fuera de alcance

- Ventas, POS y garantías (M2).
- Traslados y transferencias (M3).
- Auditoría express (M4).
- Colas de aprobación y alertas de stock (M5).
- Hoja de vida de hardware (M6, endpoint documentado pero pendiente de confirmar su inclusión en la Spec frontend); la consulta global de bitácora existente en Fase 0 no sustituye esa vista.
- Servicio técnico (M7).
- Cierre de caja (M8).
- Persistencia offline, Dexie.js, IndexedDB y Service Workers (Fase 8).

## 4. Diseño de la solución

### 4.1. Modelo conceptual del dominio

El modelo siguiente es **conceptual** y deriva del documento de casos de uso, ajustado a los recursos y campos que sí aparecen en la sección M1 de `API_CONTRACTS.md`. Los DTO incompletos se confirmarán contra Swagger/implementación antes de implementar.

| Entidad | Responsabilidad | Campos conceptuales |
|---|---|---|
| `Category` | Categoría dinámica. | `id`, `name`, `description`, `active`, `productsCount` (en listado), `createdAt`. |
| `CatalogItem` | Ficha maestra. | `id`, `sku`, `name`, `brand`, `model`, `categoryId`, especificaciones opcionales, `isSerialized`, `minStockThreshold`, `basePrice`, `isSecondHand`, `active`, `createdAt`. |
| `HardwareItem` | Unidad física serializada, incluyendo chasis, componentes y piezas sueltas. | `id`, `serialNumber`, `catalogId`, `locationId`, `status`, `parentChassisId`, precios cuando aplican, componentes/relación padre cuando la respuesta lo incluye. |
| `QuantityStock` | Stock de producto no serializado por ubicación. | `id`, `catalogId`, ubicación, `quantity`, precios, `minStockThreshold`, `isLowStock`, `updatedAt`. |

Reglas conceptuales:

- Un producto del catálogo define si se controla por serial o por cantidad.
- El alta masiva recibe una ubicación y un arreglo `items`; el contrato no expone entidad, identificador ni operaciones de consulta/edición/anulación de lote.
- Una laptop puede tener componentes hijos con N/S propios.
- Los componentes hijos no deben existir simultáneamente como unidades independientes y como parte de un chasis.
- La ubicación inicial del ingreso es obligatoria y debe ser una ubicación activa.

### 4.2. Comunicación con el backend

Se reutiliza `src/services/api/axiosInstance.ts`. El módulo de inventario no crea instancias de Axios.

Servicios del dominio, usando los endpoints concretos del contrato:

| Servicio | Operaciones |
|---|---|
| `categoryService` | `GET /categories?active`, `POST /categories`, `PATCH /categories/:id`. |
| `catalogService` | `GET /catalog` (filtros y paginación), `GET /catalog/:id`, `POST /catalog`, `PATCH /catalog/:id`. |
| `hardwareItemService` | `POST /hardware-items`, `POST /hardware-items/batch-inbound`, `POST /hardware-items/validate-serials`, `GET /hardware-items`, `GET /hardware-items/scan/:code`, `GET /hardware-items/:id`, `PATCH /hardware-items/:id`, `PATCH /hardware-items/:id/decommission`, `POST /hardware-items/:id/children`, `DELETE /hardware-items/:id/children/:childId`, `POST /hardware-items/approve-used`. |
| `quantityStockService` | `GET /quantity-stock`, `POST /quantity-stock/inbound`, `PATCH /quantity-stock/adjust`. |
| `barcodeLabelService` | `GET /hardware-items/:id/barcode-label`, `POST /hardware-items/barcode-labels/batch`. |
| `hardwareLifecycleService` | `GET /hardware-items/:id/lifecycle` solo si la Spec frontend confirma incorporar la capacidad M6. |

Las interfaces TypeScript se limitarán a campos documentados. La ruta `GET /hardware-items/:id` aparece en el resumen de rutas, pero carece de sección descriptiva y esquema de respuesta detallado; los esquemas de listado de hardware, alta individual, parches y varias respuestas de error también son parciales. Se deberán verificar contra Swagger/DTOs de backend antes de cerrar sus modelos.

### 4.3. Gestión del estado

- El estado de la sesión y la ubicación operativa se consumen de `authStore` y `locationStore`.
- El listado, los filtros y la paginación del inventario se mantendrán como estado local de página/hook, salvo que el `spec.md` justifique un store propio.
- Si se requiere un store de dominio, vivirá en `src/modules/inventory/stores/` y no duplicará datos del servidor más allá de lo necesario para la interfaz.
- No se persiste información de inventario en almacenamiento local durante esta fase.

### 4.4. Módulo de inventario (interfaz)

Vistas previstas:

| Vista | Responsabilidad |
|---|---|
| Inventario serializado | Listado filtrable y paginado de `HardwareItem`. |
| Ingreso masivo | Formulario para `POST /hardware-items/batch-inbound`, con ubicación, `items` y componentes `children`. |
| Stock por cantidad | Listado de saldos y ajuste/ingreso según operaciones soportadas. |
| Catálogo | Listado y edición de productos maestros. |
| Categorías | Gestión de categorías dinámicas. |
| Detalle de unidad | Ficha de `HardwareItem` con sus componentes hijos. |
| Consulta scanner-first | Búsqueda rápida por código con `GET /hardware-items/scan/:code`; filtros mediante `GET /hardware-items` y `GET /quantity-stock`. |

Principios de interfaz:

- Operación tipo *scanner-first*: los campos de código deben aceptar entrada por lector HID y por teclado.
- Validación previa al envío con mensajes en español.
- Estados de carga, vacío, error y éxito reutilizando `components/feedback/` y `components/notifications/`.
- Acciones administrativas visibles solo mediante `Can` con `roles={['ADMIN']}`.
- Diseño responsive y accesible (foco visible, etiquetas asociadas, navegación por teclado).

### 4.5. Relación padre-hijo y serialización

Se implementará un editor reutilizable de componentes hijos:

- Selección de categoría/tipo de componente.
- Captura del N/S por teclado o lector.
- Validación de duplicados en el formulario y de formato cuando el contrato lo defina.
- Visualización de la relación chasis → componentes.
- Bloqueo del envío mientras existan componentes incompletos o duplicados.

El contrato representa los componentes como `HardwareItem` relacionados por `parentChassisId` y expone `components`/`parentChassis` en respuestas ilustrativas; el formulario respetará esa relación sin inventar un recurso distinto.

### 4.6. Catálogo y categorías dinámicas

- Listado con búsqueda y filtros compatibles con el contrato.
- Formulario con validaciones y estados de envío.
- Distinción visual entre productos serializados y productos por cantidad.
- Gestión de estado activo/inactivo solo para roles autorizados.
- No se inventan jerarquías de categorías si el contrato no las define.

### 4.7. Ingreso serializado masivo

El flujo `POST /hardware-items/batch-inbound` debe permitir:

1. Seleccionar `locationId` de una ubicación activa.
2. Añadir objetos `items` con `catalogId`, serie opcional y precios opcionales.
3. Añadir `children` anidados a cada item cuando corresponda.
4. Validar series duplicadas con `POST /hardware-items/validate-serials`.
5. Revisar un resumen antes de confirmar la operación atómica.
6. Enviar el DTO exacto y reflejar el arreglo de hardware/componentes devuelto.

El contrato no ofrece consulta, edición ni anulación de lotes. El ingreso masivo es una operación atómica de creación; las correcciones posteriores se hacen por las operaciones documentadas de hardware, y la baja individual usa `PATCH /hardware-items/:id/decommission` con `reason`. No modelar ni mostrar CRUD de lotes como si el backend lo soportara. La posibilidad de anular lotes completos requiere una decisión/endpoint futuro.

### 4.8. Stock por cantidad

- Registro y consulta por producto y ubicación.
- El umbral mínimo se mostrará si el contrato lo expone.
- El cálculo de alertas corresponde a M5; en esta fase solo se almacena y muestra el umbral, sin generar alertas.
- No se duplica el stock en Zustand.

### 4.9. Captura por lector de códigos 1D

Según la Constitución:

- `src/hooks/useBarcodeScanner.ts`: integración con React y captura de eventos.
- `src/services/scanner/`: lógica de infraestructura reutilizable.

La captura HID no requiere conexión ni WebSerial. Debe:

- Acumular caracteres del lector y emitir el código al detectar el terminador.
- Distinguir entrada de lector de escritura manual cuando sea posible.
- Evitar duplicados accidentales.
- Ser reutilizable por M1 y por fases posteriores.

### 4.10. Etiquetas 1D (datos contratados; impresión física sujeta a ADR)

El contrato documenta `GET /hardware-items/:id/barcode-label` y `POST /hardware-items/barcode-labels/batch`, con datos listos para etiqueta Code 128 (valor, título, resumen de especificaciones, ubicación y precio). No documenta EAN ni un protocolo/dispositivo de impresión. La Constitución (sección 11.2) exige un **ADR aprobado** para escoger WebSerial API o un servicio local por WebSocket.

Por tanto:

- La interfaz puede obtener y mostrar los datos contratados para imprimir/reimprimir, incluidos los eventos de auditoría generados por el backend.
- El envío al dispositivo **no se implementará** hasta que exista ADR; no se debe atribuir al backend la impresión física.
- Se consumirá `barcodeValue` del backend; no se codificará Code 128 localmente salvo necesidad confirmada, justificación y aprobación de dependencia.
- La reimpresión de etiquetas es la única acción de M1 permitida al personal no administrador (RF-15).

### 4.11. Segunda mano y registro por pase

El documento de casos de uso distingue dos flujos que dependen de otros módulos:

- **Alta de segunda mano aprobada:** M2 retira piezas y M5 las aprueba; el contrato sí documenta `POST /hardware-items/approve-used` para convertir un componente `SEGUNDA_MANO_PENDIENTE` en `EN_STOCK`, con `itemId`, `locationId` y `salePrice`.
- **Registro histórico por pase aprobado:** M5 valida modelos y M1 los incorpora con stock inicial cero.

En la Fase 1:

- La operación de aprobación/alta del componente usado puede integrarse mediante el endpoint documentado, sujeto a confirmación de su inclusión en la Spec frontend.
- La aprobación y la cola pertenecen a M5 (Fase 5); no se implementan aquí.
- No se creará inventario fantasma: el stock inicial de un modelo por pase debe ser cero.
- El endpoint no crea por sí solo la cola de aprobación M5 ni el flujo de extracción M2. El alta de modelo por pase con stock cero no tiene operación documentada y queda pendiente.

### 4.12. Integración con ubicaciones

- La ubicación inicial se selecciona con el selector existente de la Fase 0 o con un selector equivalente que consuma `locationStore`.
- Solo se ofrecen ubicaciones activas.
- La asignación de usuarios a ubicaciones sigue pendiente en el contrato (OD-002/OD-004 de la Fase 0); no se inventarán restricciones.
- Cambiar de ubicación operativa no altera retroactivamente la ubicación de los ítems ya registrados.

### 4.13. Autorización

| Capacidad | ADMIN | VENDEDOR | TECNICO |
|---|---|---|---|
| Consultar catálogo e inventario | Sí | Sí | Sí |
| Ingresar hardware (individual/masivo), actualizar o dar de baja | Sí | No | No |
| Ingresar o ajustar stock por cantidad | Sí | No | No |
| Crear/editar catálogo y categorías | Sí | No | No |
| Alta de segunda mano | Sí | No | No |
| Obtener datos de etiqueta individual/masiva | Sí | Sí | Sí |
| Imprimir físicamente | Sujeto a ADR/dispositivo | Sujeto a ADR/dispositivo | Sujeto a ADR/dispositivo |

Las autorizaciones se derivan de `API_CONTRACTS.md`: lecturas de categorías, catálogo, hardware y stock, escaneo y etiquetas permiten `ADMIN`, `VENDEDOR`, `TECNICO`; todas las mutaciones de categorías, catálogo, hardware y stock requieren `ADMIN`.

Reglas:

- La protección de rutas vive en `src/router/`.
- La visibilidad de acciones usa `Can` de `src/components/guards/`.
- La autorización del backend sigue siendo la definitiva; se manejan `401` y `403` con la infraestructura existente.

### 4.14. Errores y feedback

Se reutilizan:

- `asAppError` y el interceptor de respuestas de la Fase 0.
- `ErrorState`, `EmptyState`, `LoadingState`/`LoadingScreen`.
- `Notification` para éxito, advertencia y error.

Los errores de validación del backend (`message` como string o arreglo) se mapearán a los campos del formulario cuando el contrato lo permita.

## 5. Estructura del proyecto

```text
src/
├── modules/
│   └── inventory/
│       ├── pages/
│       │   ├── InventoryPage.tsx
│       │   ├── HardwareInboundPage.tsx
│       │   ├── QuantityStockPage.tsx
│       │   ├── CatalogPage.tsx
│       │   ├── CategoriesPage.tsx
│       │   └── HardwareItemDetailPage.tsx
│       ├── components/
│       │   ├── HardwareBatchInboundForm.tsx
│       │   ├── HardwareItemEditor.tsx
│       │   ├── ChildComponentsEditor.tsx
│       │   ├── CatalogForm.tsx
│       │   ├── CategoryForm.tsx
│       │   ├── InventoryFilters.tsx
│       │   └── LabelPrintAction.tsx
│       ├── hooks/
│       │   ├── useInventoryQuery.ts
│       │   ├── useHardwareInbound.ts
│       │   └── useCatalog.ts
│       ├── services/
│       │   ├── categoryService.ts
│       │   ├── catalogService.ts
│       │   ├── hardwareItemService.ts
│       │   ├── quantityStockService.ts
│       │   ├── barcodeLabelService.ts
│       │   └── inventoryQueryService.ts
│       ├── models.ts
│       ├── index.ts
│       └── validation.ts
├── hooks/
│   └── useBarcodeScanner.ts
├── services/
│   └── scanner/
├── router/
│   ├── routes.ts
│   └── index.tsx
└── components/
    └── layout/
        └── navigation.ts
```

Notas:

- `index.ts` expondrá la interfaz pública del módulo para que otros dominios la consuman sin acceder a su estructura interna.
- Los componentes visuales no realizan peticiones HTTP directas.
- No se crean `database/` ni `services/synchronization/` en esta fase.

## 6. Contratos del backend

### 6.1. Estado actual

Se verificó `backend-api/specs/API_CONTRACTS.md` desde `origin/develop` (checkout local en `develop`) y el documento incluye la sección de Fase 1. Las solicitudes protegidas usan `Authorization: Bearer <access_token>`; se reutilizan el cliente Axios y los interceptores de Fase 0. JWT ausente/expirado o sin permisos se maneja como `401`/`403` mediante la infraestructura transversal.

El contrato global indica `ValidationPipe` estricto y errores con `{ message: string | string[], error, statusCode }`; `400` representa validación, y `401`/`403` autenticación/autorización en rutas protegidas. Para errores documentados por endpoint se aplican además los estados indicados abajo. Varios endpoints de hardware no enumeran sus errores de negocio; esos estados deben verificarse en Swagger/DTOs antes de cerrar los mensajes específicos. No se crean adaptadores HTTP propios ni se envía ningún campo fuera del DTO.

#### Endpoints y contratos incorporados

| Recurso / operación | Método y ruta | Acceso | Solicitud / consulta y respuesta documentadas |
|---|---|---|---|
| Categorías | `GET /categories` | Los tres roles | Query `active?: boolean`; arreglo con `id`, `name`, `description`, `active`, `productsCount`, `createdAt`. |
| Crear categoría | `POST /categories` | `ADMIN` | `name`, `description`, `active`; respuesta categoría; `400`, `409`. |
| Actualizar categoría | `PATCH /categories/:id` | `ADMIN` | `:id` UUIDv4; body parcial `name`, `description`, `active`; `200`, `404`, `409`. |
| Catálogo | `GET /catalog` | Los tres roles | `categoryId?`, `active?`, `search?`, `page?` (1), `limit?` (50); `{ items, total, page, limit }`. Búsqueda en SKU, nombre, marca o modelo. |
| Detalle de catálogo | `GET /catalog/:id` | Los tres roles | Respuesta `{ item, categoryName, stockSummary[], totalStockOverall }`; stock resumido por ubicación. |
| Crear producto maestro | `POST /catalog` | `ADMIN` | DTO ejemplificado con `sku`, `name`, `brand`, `model`, `categoryId`, especificaciones, `isSerialized`, `minStockThreshold`, `basePrice`, `isSecondHand`, `active`; `201`, `400`, `409`. |
| Actualizar catálogo | `PATCH /catalog/:id` | `ADMIN` | Body parcial ejemplificado con `basePrice`, `minStockThreshold`, `active`; respuesta y validaciones detalladas incompletas. |
| Ingreso serializado masivo | `POST /hardware-items/batch-inbound` | `ADMIN` | `{ locationId, items: [{ catalogId, serialNumber?, costPrice?, salePrice?, children? }] }`; `201` devuelve arreglo de hardware con componentes. Código interno generado si no se envía serie. |
| Validar series | `POST /hardware-items/validate-serials` | `ADMIN` | `{ serialNumbers: string[] }` → `{ existingSerials: string[], allValid: boolean }`. |
| Alta serializada individual | `POST /hardware-items` | `ADMIN` | DTO ejemplificado con `catalogId`, `locationId`, `serialNumber?`, `costPrice?`, `salePrice?`; esquema de respuesta no detallado. |
| Consultar hardware | `GET /hardware-items` | Los tres roles | `locationId?`, `categoryId?`, `catalogItemId?`, `status?`, `condition?` (`nuevo`/`usado`), `onlyParents?`, `search?`, `page?` (1), `limit?` (50); esquema de respuesta no detallado. |
| Escanear hardware | `GET /hardware-items/scan/:code` | Los tres roles | Busca por serie/código interno; devuelve ubicación, componentes o padre; esquema ilustrativo. |
| Detalle de hardware | `GET /hardware-items/:id` | Los tres roles | Figura en el resumen de rutas, sin sección descriptiva ni DTO de respuesta. |
| Actualizar hardware | `PATCH /hardware-items/:id` | `ADMIN` | Ejemplo con `salePrice`, `locationId`, `status`; contrato no enumera el DTO completo ni respuesta. |
| Dar de baja hardware | `PATCH /hardware-items/:id/decommission` | `ADMIN` | `{ reason: string }`; transición a `DE_BAJA`; no vendido previamente. |
| Acoplar componentes | `POST /hardware-items/:id/children` | `ADMIN` | `{ childIds: string[] }`; misma ubicación, `EN_STOCK`, sin autoenlace/ciclos. |
| Desacoplar componente | `DELETE /hardware-items/:id/children/:childId` | `ADMIN` | Sin body descrito; deja `parentChassisId = null`. |
| Etiqueta individual | `GET /hardware-items/:id/barcode-label` | Los tres roles | Datos Code 128 para etiqueta; DTO de respuesta omitido en la sección individual. |
| Etiquetas por lote | `POST /hardware-items/barcode-labels/batch` | Los tres roles | `{ hardwareItemIds: string[] }` → arreglo de `hardwareItemId`, `barcodeValue`, `title`, `specsSummary`, `locationName`, `price`. |
| Aprobación de usado | `POST /hardware-items/approve-used` | `ADMIN` | `{ itemId, locationId, salePrice }` → hardware actualizado; esquema completo omitido. |
| Listar stock cantidad | `GET /quantity-stock` | Los tres roles | `locationId?`, `categoryId?`, `catalogItemId?`, `lowStock?`, `page?` (1), `limit?` (50); `{ items, total, page, limit }`, con `isLowStock`. |
| Entrada de stock | `POST /quantity-stock/inbound` | `ADMIN` | `{ catalogId, locationId, quantity, costPrice?, salePrice? }` → detalle del saldo; `201`. |
| Ajustar stock | `PATCH /quantity-stock/adjust` | `ADMIN` | `{ catalogId, locationId, newQuantity, reason }` → saldo actualizado; `200`. |
| Hoja de vida (M6) | `GET /hardware-items/:id/lifecycle` | Los tres roles | `{ hardwareItemId, serialNumber, events[] }`; capacidad documentada por backend, su inclusión en esta fase frontend requiere definición de alcance. |

Las rutas de ubicaciones ya existentes en Fase 0 (`GET /locations?active=true`) proporcionan ubicaciones seleccionables; el frontend no debe inferir una asignación de ubicación por usuario.

### 6.2. Capacidades pendientes de contrato

| Capacidad | Estado contractual / decisión pendiente |
|---|---|
| Categorías, catálogo, hardware serializado, cantidad y búsqueda | Endpoints disponibles; confirmar detalles omitidos contra Swagger y DTO reales antes de fijar tipos para detalle hardware, alta individual, parches y respuestas incompletas. |
| CRUD de entidad Lote, consulta/edición/anulación de lote | No existe endpoint ni DTO de lote. `batch-inbound` solo crea hardware en una operación masiva. RF-01 excede el soporte actual. |
| EAN y protocolo de impresión física | El contrato respalda datos para Code 128 y registra solicitud de impresión; no define EAN, dispositivo ni transporte. ADR pendiente para integración física. |
| Alta de catálogo por pase con stock cero | No hay endpoint/DTO documentado. Coordinar el contrato futuro con M5; no simularlo con otro endpoint. |
| Flujo de aprobación M5 y extracción M2 de usados | El endpoint `approve-used` integra la aprobación de un ítem ya pendiente, pero no define la cola ni la operación que lo pone en `SEGUNDA_MANO_PENDIENTE`. |
| Ciclo de vida M6 | Endpoint disponible en backend; la Spec frontend en borrador lo mantiene fuera de alcance salvo aprobación expresa para incluirlo. |
| Reglas de asignación usuario-ubicación | No documentadas; conservar la decisión pendiente de Fase 0 y no imponer restricciones. |

### 6.3. Regla de integración

Antes de implementar cualquier servicio de M1 se deberá verificar en el contrato:

- Rutas y métodos HTTP.
- DTO de entrada y respuesta.
- Campos obligatorios y opcionales.
- Tipos de identificadores.
- Parámetros de consulta, filtros y paginación.
- Códigos de error y estructura de `message`.
- Roles y permisos por endpoint.
- Semántica de anulación y de relación padre-hijo.
- DTO completos en Swagger/implementación para los endpoints cuya documentación abrevia u omite el esquema.

No se implementarán estructuras provisionales como si fueran contratos oficiales. Cualquier discrepancia se reportará y se detendrá la integración afectada.

## 7. Rutas y navegación

Propuesta sujeta al `spec.md` de la fase:

| Ruta | Vista | Acceso |
|---|---|---|
| `/inventory` | Listados serializado y por cantidad | Autenticados |
| `/inventory/inbound` | Ingreso serializado individual/masivo | `ADMIN` |
| `/inventory/stock` | Stock por cantidad y ajuste/entrada | Lectura autenticados; mutación `ADMIN` |
| `/inventory/catalog` | Catálogo maestro | Autenticados; edición `ADMIN` |
| `/inventory/categories` | Categorías | Autenticados; edición `ADMIN` |
| `/inventory/items/:id` | Detalle de unidad | Autenticados |

Toda ruta se registra en `src/router/routes.ts` y `src/router/index.tsx` con los guards correspondientes. La entrada «Inventario» se añade a `NAV_ITEMS` en el grupo `operations` y se filtra por rol.

## 8. Alcance de conectividad

**Online-only**, en coherencia con la Fase 0 y el aplazamiento de la arquitectura Offline-First a la Fase 8.

- Todas las operaciones de M1 requieren backend.
- No hay caché local del catálogo ni del stock.
- No hay colas de sincronización.
- No se presenta información simulada como si proviniera del backend.
- Ante ausencia de red se informa el error y se permite reintentar.

La excepción técnica es la captura HID del lector 1D, que no requiere red; el registro de la operación sí requiere backend.

## 9. Seguridad

- Se reutiliza el JWT en `sessionStorage` y el interceptor Bearer de la Fase 0.
- Las acciones administrativas se ocultan con `Can`, pero el backend sigue siendo la autoridad.
- No se muestran datos internos del servidor en los mensajes de error.
- No se almacena información de inventario en `localStorage`.
- Los códigos y N/S se validan en cliente como ayuda de usabilidad, nunca como sustituto de la validación del backend.
- La impresión y el escaneo se encapsulan en servicios, sin acceso directo desde componentes visuales.

## 10. Estrategia de pruebas

Se reutiliza la infraestructura de Vitest + React Testing Library de la Fase 0. No se añaden librerías de pruebas sin aprobación.

| Tipo | Alcance |
|---|---|
| Unitarias de servicios | Mapeo de DTO, parámetros de consulta, errores y paginación con la capa HTTP mockeada. |
| Unitarias de validación | Reglas de códigos, N/S, duplicados y relación padre-hijo. |
| Unitarias de hooks | `useBarcodeScanner` (acumulación, terminador, descarte de duplicados). |
| Componentes | Formulario de ingreso masivo, catálogo y categorías; editor de componentes hijos; estados de carga, vacío y error. |
| Autorización | Visibilidad de acciones con `Can` y acceso a rutas por rol. |
| Flujos | Alta masiva/individual serializada, ingreso y ajuste por cantidad, aprobación de usado cuando esté dentro de Spec, consulta filtrada y escaneo. No probar CRUD de lote inexistente. |
| Etiquetas | Parámetros/DTO para obtención individual y masiva; la impresión física queda fuera de las pruebas automatizadas hasta el ADR. |

Los servicios se prueban mockeando la capa HTTP. La verificación contra el backend real se realiza en la validación final, cuando el contrato y el entorno estén disponibles.

## 11. Secuencia de implementación

### Etapa 0 — Cierre de alcance y verificación contractual (bloqueante)

- Revisar y aprobar `specs/fase_1_core/spec.md` y trazar sus requisitos a capacidades/endpoints.
- Confirmar DTO completos, rutas, roles, filtros, paginación y errores contra el contrato/Swagger.
- Resolver con producto/backend la diferencia entre RF-01 (CRUD de lotes) y el único ingreso masivo contratado; no planificar operaciones sin endpoint.
- Confirmar el alcance de M6 (hoja de vida) y de alta de producto por pase.
- Verificar el ADR de impresión térmica y el formato/dispositivo.
- Aprobar cualquier dependencia nueva (codificación de códigos de barras).
- Si falta información, detener la implementación afectada y reportarla.

### Etapa 1 — Preparación del módulo

- Crear la estructura de `src/modules/inventory/`.
- Definir modelos TypeScript alineados al contrato.
- Registrar rutas y navegación.
- Reutilizar guards, feedback, notificaciones y utilidades.

### Etapa 2 — Catálogo y categorías

- Implementar servicios de categorías y catálogo (`GET/POST/PATCH` categorías; `GET/POST/PATCH` catálogo y detalle).
- Implementar listados, formularios y validaciones.
- Aplicar autorización de acciones.

### Etapa 3 — Productos serializados y relación padre-hijo

- Implementar consultas/listado/escaneo, alta individual y cambios/baja de `HardwareItem` según DTO confirmados.
- Implementar el ingreso masivo con `items` y `children`, y operaciones explícitas de acople/desacople.
- Implementar validación de series, el editor de componentes y captura HID.

### Etapa 4 — Ingreso masivo serializado

- Implementar el formulario de ingreso masivo de hardware serializado, ubicación inicial, resumen y confirmación.
- No incluir consulta/edición/anulación de entidad lote sin contrato; hacer seguimiento del endpoint faltante.

### Etapa 5 — Stock por cantidad

- Implementar consulta y registro por producto y ubicación.
- Integrar filtros/paginación, `lowStock`, entrada (`inbound`) y ajuste absoluto con motivo.
- Mostrar umbral y `isLowStock` recibidos; no generar alertas M5.

### Etapa 6 — Consulta de inventario

- Implementar búsqueda por chasis, N/S, producto y ubicación.
- Implementar detalle/escaneo con las formas de respuesta confirmadas en Swagger.

### Etapa 7 — Etiquetas 1D

- Integrar obtención individual y masiva de datos de etiqueta.
- Implementar la integración con el dispositivo **solo** tras el ADR aprobado.
- Restringir la reimpresión a los roles autorizados.

### Etapa 8 — Segunda mano y registro por pase

- Integrar `POST /hardware-items/approve-used` para componente pendiente si el `spec.md` confirma el alcance.
- Dejar bloqueada el alta de catálogo de productos por pase mientras no exista endpoint.
- Coordinar con M5 (Fase 5) sin implementar su cola en esta fase.
- Si el contrato futuro habilita el registro por pase, garantizar stock inicial cero; esta regla no autoriza simular hoy una operación inexistente.

### Etapa 9 — Pruebas y validación

- Implementar las pruebas definidas en la sección 10.
- Ejecutar `npm test`, `npm run lint`, `npx tsc -b` y `npm run build`.
- Verificar los criterios de aceptación del `spec.md`.
- Verificar la integración con el backend cuando el contrato y el entorno estén disponibles.
- Actualizar `task.md` solo tras verificar cada tarea.

## 12. Riesgos, bloqueos y decisiones pendientes

### 12.1. Bloqueos

| ID | Bloqueo | Impacto | Mitigación |
|---|---|---|---|
| B1 | Cobertura parcial de DTO/respuestas en algunas rutas de hardware y catálogo. | Riesgo de modelos incorrectos. | Verificar contra Swagger/DTO backend antes de fijar modelos; no inferir campos. |
| B2 | ADR de impresión térmica no aprobado. | Bloquea el envío físico al dispositivo, aunque el contrato permita obtener los datos de etiqueta. | Mantener obtención de datos separada y bloquear solo la integración física hasta el ADR. |
| B3 | Fase 0 debe estar integrada en `develop`. | La rama de Fase 1 no tendría los cimientos. | Mantener el prerrequisito del plan original. |
| B4 | `specs/fase_1_core/spec.md` está en borrador, pendiente de aprobación. | Los criterios funcionales todavía no son fuente aprobada para implementación. | Revisar y aprobarlo antes de implementar. |
| B5 | Aprobación de dependencia de codificación de códigos de barras. | Impide generar localmente imágenes Code 128/EAN. | Preferir `barcodeValue` del backend; justificar y aprobar codificación local si sigue siendo necesaria. |
| B6 | No existe endpoint CRUD de lotes, aunque RF-01 lo exige. | No se pueden consultar/editar/anular lotes desde el frontend usando el contrato actual. | Solicitar definición del backend y actualizar el plan/tareas tras publicación. |

### 12.2. Decisiones pendientes

| ID | Decisión | Impacto |
|---|---|---|
| DP-01 | Mecanismo de impresión (WebSerial vs WebSocket). | Etiquetas y reimpresión. |
| DP-02 | Librería o implementación propia para Code 128/EAN. | Dependencias y mantenimiento. |
| DP-03 | Si el backend añadirá entidad/endpoints para consultar, editar y anular lotes. | RF-01 no está soportado por el contrato actual. |
| DP-04 | Unicidad y reutilización de N/S y códigos 1D. | Validaciones y modelo. |
| DP-05 | Grado de anidamiento de categorías. | Formulario y filtros. |
| DP-06 | Granularidad del stock por cantidad (producto/ubicación/lote). | Modelo y consultas. |
| DP-07 | Si se incluirá `approve-used` en el alcance frontend de Fase 1 y qué endpoint permitirá registrar productos por pase con stock cero. | Trazabilidad de F1-C09 y dependencia M5. |
| DP-08 | Restricciones de ubicación por usuario. | Selector y validaciones. |
| DP-09 | Si `GET /hardware-items/:id/lifecycle` forma parte del alcance frontend de esta fase o se difiere con M6. | El backend lo documenta, pero el borrador frontend excluye M6. |

Ninguna de estas decisiones se resolverá por suposición dentro de la implementación.

## 13. Criterios de finalización

La Fase 1 se considerará completada cuando:

1. `specs/fase_1_core/spec.md` esté aprobado e integrado en `develop`.
2. El contrato M1 esté publicado y verificado.
3. El catálogo y las categorías estén implementados y probados.
4. El ingreso masivo serializado respete `POST /hardware-items/batch-inbound`; el CRUD de lotes solo se considera completo cuando el contrato lo soporte o la Spec ajuste formalmente RF-01.
5. La relación padre-hijo chasis ↔ componentes esté implementada y validada.
6. El stock por cantidad esté implementado.
7. La ubicación inicial obligatoria esté integrada con `locationStore`.
8. La captura por lector 1D sea reutilizable.
9. Las etiquetas 1D funcionen si el ADR y el contrato están aprobados; en caso contrario, el bloqueo esté documentado y la funcionalidad no se presente como completada.
10. La autorización por roles se aplique en rutas y acciones.
11. Los estados de carga, vacío, error y éxito sean consistentes.
12. Las pruebas definidas se ejecuten satisfactoriamente.
13. `npm test`, `npm run lint`, `npx tsc -b` y `npm run build` finalicen sin errores.
14. La implementación cumpla la Constitución y no invada módulos posteriores.

---

**Fin del plan de implementación de la Fase 1.**
