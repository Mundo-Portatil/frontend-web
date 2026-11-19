# Spec: Fase 1 — Inventario y Catálogo

> **Excepción autorizada por el usuario (2026-11-19):** los documentos de esta fase se registran directamente en `feature/fase-1-inventario` y se permite implementar sin incorporarlos previamente a `develop`. Solo se exceptúa ese prerrequisito; permanecen vigentes la Constitución, los contratos y el alcance definido. No se autorizan merges ni pushes.

**Rama prevista:** `feature/fase-1-inventario`
**Repositorio:** `frontend-web`
**Fase:** 1 — M1 Inventario y Catálogo
**Estado:** Autorizado para el alcance implementable
**Plan técnico:** `specs/fase_1_core/plan.md`

---

## 1. Propósito

Definir el alcance funcional del módulo de Inventario y Catálogo del frontend de Mundo Portátil. El módulo permitirá administrar categorías y el catálogo maestro, registrar y consultar inventario serializado y por cantidad, relacionar hardware padre-hijo, y obtener los datos contratados para etiquetas 1D.

La aplicación consumirá los servicios del backend como fuente de verdad. Las solicitudes, respuestas, filtros y permisos deberán respetar `backend-api/specs/API_CONTRACTS.md` en `origin/develop` y cualquier detalle que no esté especificado permanecerá pendiente de confirmación, sin inferir campos o endpoints.

### 1.1. Objetivos

- Consultar y administrar categorías dinámicas.
- Consultar y administrar el catálogo maestro de productos.
- Registrar hardware serializado en forma individual y masiva, incluida la relación entre chasis y componentes.
- Consultar inventario mediante filtros y búsqueda por escáner.
- Consultar, ingresar y ajustar stock de productos no serializados.
- Obtener datos de etiquetas individuales y masivas según el contrato.
- Reutilizar la autenticación, autorización visual, ubicación operativa, comunicación HTTP y feedback implementados en Fase 0.

### 1.2. Fuera de alcance

Esta fase no incluye:

- Ventas, POS, garantías ni cambios de hardware durante una venta (M2).
- Traslados y transferencias entre ubicaciones (M3).
- Auditoría express (M4), colas de aprobación y alertas operativas de stock bajo (M5).
- Implementar la cola de segunda mano ni el proceso que extrae un componente y lo coloca en estado pendiente (M2/M5).
- Crear productos por pase con stock cero: el contrato actual no define su operación HTTP.
- CRUD de lotes como entidad. El backend ofrece ingreso masivo atómico de hardware, pero no consulta, edición ni anulación de lotes.
- Impresión física de etiquetas o selección de protocolo/dispositivo hasta que exista un ADR aprobado.
- Codificación local EAN/Code 128 si no existe una decisión aprobada que la requiera; el backend entrega el `barcodeValue` para la etiqueta.
- Hoja de vida de hardware (M6) en esta fase, salvo que se apruebe formalmente su incorporación al alcance frontend. El endpoint existe en el contrato, pero el borrador de alcance de M1 la excluye.
- Persistencia offline, caché local y sincronización; el módulo opera online-only.
- Cambios en el backend o redefinición de sus contratos.

---

## 2. Alcance funcional

| ID | Componente | Descripción |
|---|---|---|
| F1-C01 | Catálogo maestro | Listar con filtros/paginación, consultar detalle, crear y actualizar productos. |
| F1-C02 | Categorías | Listar, crear y actualizar categorías, incluyendo su estado activo. |
| F1-C03 | Ingreso masivo | Registrar hardware serializado y componentes mediante ingreso atómico. |
| F1-C04 | Productos serializados | Registrar individualmente y consultar unidades físicas serializadas. |
| F1-C05 | Relación padre-hijo | Consultar, acoplar y desacoplar componentes de un chasis, respetando validaciones backend. |
| F1-C06 | Stock por cantidad | Consultar saldos, filtrar stock bajo, registrar entradas y aplicar ajustes absolutos con motivo. |
| F1-C07 | Ubicación inicial | Seleccionar ubicaciones activas existentes de Fase 0 para operaciones que requieren `locationId`. |
| F1-C08 | Etiquetas 1D | Solicitar datos de etiqueta individual o masiva al backend para impresión/reimpresión. |
| F1-C09 | Segunda mano aprobada | Aprobar un componente pendiente si el alcance se confirma antes de implementación; el alta por pase no está contratada. |
| F1-C10 | Captura por lector | Capturar códigos 1D HID y consultar hardware por código. |
| F1-C11 | Consulta de inventario | Buscar por chasis, N/S, producto y ubicación mediante filtros documentados. |

### 2.1. Roles

El frontend reconocerá los roles `ADMIN`, `VENDEDOR` y `TECNICO` definidos por el backend.

- Los tres roles pueden consultar categorías, catálogo, hardware y stock, realizar búsqueda por escáner y solicitar datos de etiqueta, conforme a los permisos publicados.
- Solo `ADMIN` puede crear o actualizar categorías y catálogo, registrar/actualizar/dar de baja hardware, acoplar o desacoplar componentes, ingresar o ajustar stock, validar series para ingreso, y aprobar componentes usados.
- Las rutas y acciones se restringirán visualmente mediante los guards y `Can` de Fase 0. El backend conserva la autoridad final y sus respuestas `401`/`403` deben manejarse aunque la acción se haya mostrado.

---

## 3. Historias de usuario

### US-001 — Administrar categorías

Como administrador, quiero crear, consultar y actualizar categorías para organizar los productos del catálogo.

### US-002 — Administrar catálogo maestro

Como administrador, quiero registrar y actualizar productos maestros para mantener sus datos, clasificación, precios y forma de control de inventario.

### US-003 — Consultar catálogo

Como usuario autenticado, quiero buscar y filtrar productos del catálogo para identificar el producto y revisar su ficha y existencias por ubicación.

### US-004 — Ingresar hardware serializado

Como administrador, quiero registrar uno o varios equipos serializados, incluyendo sus componentes, para incorporar existencias físicas con una ubicación definida.

### US-005 — Consultar y localizar hardware

Como usuario autenticado, quiero buscar hardware por filtros o escanear su serie/código para localizar el ítem y conocer su estado, ubicación y relación con otros componentes.

### US-006 — Relacionar componentes

Como administrador, quiero acoplar o desacoplar componentes de un chasis para mantener la composición del equipo conforme a las reglas del backend.

### US-007 — Gestionar stock no serializado

Como administrador, quiero registrar entradas y ajustes de cantidades para que las existencias físicas reflejen las operaciones del negocio.

### US-008 — Consultar niveles de stock

Como usuario autenticado, quiero consultar cantidades por ubicación y filtrar los productos bajo su umbral para reconocer su disponibilidad.

### US-009 — Obtener datos de etiquetas

Como usuario autenticado, quiero solicitar los datos de etiquetas individuales o de varios ítems para imprimir o reimprimirlas mediante el mecanismo aprobado.

### US-010 — Revisar fallos de operación

Como usuario, quiero recibir estados y mensajes claros en español cuando una consulta u operación falle, para saber si puedo corregir los datos, reintentar o solicitar acceso.

---

## 4. Requisitos funcionales

### 4.1. Categorías — F1-C01

**FR-001 — Listado de categorías**
El frontend deberá consultar `GET /categories`. Permitirá enviar el filtro opcional `active` como booleano y presentará los campos documentados: `id`, `name`, `description`, `active`, `productsCount` y `createdAt`.

**FR-002 — Creación de categoría**
El frontend deberá permitir a `ADMIN` crear categorías mediante `POST /categories`, enviando únicamente los campos definidos por el DTO (`name`, `description`, `active`) y mostrando el resultado recibido. Los errores `400` y `409` deberán presentarse sin ocultar el mensaje de validación o conflicto.

**FR-003 — Actualización de categoría**
El frontend deberá permitir a `ADMIN` actualizar una categoría mediante `PATCH /categories/:id`, con identificador UUID y los campos de actualización permitidos (`name`, `description`, `active`). La operación deberá reflejar el estado retornado. Se manejarán los errores documentados `404` y `409`, además de los errores comunes de validación/autorización.

**FR-004 — Estado lógico de categoría**
El estado activo/inactivo se representará según `active`. El frontend no ofrecerá eliminación física ni jerarquías de categorías que no aparezcan en el contrato.

### 4.2. Catálogo maestro — F1-C02

**FR-005 — Listado filtrable y paginado**
El frontend deberá consultar `GET /catalog` con los parámetros opcionales `categoryId`, `active`, `search`, `page` y `limit`. La búsqueda se corresponde con SKU, nombre, marca o modelo. Los valores por defecto documentados son `page=1` y `limit=50`. La interfaz consumirá la respuesta paginada `{ items, total, page, limit }` y no implementará paginación ficticia en cliente.

**FR-006 — Detalle de producto**
El frontend deberá consultar `GET /catalog/:id` y presentar la ficha recibida, `categoryName`, `stockSummary` por ubicación y `totalStockOverall`. No calculará sustitutos que entren en conflicto con el resumen devuelto por el backend.

**FR-007 — Creación de producto maestro**
El frontend deberá permitir a `ADMIN` crear productos mediante `POST /catalog`, utilizando los campos establecidos por el contrato: `sku`, `name`, `brand`, `model`, `categoryId`, `processor`, `ramCapacity`, `storageCapacity`, `gpu`, `screenSize`, `isSerialized`, `minStockThreshold`, `basePrice`, `isSecondHand` y `active`, según el DTO real y sus reglas de obligatoriedad. La categoría deberá ser válida y activa según el backend. Se presentarán los errores documentados `400` y `409`.

**FR-008 — Actualización de producto maestro**
El frontend deberá permitir a `ADMIN` modificar productos con `PATCH /catalog/:id`, utilizando solo propiedades permitidas por el DTO. El contrato muestra como ejemplo `basePrice`, `minStockThreshold` y `active`, pero el esquema completo no está descrito; antes de implementar el formulario se confirmará el DTO en Swagger/Backend. No se enviarán campos inferidos.

**FR-009 — Representación del tipo de control**
La interfaz distinguirá productos serializados (`isSerialized: true`) de productos administrados por cantidad (`isSerialized: false`) conforme al valor de catálogo. No transformará una clase de inventario en otra desde el frontend.

### 4.3. Hardware serializado — F1-C03

**FR-010 — Alta individual**
El frontend deberá permitir a `ADMIN` registrar un `HardwareItem` mediante `POST /hardware-items`, enviando los campos definidos (`catalogId`, `locationId`, `serialNumber` opcional, `costPrice` opcional y `salePrice` opcional), sujeto a confirmar obligatoriedad y respuesta con el DTO del endpoint. Si no se proporciona serie, se respetará la generación automática de código interno documentada por el backend.

**FR-011 — Ingreso masivo atómico**
El frontend deberá permitir a `ADMIN` enviar `POST /hardware-items/batch-inbound` con `{ locationId, items }`. Cada elemento se compondrá de los campos de hardware permitidos (`catalogId`, `serialNumber?`, `costPrice?`, `salePrice?`) y, cuando aplique, una colección `children` con sus datos de catálogo/serie/precios conforme al contrato. La interfaz mostrará un resumen de confirmación y, tras éxito, representará el arreglo de hardware y componentes devuelto.

**FR-012 — Validación previa de series**
Para el flujo de ingreso, la interfaz podrá consultar `POST /hardware-items/validate-serials` con `{ serialNumbers: string[] }` y presentar `existingSerials`/`allValid`. El resultado remoto no sustituye validaciones del backend al registrar el ingreso.

**FR-013 — Ubicación inicial**
Las operaciones de alta individual y masiva deberán recibir `locationId` según contrato. El selector consumirá ubicaciones activas de la infraestructura de Fase 0 (`GET /locations?active=true`). El frontend no asignará una ubicación fija ni deducirá restricciones por usuario que no estén documentadas.

**FR-014 — Consulta de hardware**
El frontend deberá consultar `GET /hardware-items` y soportar los filtros documentados: `locationId`, `categoryId`, `catalogItemId`, `status`, `condition` (`nuevo`/`usado`), `onlyParents`, `search`, `page` y `limit`. Los valores por defecto de paginación son 1 y 50. Como la forma de respuesta completa no aparece en el contrato escrito, la interfaz deberá ajustar el modelo al DTO verificado en Swagger antes de su implementación.

**FR-015 — Búsqueda por código escaneado**
El frontend deberá permitir enviar `GET /hardware-items/scan/:code` usando el código capturado o introducido manualmente. Presentará la ubicación y la relación padre/hijos recibidas. Un resultado no encontrado o un fallo se mostrará como estado recuperable, no como inventario vacío exitoso.

**FR-016 — Detalle de hardware**
La ruta `GET /hardware-items/:id` figura en el resumen contractual, pero no incluye descripción ni esquema de respuesta. El detalle visual se implementará una vez que el DTO se confirme; no se inventarán campos ni se asumirá que la respuesta de escaneo y la de detalle son idénticas.

**FR-017 — Actualización de hardware**
El frontend deberá permitir a `ADMIN` actualizar un ítem mediante `PATCH /hardware-items/:id`. El contrato ejemplifica `salePrice`, `locationId` y `status`, pero el DTO completo y su respuesta deben confirmarse antes de implementar los campos editables.

**FR-018 — Baja lógica de hardware**
El frontend deberá permitir a `ADMIN` solicitar `PATCH /hardware-items/:id/decommission` con `reason` obligatorio. El backend cambia el estado a `DE_BAJA` y rechaza ítems vendidos. La interfaz solicitará confirmación y motivo, y presentará el resultado/error del backend.

### 4.4. Relación padre-hijo — F1-C04

**FR-019 — Representación de relaciones**
La interfaz representará las relaciones mediante hardware y `parentChassisId`, usando `components`/`parentChassis` cuando estén incluidos en la respuesta confirmada. No creará un recurso frontend independiente que contradiga el modelo del contrato.

**FR-020 — Acoplar componentes**
Solo `ADMIN` podrá invocar `POST /hardware-items/:id/children` con `{ childIds: string[] }`. La interfaz explicará o reflejará los errores de dominio: el padre no puede ser su propio hijo, no se permiten ciclos, ambos deben compartir ubicación y estar en estado `EN_STOCK`.

**FR-021 — Desacoplar componente**
Solo `ADMIN` podrá invocar `DELETE /hardware-items/:id/children/:childId`. Tras éxito, la relación deberá actualizarse desde la respuesta o mediante una nueva consulta, respetando el comportamiento documentado de liberar el padre y mantener la ubicación del componente.

### 4.5. Stock por cantidad — F1-C05

**FR-022 — Consulta de saldos**
El frontend deberá consultar `GET /quantity-stock` con filtros opcionales `locationId`, `categoryId`, `catalogItemId`, `lowStock`, `page` y `limit`. La respuesta paginada contiene `{ items, total, page, limit }`; los elementos incluyen cantidad, ubicación, umbral e indicador `isLowStock` según contrato.

**FR-023 — Filtro de bajo stock**
Al enviar `lowStock=true`, la interfaz mostrará exclusivamente los resultados que devuelve el backend bajo esa condición. La interfaz no generará alertas, notificaciones proactivas ni reglas de M5.

**FR-024 — Entrada de cantidad**
Solo `ADMIN` podrá registrar ingreso mediante `POST /quantity-stock/inbound` con `catalogId`, `locationId`, `quantity` y los campos de precio opcionales permitidos. La interfaz presentará el saldo actualizado retornado por el backend.

**FR-025 — Ajuste de cantidad**
Solo `ADMIN` podrá ajustar mediante `PATCH /quantity-stock/adjust`, enviando `catalogId`, `locationId`, `newQuantity` y `reason`. El valor enviado representa el nuevo total absoluto y el motivo es obligatorio. La interfaz confirmará la operación y mostrará el saldo resultante.

### 4.6. Etiquetas 1D — F1-C07

**FR-026 — Datos de etiqueta individual**
Los roles `ADMIN`, `VENDEDOR` y `TECNICO` podrán solicitar `GET /hardware-items/:id/barcode-label`. El frontend usará solo la respuesta documentada/confirmada y el backend registrará el evento correspondiente. El esquema completo de respuesta debe confirmarse antes de fijar el modelo.

**FR-027 — Datos de etiquetas masivas**
Los tres roles podrán solicitar `POST /hardware-items/barcode-labels/batch` con `{ hardwareItemIds: string[] }`. La respuesta documentada contiene una lista con `hardwareItemId`, `barcodeValue`, `title`, `specsSummary`, `locationName` y `price`.

**FR-028 — Impresión física**
La solicitud y representación de datos de etiqueta no implican impresión física. La conexión al dispositivo, el formato transmitido y la codificación local se implementarán solo conforme a un ADR aprobado y a sus decisiones de formato. El contrato actual respalda Code 128; no documenta EAN ni protocolo de impresión.

### 4.7. Componente de segunda mano — F1-C08

**FR-029 — Aprobación de componente usado (alcance sujeto a confirmación)**
Si el alcance funcional de Fase 1 incluye esta operación, solo `ADMIN` podrá invocar `POST /hardware-items/approve-used` con `itemId`, `locationId` y `salePrice`. La operación corresponde a un componente ya existente en estado `SEGUNDA_MANO_PENDIENTE`; el backend lo incorpora al stock con estado `EN_STOCK`. No se implementará la cola M5 ni el flujo de extracción M2 desde esta Spec.

**FR-030 — Productos por pase**
El frontend no ofrecerá el alta de producto de catálogo por pase con stock cero hasta que exista un endpoint/DTO contractual. Esta capacidad queda como dependencia pendiente y no se simulará mediante `POST /catalog` u otra operación.

### 4.8. Estados, validación y feedback

**FR-031 — Estados de pantalla**
Las vistas con consultas u operaciones deberán representar estados de carga, éxito, vacío y error mediante los componentes reutilizables de Fase 0.

**FR-032 — Validaciones de formularios**
El frontend podrá validar campos localmente para facilitar el uso, pero el backend es la autoridad de validación. Reglas, límites, obligatoriedad y enums no documentados no se inferirán. Los errores del backend se presentarán utilizando la estructura real `message` (string o arreglo), `error` y `statusCode`.

**FR-033 — Mensajes**
Los mensajes visibles estarán en español y no expondrán trazas, consultas ni información interna del servidor. Los errores de red ofrecerán una opción de reintento cuando corresponda.

**FR-034 — Operación online-only**
Los datos de inventario se obtendrán del backend. El módulo no presentará datos simulados como reales ni conservará inventario en almacenamiento local para operar desconectado.

---

## 5. Rutas de interfaz

Rutas previstas, sujetas a la integración con el router central de Fase 0:

| Ruta | Vista | Acceso |
|---|---|---|
| `/inventory` | Consultas de inventario serializado y stock por cantidad | Usuarios autenticados |
| `/inventory/inbound` | Alta individual/masiva de hardware | `ADMIN` |
| `/inventory/items/:id` | Detalle de hardware | Usuarios autenticados; habilitar cuando se confirme DTO |
| `/inventory/stock` | Consulta, entrada y ajuste de stock por cantidad | Consulta autenticados; mutaciones `ADMIN` |
| `/inventory/catalog` | Catálogo maestro y detalle | Consulta autenticados; mutaciones `ADMIN` |
| `/inventory/categories` | Categorías | Consulta autenticados; mutaciones `ADMIN` |

La ruta de etiquetas podrá exponerse como acción contextual desde el detalle/listado; no se prescribe una ruta adicional. La navegación deberá integrarse en el router y menú existentes.

---

## 6. Integración y contratos

### 6.1. Fuente contractual

La fuente de verdad es `backend-api/specs/API_CONTRACTS.md` en `origin/develop`. Las solicitudes protegidas deben utilizar la autenticación JWT Bearer gestionada por Fase 0. El cliente HTTP centralizado y el tratamiento común de `401`, `403`, errores de red y errores de validación serán reutilizados.

El backend aplica validación estricta y devuelve errores con forma `{ message: string | string[], error, statusCode }`. El frontend enviará únicamente propiedades definidas por los DTO y respetará los enums y tipos del contrato.

### 6.2. Endpoints en alcance

| Método y ruta | Acceso | Uso funcional |
|---|---|---|
| `GET /categories` | `ADMIN`, `VENDEDOR`, `TECNICO` | Consulta de categorías; query `active?`. |
| `POST /categories` | `ADMIN` | Crear categoría. |
| `PATCH /categories/:id` | `ADMIN` | Actualizar categoría/estado. |
| `GET /catalog` | Los tres roles | Listar con `categoryId`, `active`, `search`, `page`, `limit`. |
| `GET /catalog/:id` | Los tres roles | Detalle y resumen de stock por ubicación. |
| `POST /catalog` | `ADMIN` | Crear producto maestro. |
| `PATCH /catalog/:id` | `ADMIN` | Actualizar producto maestro. |
| `POST /hardware-items` | `ADMIN` | Alta serializada individual. |
| `POST /hardware-items/batch-inbound` | `ADMIN` | Ingreso masivo atómico serializado. |
| `POST /hardware-items/validate-serials` | `ADMIN` | Validar números de serie existentes. |
| `GET /hardware-items` | Los tres roles | Listar con filtros y paginación. |
| `GET /hardware-items/scan/:code` | Los tres roles | Búsqueda por serie/código escaneado. |
| `GET /hardware-items/:id` | Los tres roles | Detalle; DTO pendiente de confirmación. |
| `PATCH /hardware-items/:id` | `ADMIN` | Actualizar hardware; DTO completo pendiente de confirmación. |
| `PATCH /hardware-items/:id/decommission` | `ADMIN` | Baja lógica con motivo. |
| `POST /hardware-items/:id/children` | `ADMIN` | Acoplar componentes. |
| `DELETE /hardware-items/:id/children/:childId` | `ADMIN` | Desacoplar componente. |
| `POST /hardware-items/approve-used` | `ADMIN` | Aprobar componente usado si se confirma su alcance. |
| `GET /hardware-items/:id/barcode-label` | Los tres roles | Obtener datos de etiqueta individual. |
| `POST /hardware-items/barcode-labels/batch` | Los tres roles | Obtener datos para etiquetas múltiples. |
| `GET /quantity-stock` | Los tres roles | Consultar saldos con filtros/paginación. |
| `POST /quantity-stock/inbound` | `ADMIN` | Ingresar cantidades. |
| `PATCH /quantity-stock/adjust` | `ADMIN` | Ajustar cantidad absoluta con motivo. |

`GET /hardware-items/:id/lifecycle` está documentado para M6, pero se mantiene fuera del alcance de esta Spec hasta que se decida incluirlo expresamente.

### 6.3. Dependencias y brechas del contrato

- El contrato no define endpoints ni DTO para listar, consultar, editar o anular lotes. El ingreso masivo no debe presentarse como CRUD de lotes.
- El contrato no define el registro de productos por pase con stock inicial cero.
- El endpoint de aprobación de usado presupone un elemento pendiente; no implementa la cola M5 ni la extracción M2.
- Deben confirmarse en Swagger/DTOs los esquemas completos de `GET /hardware-items/:id`, listado de hardware, alta individual, parches, etiquetas individuales y varias respuestas de hardware.
- El contrato respalda Code 128 para datos de etiqueta, pero no define EAN ni conexión a impresora.
- Las limitaciones se resolverán antes de implementar el flujo afectado o se mantendrán pendientes; no se crearán contratos alternativos en frontend.

---

## 7. Requisitos no funcionales

**NFR-001 — Arquitectura modular:** el código de Inventario residirá en `src/modules/inventory/`, respetará la separación de responsabilidades y no creará dependencias circulares.

**NFR-002 — Reutilización transversal:** las peticiones usarán la instancia Axios, autenticación, guards, `Can`, ubicación operativa, feedback y notificaciones existentes de Fase 0.

**NFR-003 — Seguridad:** las rutas y acciones se restringirán según roles; ningún control visual reemplaza la autorización del backend. No se almacenará inventario en `localStorage`.

**NFR-004 — Accesibilidad y adaptación:** formularios y listados deberán ser utilizables con teclado, mostrar foco visible, asociar etiquetas a controles y adaptarse a tamaños de pantalla soportados por la aplicación.

**NFR-005 — Rendimiento percibido:** los listados usarán paginación del backend cuando exista y presentarán estados de carga para operaciones asíncronas.

**NFR-006 — Operación online-only:** una operación que requiera backend no se mostrará como exitosa si no hubo confirmación del servidor.

**NFR-007 — Sin dependencias injustificadas:** no se añadirán librerías para escaneo, codificación o impresión si la infraestructura existente o la respuesta del backend cubren la necesidad, salvo aprobación documentada.

---

## 8. Criterios de aceptación

1. Un usuario autenticado puede consultar categorías y productos conforme a roles y filtros admitidos.
2. `ADMIN` puede crear/actualizar categorías y productos usando los DTO confirmados, y recibe feedback de éxito, validación y conflicto.
3. `ADMIN` puede registrar hardware individual y masivamente con una ubicación válida; el ingreso masivo envía items/componentes en la forma contratada.
4. La validación en vivo de series usa el endpoint contratado y comunica las series ya existentes.
5. Los listados de hardware y stock usan exclusivamente los filtros y la paginación disponibles en el contrato.
6. El escaneo consulta `GET /hardware-items/scan/:code` y presenta la ubicación y las relaciones devueltas.
7. El acople/desacople respeta restricciones de rol y presenta rechazos de dominio del backend.
8. La baja de hardware requiere motivo y respeta la restricción de no dar de baja ítems vendidos.
9. El stock por cantidad permite consulta, ingreso y ajuste absoluto con motivo; el filtro `lowStock` refleja resultados del backend.
10. Las operaciones de etiquetas obtienen datos desde los endpoints individual/masivo; ninguna impresión física se considera lista sin ADR aprobado.
11. Los componentes usados solo se aprueban con el endpoint documentado y dentro del alcance confirmado; no se crea flujo de cola M5.
12. Los errores comunes `400`, `401`, `403`, `404`, `409` y de red se muestran sin filtrar información sensible; los estados no documentados específicamente se confirmarán en Swagger antes de asignar comportamiento especializado.
13. Las pantallas presentan estados de carga, vacío, error y éxito coherentes con Fase 0.
14. No se implementan CRUD de lotes ni alta de productos por pase mientras no exista contrato para esas capacidades.
15. La hoja de vida M6 se mantiene fuera de la fase salvo aprobación de alcance y trazabilidad explícitas.

---

## 9. Trazabilidad con el plan

| Requisitos de esta Spec | Referencia en `plan.md` |
|---|---|
| FR-001–FR-004 | F1-C02, secciones 4.2, 4.6 y 6. |
| FR-005–FR-009 | F1-C01, secciones 4.2, 4.6 y 6. |
| FR-010–FR-018 | F1-C03/F1-C04/F1-C07/F1-C10/F1-C11, secciones 4.4–4.7 y 6. |
| FR-019–FR-021 | F1-C05, secciones 4.5 y 6. |
| FR-022–FR-025 | F1-C06, secciones 4.8 y 6. |
| FR-026–FR-028 | F1-C08, sección 4.10. |
| FR-029–FR-030 | F1-C09, sección 4.11 y decisiones DP-07. |
| FR-031–FR-034 | Secciones 4.14, 8, 9 y 10. |

---

## 10. Pendientes de definición antes de implementación

1. Acordar si RF-01 se redefine para limitarse al ingreso masivo contratado o si el backend añadirá operaciones de consulta/edición/anulación de lotes.
2. Confirmar los DTO y respuestas incompletos en Swagger/backend antes de definir modelos de frontend.
3. Resolver si la aprobación `approve-used` se incluye en la fase frontend y coordinar con la cola/flujo de M2/M5.
4. Definir el endpoint para productos por pase con stock cero si continúa siendo requisito.
5. Confirmar si la hoja de vida M6 se incorpora a la fase o permanece en su módulo/fase correspondiente.
6. Aprobar ADR para impresión física y especificar Code 128/EAN y transporte solo si ambos siguen siendo necesarios.
7. Redactar/actualizar `task.md` después de aprobar esta Spec y el plan técnico.

La implementación de cada capacidad queda sujeta al cierre de sus dependencias contractuales. Las demás capacidades con contratos completos podrán planificarse en `task.md` una vez aprobados los documentos de la fase.

---

**Fin de la especificación de la Fase 1.**
