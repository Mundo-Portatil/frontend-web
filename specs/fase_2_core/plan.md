# Plan de Implementación: Fase 2 — M3 Logística Interna y Movimientos

> **Estado del documento:** contrastado mediante lectura de `backend-api` en `refact/logistica` el 24/11/2026. Se mantienen los requisitos funcionales; los contratos comprobados y las brechas reales se detallan en §6 y §12. Se autoriza avanzar en la rama actual con las capacidades viables, sin esperar integración documental en `develop`. Los bloqueos técnicos afectan únicamente a sus flujos. No se autorizan commits, push, merge ni PR en esta intervención.

**Repositorio:** `frontend-web`
**Rama comprobada:** `feature/fase-2-logistica`
**Fase:** 2 — M3 Logística Interna y Movimientos
**Estado:** contrato contrastado; implementación parcial autorizada y aceptación integral pendiente de brechas backend.
**Documento funcional de referencia:** `Casos de Uso - MP.md` (RF-09, RF-02, RF-15, RF-17, RNF-02 y la Fase 2 del plan de fases) **subordinado** a la definición funcional actualizada de la Fase 2 (ver secciones 0.3 y 3)

**Convención de marcas usada en este documento**

| Marca | Significado |
|---|---|
| **Documentado** | Consta en alguno de los documentos de referencia (Constitución, casos de uso, `spec.md`/`plan.md`/`task.md` de la Fase 1 o definición funcional actualizada). |
| **Por verificar** | Depende del contrato o de la implementación real del backend, o del estado real del código de las Fases 0 y 1. No se asume. |
| **Decisión pendiente** | Requiere una decisión de producto, backend o arquitectura (ver sección 12.2). |

## 0. Documentos de referencia y estado previo

Este plan se apoya en las siguientes fuentes de verdad:

| Documento | Uso |
|---|---|
| `specs/constitution.md` | Principios, stack, arquitectura, seguridad, pruebas y convenciones obligatorias. |
| `specs/fase_0_core/spec.md`, `plan.md`, `task.md` | Alcance, decisiones y estado de los cimientos transversales (disponibles en el repositorio). |
| `specs/fase_1_core/spec.md`, `plan.md`, `task.md` | Metodología, convenciones, nivel de detalle y capacidades de Inventario reutilizables. |
| `Casos de Uso - MP.md` (raíz del workspace) | Referencia funcional general. **No prevalece** sobre la definición actualizada de la Fase 2 en lo relativo a Logística. |
| Definición funcional actualizada de la Fase 2 (M3) | Base funcional conciliada con `specs/fase_2_core/spec.md`. |
| `../backend-api/specs/API_CONTRACTS.md` (`refact/logistica`) | Fuente de verdad contractual según la Constitución (§7.1 y §16.2). Consultada y contrastada con DTOs, controladores y casos de uso. |
| `backend-api`, rama `refact/logistica` | Avances de Logística en el backend. Consultada en modo de solo lectura; no se cambia la rama ni se modifica el backend. |

### 0.1. Estado de la especificación funcional

Existe `specs/fase_2_core/spec.md`, junto al presente plan y `task.md`. El encargo actual autoriza corregir supuestos técnicos y continuar sin integrar previamente estos documentos en `develop`; las reglas funcionales no se amplían. Todas las operaciones son `Online-required`.

### 0.2. Estado de los cimientos y de las fases anteriores

La siguiente tabla distingue lo **documentado** de lo que **debe verificarse** en el código real de las ramas correspondientes. La columna «Estado» refleja únicamente lo que consta en los documentos entregados.

#### Fase 0 — Cimientos transversales

Los cimientos se comprueban contra el código actual; las referencias históricas de la Fase 1 no sustituyen esa comprobación.

| Capacidad | Estado documental | Verificación requerida |
|---|---|---|
| Instancia centralizada de Axios (`src/services/api/axiosInstance.ts`) y manejo de errores (`asAppError`) | Documentado como implementado | Confirmar manejo de `timeout` y de errores sin respuesta (relevante para el resultado desconocido de un envío, §4.9). |
| `authStore` (sesión, perfil, expiración, cierre de sesión) | Documentado como implementado | Confirmar qué campos del perfil expone (rol, ubicación asignada). |
| `locationStore` (ubicación operativa en memoria) | Documentado como implementado | Confirmar si contiene la ubicación **asignada** al empleado o solo una selección operativa. |
| RBAC: `ProtectedRoute`, `RoleGuard`, `Can` | Documentado como implementado | Confirmar que `Can` y `RoleGuard` aceptan una lista de roles configurable por constante. |
| Feedback (`LoadingState`/`LoadingScreen`, `EmptyState`, `ErrorState`) y `Notification` | Documentado como implementado | Ninguna adicional. |
| Servicios de usuarios, ubicaciones y bitácora | Documentado como implementado | Confirmar si el modelo de ubicación distingue Almacén Central de Puesto (campo de tipo) — ver DP-03. |
| Ubicación asignada a cada empleado | Confirmada en backend: perfil y estrategia JWT devuelven `locationId` y `locationName`. | Propagar los campos al modelo de sesión frontend y no confundirlos con la ubicación operativa; pruebas reales pendientes. |
| Router centralizado y navegación lateral tipada (`NAV_ITEMS`, grupo `operations`) | Documentado como implementado | Confirmar la forma de registrar rutas y entradas con filtro por rol. |
| Vitest + React Testing Library | Documentado como implementado | Ninguna adicional. |

**Base comprobada:** la rama de trabajo `feature/fase-2-logistica` ya incluye los cimientos y el Inventario actuales. No se modifica `develop`. La autorización del encargo permite comenzar con los documentos locales, sin integración documental previa.

#### Fase 1 — Inventario

El `task.md` de la Fase 1 declara implementadas y validadas las 30 tareas de su alcance implementable, y difiere expresamente otras capacidades. Para la Fase 2 la distinción es relevante:

| Capacidad reutilizable | Estado en documentos de la Fase 1 | Uso previsto en la Fase 2 |
|---|---|---|
| Catálogo y búsqueda por nombre/SKU (`GET /catalog`) y selector reutilizable de catálogo | Implementado (T1.3.x; selector mencionado en el registro de cantidades) | Selección de productos por cantidad. |
| Stock por cantidad por ubicación (`GET /quantity-stock`, filtro `locationId`) | Implementado (T1.6.x) | Consulta de disponibilidad en el origen. |
| Búsqueda por serie/código (`GET /hardware-items/scan/:code`) y captura HID (`useBarcodeScanner`, `src/services/scanner/`) | Implementado (T1.5.1) | Selección *scanner-first* de unidades serializadas. |
| Listado de hardware (`GET /hardware-items`) con filtros `locationId`, `status`, etc. | Disponible en la implementación actual; contrato de lectura contrastado | Búsqueda opcional de unidades disponibles en el origen; **no puede asumirse disponible** (DP-06). |
| Detalle de hardware (`GET /hardware-items/:id`) | Disponible en la implementación actual | No es requisito para crear una guía. |
| «Historial de unidades» / hoja de vida (`GET /hardware-items/:id/lifecycle`, M6) | Disponible actualmente | Reutilizar solo eventos logísticos para F2-C11, restringidos a ejecutores (DP-14). |
| Modelos TypeScript de Inventario (`models.ts`), servicios y hooks del módulo | Implementado | Consumo **solo mediante la interfaz pública** `src/modules/inventory/index.ts` (§4.2 y DP-05). |
| Estados de unidad (`ItemStatus`: `EN_STOCK`, `DE_BAJA`, `SEGUNDA_MANO_PENDIENTE`, entre otros) | Documentado | Solo `EN_STOCK` permite movimiento (DP-07). |

### 0.3. Reconciliación con el documento general de casos de uso

El documento `Casos de Uso - MP.md` contiene una descripción anterior de Logística. La definición actualizada de la Fase 2 tiene prioridad. En consecuencia:

| Elemento del documento general | Tratamiento en la Fase 2 |
|---|---|
| RF-09 — Traslado interno inmediato Almacén ↔ Puestos, sin confirmación del receptor | **Vigente** y es el núcleo de la fase. |
| RF-10 — Transferencia entre puestos con confirmación del receptor y **Borrador de Solicitud** | **Fuera de alcance.** No se contemplan traslados directos entre puestos, confirmación del receptor ni borradores. |
| Estado «En Tránsito», confirmar recepción, procesar pendientes | **Excluidos.** No existen estados intermedios. |
| Fase 2 del plan de fases: «borradores (DRAFT) y confirmación (COMPLETED)» | **Reemplazado** por el movimiento atómico e inmediato en un solo paso. |
| RF-15 / casos de uso del Personal: «traslados» y «transferencias» ejecutados por vendedores y técnicos | **Reemplazado:** solo Administrador y Encargado de Almacén ejecutan movimientos; vendedores y técnicos solo consultan. |
| RF-17 — Hoja de vida de hardware (M6) | Se reutilizan únicamente sus eventos logísticos en F2-C11; no se implementa M6 completo (ver §4.14). |
| RNF-02 — Bitácora inalterable | El backend la escribe; el frontend no registra eventos de auditoría. |

## 1. Objetivo

Definir la solución técnica del módulo **M3 — Logística Interna y Movimientos** del frontend de Mundo Portátil, cubriendo:

- Distribución directa e inmediata de mercadería del Almacén Central hacia un puesto de venta.
- Devolución directa e inmediata de mercadería desde un puesto hacia el Almacén Central.
- Creación de **guías de traslado mixtas** que combinan equipos serializados (por número de serie) y accesorios o periféricos por cantidad.
- Presentación del código correlativo único de la guía (`TR-XXXXXX`) generado por el backend.
- Consulta del historial de guías y de su detalle.
- Visibilidad de solo lectura acotada al puesto asignado para vendedores y técnicos.
- Restricción de la ejecución de movimientos al Administrador y al Encargado de Almacén.

El resultado debe ser una continuación natural de las Fases 0 y 1: reutiliza cimientos, catálogo, stock y lectura de códigos, y no redefine ninguno de ellos. La atomicidad, la autorización, la generación de correlativos y la persistencia de los movimientos son responsabilidad del backend; el frontend las presenta, no las reproduce.

## 2. Enfoque arquitectónico

Se mantiene la arquitectura modular por dominios de las fases anteriores. El módulo M3 vivirá en `src/modules/logistics/` (directorio fijado por la Constitución §5) y consumirá la infraestructura transversal existente.

Principios aplicables:

- Separación entre presentación, coordinación, dominio frontend e infraestructura HTTP (Constitución §3.2).
- Servicios HTTP del dominio en `src/modules/logistics/services/`; la instancia de Axios solo en `src/services/api/`.
- Sin dependencias circulares: `logistics` puede depender de la interfaz pública de `inventory`; `inventory` **no** depende de `logistics`.
- Sin acceso a la estructura interna de otros módulos: se consume únicamente lo exportado por `src/modules/inventory/index.ts` (Constitución §3.3 y §4).
- Sin lógica de negocio dentro de componentes visuales ni peticiones HTTP desde ellos.
- Estado global solo para información compartida entre módulos; el borrador de la guía es estado local de la página.
- Operación **online-only** durante esta fase: la capa Offline-First sigue aplazada a la Fase 8.
- El backend es la fuente de verdad. Las validaciones del cliente son una ayuda de usabilidad, nunca una garantía.

### 2.1. Tecnologías

| Responsabilidad | Tecnología | Estado |
|---|---|---|
| Interfaz | React | Existente |
| Build | Vite | Existente |
| Lenguaje | TypeScript | Existente |
| Estilos | Tailwind CSS | Existente |
| Navegación | React Router | Existente |
| Estado global | Zustand | Existente (sin stores nuevos previstos) |
| HTTP | Axios | Existente |
| Pruebas | Vitest + React Testing Library | Existente |

No se incorporan dependencias nuevas. En particular: no se requiere librería de formularios, de manejo de estado de servidor, de tablas, de virtualización ni de componentes de diálogo; se reutiliza lo existente. No se utiliza Dexie.js, IndexedDB ni Service Workers (Constitución §2, nota de alcance). No se utiliza `src/services/printer/` (no hay impresión en esta fase).

## 3. Alcance funcional de la fase

El alcance deriva de las tres líneas de la definición funcional actualizada de M3:

| ID | Capacidad | Descripción | Línea funcional |
|---|---|---|---|
| F2-C01 | Distribución directa | Movimiento inmediato de mercadería del Almacén Central hacia un puesto. | Distribución Directa Inmediata |
| F2-C02 | Devolución directa | Movimiento inmediato de mercadería de un puesto hacia el Almacén Central. | Distribución Directa Inmediata |
| F2-C03 | Guía mixta | Una misma guía con unidades serializadas y productos por cantidad. | Traslado Mixto |
| F2-C04 | Selección de mercancía | Captura por lector HID/teclado de N/S y selección de productos por cantidad con disponibilidad en el origen. | Traslado Mixto |
| F2-C05 | Confirmación y comprobante | Resumen previo, envío único y comprobante con el código `TR-XXXXXX` entregado por el backend. | Traslado Mixto |
| F2-C06 | Reflejo de existencias y trazabilidad | Presentar el resultado del movimiento y permitir verificar existencias en origen y destino; el registro en bitácora y hoja de vida lo hace el backend. | Traslado Mixto |
| F2-C07 | Historial de guías | Listado filtrable de guías; arreglo sin paginación. | Consulta y Visibilidad Acotada |
| F2-C08 | Detalle de guía | Cabecera, origen, destino y líneas serializadas y por cantidad. | Consulta y Visibilidad Acotada |
| F2-C09 | Visibilidad acotada por puesto | Vendedores y técnicos ven solo las guías vinculadas a su puesto asignado, en solo lectura. | Consulta y Visibilidad Acotada |
| F2-C10 | Ejecución restringida | Solo Administrador y Encargado de Almacén acceden a la creación de guías. | Distribución Directa Inmediata |

### 3.1. Fuera de alcance

- Traslados directos entre puestos, confirmación del receptor, estados «En Tránsito», borradores de solicitud y cola de pendientes.
- Anulación, edición o reversión de guías: las guías son inalterables; una corrección se haría con un movimiento nuevo (por ejemplo, una devolución).
- Ventas, POS, garantías (M2), Servicio Técnico (M7), Cierre de Caja (M8), Auditoría Express (M4) y Aprobaciones y Alertas (M5).
- Hoja de vida de hardware como vista (M6) y consulta general de bitácora más allá de la ya existente en la Fase 0.
- Impresión de guías o de etiquetas, exportaciones y reportes.
- Alertas de stock bajo y reposición automática.
- Funcionalidades offline, caché local, colas de sincronización, Dexie.js, IndexedDB y Service Workers.
- Cambios en el backend o redefinición de sus contratos.
- Cualquier funcionalidad no solicitada expresamente en la definición actualizada de la Fase 2.

### 3.2. Reglas de negocio que condicionan el frontend

| Regla | Consecuencia en el frontend |
|---|---|
| El Almacén Central abastece a los puestos; los puestos devuelven al Almacén Central. | El formulario pide primero el **tipo de movimiento** y un único puesto; el Almacén Central es siempre el otro extremo. Así, un traslado puesto → puesto es imposible por construcción. |
| No hay traslados directos entre puestos. | No se ofrece ningún control que permita elegir dos puestos. El backend valida igualmente. |
| Movimiento inmediato, sin estados intermedios ni confirmación del receptor. | No existen pantallas de recepción, pendientes ni estados de guía; el resultado exitoso es definitivo. |
| Una guía puede mezclar serializados y cantidades. | Un único borrador con dos tipos de línea y un único envío. |
| Serializados conservan identidad y trazabilidad. | Se muestra el N/S en todo punto (selección, resumen, comprobante y detalle). |
| Los agrupados actualizan existencias en origen y destino. | Se muestra la disponibilidad en el origen y, tras el éxito, el resultado devuelto por el backend. |
| Solo Administrador y Encargado de Almacén ejecutan. | Guard de ruta y `Can` con una lista de roles ejecutores centralizada (§4.13). |
| Vendedores y técnicos solo consultan lo de su ubicación asignada. | Vistas de solo lectura; el filtrado efectivo lo aplica el backend (§4.13). |
| Atomicidad, autorización, correlativos y persistencia son del backend. | El frontend no genera códigos `TR-`, no reintenta automáticamente y no confirma localmente. |

## 4. Diseño de la solución

### 4.1. Modelo conceptual del dominio

El modelo es **conceptual**: deriva de los requisitos y de los recursos documentados en la Fase 1. No constituye un DTO. Los DTOs contractuales precisos se documentan en §6.2.

| Entidad | Responsabilidad | Campos conceptuales | Origen del dato |
|---|---|---|---|
| Guía de traslado | Registro inmutable de un movimiento Almacén Central ↔ Puesto. | Código `TR-XXXXXX`; tipo de movimiento (distribución o devolución); ubicación de origen; ubicación de destino; fecha y hora; responsable; líneas. | Requisito; DTO exacto en §6.2. |
| Línea serializada | Unidad física con N/S movida en la guía. | Referencia a la unidad (`id`), N/S, producto. | `HardwareItem` (`id`, `serialNumber`, `catalogId`, `locationId`, `status`) **Documentado** en la Fase 1; forma dentro de la guía comprobada en §6.2. |
| Línea por cantidad | Producto agrupado y cantidad movida. | Referencia al producto de catálogo (`catalogId`), cantidad. | `QuantityStock` (`catalogId`, `quantity`) **Documentado** en la Fase 1; forma dentro de la guía comprobada en §6.2. |
| Ubicación | Origen o destino. | `id`, nombre, estado activo y —si existe— tipo (Almacén Central/Puesto). | Servicio de ubicaciones de la Fase 0; tipo `ALMACEN_CENTRAL | PUESTO` confirmado. |

Reglas conceptuales:

- Un producto con `isSerialized: true` solo puede incorporarse como línea serializada; uno con `isSerialized: false`, solo como línea por cantidad. El frontend no convierte un tipo en otro.
- Cada guía tiene exactamente un origen y un destino; uno de los dos es siempre el Almacén Central.
- El origen determina la disponibilidad: las unidades y cantidades elegibles son las del origen seleccionado.
- La guía no tiene estados de ciclo de vida visibles; si el contrato real devuelve un campo de estado, se verificará antes de mostrarlo (DP-12).

### 4.2. Comunicación con el backend

Se reutiliza `src/services/api/axiosInstance.ts`. El módulo no crea instancias de Axios.

Servicios del dominio (nombres propuestos; las rutas, métodos y DTO comprobados están en §6):

| Servicio | Responsabilidad | Estado contractual |
|---|---|---|
| `transferService` | Crear una guía; listar guías con filtros reales y sin paginación; obtener el detalle por UUID o código. | Contrato comprobado en §6. |
| `transferMapper` (módulo interno) | Única capa que traduce entre el borrador del frontend y el DTO real, y entre la respuesta real y los modelos de vista. | Se completa tras la Etapa 0. |

Servicios y componentes **reutilizados de otros módulos** (solo mediante interfaces públicas; documentados en la Fase 1 y **por verificar** en el código real):

| Necesidad | Reutilización | Ruta documentada |
|---|---|---|
| Ubicaciones activas | Servicio de ubicaciones de la Fase 0 | `GET /locations?active=true` |
| Resolver un N/S o código escaneado | Servicio de hardware de Inventario | `GET /hardware-items/scan/:code` |
| Buscar productos por nombre/SKU | Servicio/selector de catálogo de Inventario | `GET /catalog` |
| Disponibilidad por ubicación | Servicio de stock por cantidad de Inventario | `GET /quantity-stock` con `locationId` |
| Captura HID | `src/hooks/useBarcodeScanner.ts` y `src/services/scanner/` | — |

Si `src/modules/inventory/index.ts` no exporta alguno de estos elementos, se decide mediante DP-05 (exponerlo en la interfaz pública de Inventario o reubicarlo en `src/` si es genuinamente transversal). No se importa desde rutas internas de Inventario ni se duplica su lógica.

Los tipos TypeScript de **respuesta** del backend no se definen hasta verificar el contrato. Los tipos de **estado del formulario** sí pertenecen al frontend y se definen en la sección 4.8.

### 4.3. Gestión del estado

- La sesión y el rol se consumen de `authStore`; la ubicación asignada se consume de `authStore` o `locationStore`, según la verificación de la Etapa 0 (B3).
- El borrador de la guía, el estado de envío, los filtros son **estado local** de página/hook (`useReducer`/`useState`). No se crea un store de Zustand: el borrador no se comparte entre módulos ni debe sobrevivir a la navegación.
- No se persiste ningún dato de logística en `localStorage`, `sessionStorage` ni IndexedDB. El borrador se pierde al recargar; esto es intencional y se advierte al usuario antes de abandonar una guía con líneas (§4.8).
- No se duplican en el frontend existencias ni ubicaciones del servidor más allá de lo necesario para la pantalla; los valores de disponibilidad son una lectura puntual que puede quedar obsoleta y así se comunica.
- Si en la implementación surge la necesidad de un store de dominio, vivirá en `src/modules/logistics/stores/` y se justificará en el `spec.md`.

### 4.4. Vistas del módulo

| Vista | Responsabilidad | Quién la ve |
|---|---|---|
| Historial de guías | Listado filtrable de guías; arreglo sin paginación. | Todos los roles; el alcance lo aplica el backend. |
| Nueva guía de traslado | Flujo guiado de creación: tipo de movimiento y puesto, selección de mercancía, resumen y confirmación, comprobante. | Solo roles ejecutores. |
| Detalle de guía | Cabecera y líneas, solo lectura. | Todos los roles dentro de su alcance. |

Principios de interfaz (alineados con la Fase 1):

- Operación *scanner-first*: el campo de captura de N/S acepta lector HID y teclado.
- Mensajes y etiquetas en español; código, rutas y nombres de archivo en inglés (Constitución §13.1).
- Estados de carga, vacío, error y éxito mediante `components/feedback/` y `components/notifications/`.
- Acciones de ejecución visibles solo mediante `Can` con la constante de roles ejecutores.
- Consistencia visual con las pantallas de Inventario: mismos patrones de listado, filtros, diálogos y retorno de foco.

### 4.5. Selección de tipo de movimiento, origen y destino

La creación de una guía comienza por tres decisiones explícitas, mostradas de forma compacta en una barra superior fija del formulario:

1. **Tipo de movimiento:** «Abastecer un puesto» (Almacén Central → Puesto) o «Devolver al almacén» (Puesto → Almacén Central).
2. **Puesto:** selector de ubicaciones activas que sean puestos.
3. **Resumen de ruta** siempre visible: «Origen: [nombre] → Destino: [nombre]», con el sentido visual de la flecha según el tipo.

Reglas:

- No se preselecciona ningún puesto a partir de la ubicación operativa del usuario: la elección es siempre explícita, para prevenir errores de destino.
- El Almacén Central se identifica a partir del servicio de ubicaciones. El contrato distingue `type: ALMACEN_CENTRAL | PUESTO` (DP-03 resuelta). Si no hay forma fiable de identificarlo, la fase se detiene en este punto y se reporta; no se adivina por nombre.
- Si no se encuentra exactamente un Almacén Central activo, o no hay puestos activos, se muestra un `ErrorState`/`EmptyState` explicativo y se bloquea la creación.
- Cambiar el tipo o el puesto con líneas ya agregadas exige confirmación y **vacía las líneas**, porque la disponibilidad depende del origen.
- Solo se ofrecen ubicaciones activas, de modo coherente con la Fase 1.

### 4.6. Selección de mercancía serializada

Flujo *scanner-first* sobre capacidades de la Fase 1:

1. El usuario escanea o escribe un N/S o código interno; el captador HID es el de `useBarcodeScanner`.
2. El servicio resuelve la unidad mediante `GET /hardware-items/scan/:code` (respuesta documentada como ilustrativa en la Fase 1: **Por verificar**, incluye ubicación y relación padre/hijos).
3. El frontend aplica validaciones de **ayuda** antes de agregar la línea:
   - La unidad está en la ubicación de origen. Si no, se informa «La unidad está en [ubicación]» sin agregarla.
   - La unidad no está ya en el borrador (se ignora con aviso, sin duplicar).
   - El estado de la unidad permite movimiento. El backend solo admite `EN_STOCK` (DP-07 resuelta).
   - Relación padre/hijo (DP-08, **Decisión pendiente**): si el chasis tiene componentes, se muestran como información. Si el contrato exige o impide mover componentes por separado o junto con el chasis, la UI lo refleja; no se adopta ninguna regla por suposición.
4. Una unidad válida se agrega como línea serializada con producto y N/S visibles. Cada línea se puede quitar individualmente.
5. Tras cada captura el foco vuelve al campo de captura y se anuncia el resultado en una región `aria-live`.

La búsqueda manual reutiliza `GET /hardware-items` y el servicio actual de Inventario, con los filtros confirmados `locationId`, `status`, `search`, `page` y `limit` de ese endpoint. La paginación de hardware no implica paginación en `/transfers`. El envío serializado permanece bloqueado por B6.

### 4.7. Selección de mercancía por cantidad

1. El usuario busca un producto por nombre o SKU con el selector reutilizable de catálogo, limitado a productos con `isSerialized: false` (filtro de presentación sobre la respuesta, tal como en la Fase 1; no se inventa un parámetro de consulta).
2. Al elegir el producto se consulta la disponibilidad en el origen mediante `GET /quantity-stock` filtrado por `locationId` y `catalogItemId` (Fase 1) y se muestra «Disponible en [origen]: N».
3. El usuario ingresa una cantidad entera positiva. Como ayuda, el cliente impide valores no enteros, cero, negativos y superiores a lo disponible leído; si la lectura es incierta, advierte sin bloquear definitivamente, porque el backend decide.
4. Un mismo producto aparece una sola línea: agregar de nuevo suma o edita la cantidad existente (comportamiento visible y avisado).
5. Cada línea muestra producto, cantidad y disponibilidad leída; se puede editar la cantidad o quitar la línea.

La disponibilidad leída es puntual. Si cambia antes del envío, el backend rechazará la operación y el frontend lo comunica (§4.15); existe la acción «Revisar disponibilidad», que reconsulta stock de las líneas por cantidad y re-resuelve las unidades serializadas del borrador.

### 4.8. Formularios, borrador y validaciones

**Tipos de estado del formulario (propiedad del frontend).** Los valores son internos; el mapeo al DTO real lo realiza exclusivamente `transferMapper` tras la Etapa 0.

```ts
// models.ts (estado del formulario; NO es el contrato del backend)
export type TransferDirection = 'DISTRIBUTION' | 'RETURN';

export interface SerializedLineDraft {
  kind: 'SERIALIZED';
  hardwareItemId: string;
  serialNumber: string;
  productName: string;
}

export interface QuantityLineDraft {
  kind: 'QUANTITY';
  catalogId: string;
  productName: string;
  quantity: number;
  availableAtOrigin: number | null; // lectura puntual; null si no se pudo leer
}

export type TransferLineDraft = SerializedLineDraft | QuantityLineDraft;

export type SubmitPhase =
  | 'editing'
  | 'reviewing'
  | 'submitting'
  | 'completed'
  | 'rejected'        // el backend respondió con error: el movimiento NO se realizó
  | 'unknown';        // sin respuesta: el resultado es incierto

export interface TransferDraftState {
  direction: TransferDirection | null;
  storeLocationId: string | null;
  lines: TransferLineDraft[];
  phase: SubmitPhase;
}
```

Un reductor puro (`useTransferDraft`) gestiona las acciones: elegir tipo, elegir puesto, agregar/quitar línea serializada, agregar/editar/quitar línea por cantidad, limpiar, y transiciones de fase. Al ser puro, se prueba de forma unitaria sin red.

**Validaciones locales (ayuda de usabilidad; el backend es la autoridad):**

| Regla | Mensaje en español |
|---|---|
| Debe elegirse tipo de movimiento y puesto | «Selecciona el tipo de movimiento y el puesto.» |
| La guía debe tener al menos una línea | «Agrega al menos un producto a la guía.» |
| Origen y destino no pueden coincidir | «El origen y el destino deben ser distintos.» |
| N/S duplicado en el borrador | «Esta unidad ya está en la guía.» |
| Cantidad entera mayor que cero | «Ingresa una cantidad entera mayor que cero.» |
| Cantidad superior a lo disponible leído | «Solo hay N disponibles en [origen].» |
| Unidad que no está en el origen | «Esta unidad está en [ubicación], no en [origen].» |

Las reglas, límites y enums no documentados (por ejemplo, un máximo de líneas por guía) no se infieren: se agregan solo tras la verificación. Los errores de validación del backend (`message` como string o arreglo) se muestran sin ocultarlos y, cuando el contrato lo permita, se asocian a la línea o campo correspondiente.

**Abandono del formulario:** si el borrador tiene líneas, salir de la página (navegación interna o cierre de pestaña) solicita confirmación. El bloqueo de navegación interna depende del tipo de router de la Fase 0 (**Por verificar**); el aviso de cierre de pestaña se implementa con el evento estándar del navegador. Nada del borrador se persiste.

### 4.9. Confirmación, envío y prevención de duplicados

**Resumen previo obligatorio.** Antes de enviar se abre un diálogo de revisión con:

- Tipo de movimiento y la ruta «Origen → Destino» en tamaño destacado.
- Líneas serializadas (producto y N/S) y líneas por cantidad (producto y cantidad), agrupadas, con totales.
- Un texto claro de que el movimiento se aplica de inmediato.
- Botones con texto explícito según el tipo: «Confirmar abastecimiento» / «Confirmar devolución», y «Volver a editar».

**Envío único.** El borrador se envía en una sola operación (guía mixta atómica), construida por `transferMapper`. Para prevenir duplicados:

1. Bloqueo inmediato en cliente: un `useRef` de «envío en curso» evita un segundo disparo aunque el estado de React aún no se haya actualizado (doble clic, doble Enter, Enter del lector).
2. Los botones de confirmación quedan deshabilitados y con indicación de progreso durante `submitting`; el diálogo no puede cerrarse por accidente durante ese estado.
3. El lector de códigos se desactiva mientras el diálogo está abierto, para evitar que una lectura accidental modifique el borrador o dispare la confirmación.
4. No se hacen reintentos automáticos de la creación.

**Resultados posibles:**

| Resultado | Tratamiento |
|---|---|
| Éxito (2xx) | Fase `completed`; se muestra el comprobante con el código y los datos **devueltos por el backend**. Solo entonces el movimiento se considera realizado. |
| Rechazo del backend (4xx con respuesta) | Fase `rejected`: el movimiento **no** se realizó. Se conserva el borrador y se muestra el mensaje real (§4.15). |
| Sin respuesta (red, `timeout`, caída) o `5xx` incierto tras posible commit | Fase `unknown`: el resultado es **incierto**. Se conserva el borrador; se explica que la guía pudo haberse registrado; el botón de confirmación queda bloqueado hasta que el usuario use «Verificar en el historial», que consulta las guías más recientes de la misma ruta y responsable. Solo tras esa verificación se habilita «Reintentar», con una advertencia explícita de posible duplicación. |

Este tratamiento es necesario porque los movimientos por cantidad no son naturalmente idempotentes: un reintento ciego podría mover dos veces la misma cantidad. El backend no ofrece idempotencia de guías (DP-02); el frontend no inventa encabezados ni campos. La estrategia final de prevención de duplicados se documentará en el `spec.md`, conforme a la Constitución §9.4.

### 4.10. Actualización de existencias tras el traslado

El frontend **no calcula ni almacena** nuevas existencias: el backend debe actualizar ubicaciones y saldos. Actualmente solo actualiza la ubicación individual para seriales, sin mover su saldo oficial: B6 bloquea esa modalidad. En esta fase online-only no hay caché local que invalidar. El frontend:

1. Muestra en el comprobante lo devuelto por el backend (código, ruta, líneas).
2. Ofrece accesos directos a las vistas de Inventario existentes (`/inventory`, `/inventory/stock`) para verificar existencias en origen y destino; esas vistas consultan al backend al montarse.
3. **Opcional, sujeto a verificación:** mostrar en el comprobante los saldos resultantes de las líneas por cantidad en origen y destino, reconsultando `GET /quantity-stock` por producto y ubicación. Solo se implementa si la respuesta de creación no los incluye y la reconsulta es simple y rápida; en ningún caso se estiman por aritmética del cliente.
4. Tras un éxito, el borrador se descarta y se ofrece «Nueva guía».

### 4.11. Historial de guías

- `GET /transfers` devuelve un arreglo completo ordenado por `createdAt desc`. No admite `page`, `limit` ni devuelve `{items,total,page,limit}`; no se inventa paginación.
- Filtros reales: `fromLocationId`, `toLocationId`, `locationId` (cualquiera de los extremos), `startDate`, `endDate`. Código `TR-` se consulta mediante detalle, no como filtro del listado. No existe filtro por N/S ni responsable.
- Tabla: código, fecha, ruta, responsable y `itemsCount` como número de líneas. El listado no permite deducir cuántas son serializadas ni sumar cantidades; esos totales se obtienen del detalle.
- Ejecutores: historial global con filtro por ubicación. Vendedores/técnicos: solo puesto asignado, sin selector de alcance, con perspectiva «Recibida» / «Devuelta».
- Fechas HTTP ISO, presentación local con `Intl` en `es-PE`. Carga, vacío y error reutilizados; cancelar/descartar respuestas obsoletas.
- Con usuario no ejecutor sin `locationId`, no realizar llamadas. El backend actualmente omite el filtro en ese caso (B7); el guard frontend no sustituye la corrección de autorización en el servidor.

### 4.12. Detalle de guía

Vista de solo lectura:

- Cabecera: código `TR-XXXXXX` (con acción de copiar), tipo, origen, destino, fecha y hora, responsable (si el backend lo entrega a ese rol).
- Sección de equipos serializados: producto y N/S por unidad; condición solo si procede de una lectura real de Inventario (no incluida en detalle); totales.
- Sección de productos por cantidad: producto y cantidad.
- Sin botones de edición, anulación ni reversión.
- Datos mínimos necesarios: no se muestran precios de costo ni de venta en esta vista.
- Acceso fuera de alcance (guía de otro puesto, para un vendedor o técnico): se muestra un mensaje neutral —«No tienes acceso a esta guía o no existe»— sin confirmar la existencia de la guía. El backend devuelve `403` fuera de alcance y `404` inexistente; ambos se tratan igual.

### 4.13. Control de acceso por rol y ubicación

**Roles.** El backend define `ADMIN`, `ENCARGADO_ALMACEN`, `VENDEDOR` y `TECNICO`. La constante `LOGISTICS_EXECUTOR_ROLES` incluye `ADMIN` y `ENCARGADO_ALMACEN`, se reutiliza en rutas, menú y `Can`; los componentes no comparan roles de forma literal.

| Capacidad | Roles ejecutores | VENDEDOR / TECNICO |
|---|---|---|
| Crear guía de distribución o devolución | Sí | No |
| Consultar historial | Sí (global) | Sí (solo su puesto) |
| Ver detalle de guía | Sí | Sí (solo su puesto) |

**Visibilidad por ubicación.** El filtrado de seguridad **lo aplica el backend**. El frontend:

- No filtra en cliente una lista global para simular el alcance, ni depende de un `locationId` enviado por el cliente como mecanismo de autorización.
- Si el contrato exige o permite enviar la ubicación del usuario como parámetro, se enviará la **ubicación asignada** (nunca una elegida libremente) y se asumirá que el backend la valida (**Por verificar**, B3).
- Para usuarios no ejecutores se oculta el selector de puesto y se muestra su puesto asignado.
- Si el usuario no ejecutor no tiene ubicación asignada, se muestra un estado explicativo —«Tu usuario no tiene un puesto asignado. Contacta al administrador.»— y no se solicita ninguna consulta de movimientos.
- Se tratan `401` y `403` con la infraestructura existente, aunque la acción se haya mostrado.

Esta fase **no** impone restricciones adicionales sobre qué puesto puede abastecer un ejecutor: el Administrador y el Encargado pueden operar con cualquier puesto activo, salvo que el contrato indique lo contrario.

### 4.14. Integración con la bitácora y la hoja de vida

El frontend no escribe auditoría. El backend registra `TRANSFER_DIRECT_COMPLETED` después de confirmar la transacción; el registro contiene `transferId`, `code`, ruta, `serials`, `hardwareItemIds`, `quantitiesCount` y observaciones. La hoja de vida obtiene el evento por la serie de la unidad mediante `payload.serials`.

F2-C11 reutiliza `GET /hardware-items/scan/:code` y `GET /hardware-items/:id/lifecycle`, vía la interfaz pública de Inventario. Se presentan solo eventos `TRANSFER_DIRECT_COMPLETED`, con ruta, código, fecha y responsable cuando se entregan, y enlace al detalle. No se implementa una vista general de M6. Solo ejecutores acceden: el endpoint de hoja de vida no garantiza alcance por puesto para vendedores/técnicos (DP-14).

Verificar bitácora y hoja de vida contra backend real antes de aceptar F2-C06/F2-C11. Una caída de auditoría puede producir `5xx` después de un movimiento confirmado: conservar borrador, bloquear reenvío y verificar historial/detalle (resultado incierto), nunca asumir rollback por toda respuesta de error.

### 4.15. Errores y estados de carga

Se reutilizan `asAppError`, el interceptor de respuestas, `ErrorState`, `EmptyState`, `LoadingState`/`LoadingScreen` y `Notification`.

Mapeo de errores esperados (los códigos exactos de negocio de Logística son **Por verificar**; se asignan mensajes específicos solo tras confirmarlos):

| Situación | Presentación |
|---|---|
| `400` validación (`message` string o arreglo) | Mensajes del backend visibles; el borrador se conserva. |
| `401` | Flujo de cierre de sesión de la Fase 0. |
| `403` | «No tienes permiso para realizar esta acción.»; la guía no se crea. |
| `404` / `403` en detalle | Mensaje neutral de la sección 4.12. |
| `409` u otro rechazo de negocio (existencias insuficientes, unidad que ya no está en origen, ubicación inactiva) | Mensaje del backend; se ofrece «Revisar disponibilidad» y la guía se mantiene editable. |
| Error de red o `timeout` | Estado `unknown` de la sección 4.9, nunca «error simple»: el resultado es incierto. |
| Error al consultar historial o detalle | `ErrorState` con reintento. |

Los mensajes no exponen trazas, consultas ni detalles internos del servidor (Constitución §14).

### 4.16. Experiencia de usuario, diseño responsive y accesibilidad

**Flujo.** Un solo flujo lineal en una página, sin asistente de varios pasos: ruta (barra fija), captura de mercancía en dos paneles (equipos con N/S y productos por cantidad) y una columna o bloque de «Contenido de la guía» siempre visible con totales. El botón principal «Revisar y confirmar» se habilita solo cuando la guía es válida.

**Claridad.** Origen y destino se muestran siempre juntos y con el sentido de la flecha; las cantidades y los N/S usan tipografía legible y monoespaciada para los N/S; el código `TR-` se muestra destacado en el comprobante.

**Terminología en español:** «Guía de traslado», «Abastecer un puesto», «Devolver al almacén», «Origen», «Destino», «N/S», «Cantidad disponible», «Recibida», «Devuelta».

**Responsive.** Las pantallas de consulta (historial y detalle) se diseñan *mobile-first* porque vendedores y técnicos pueden consultar desde el celular; las tablas pasan a tarjetas apiladas en pantallas estrechas y el contenido ancho se desplaza dentro de su propio contenedor. La creación de guías está pensada para el equipo con lector HID, pero debe seguir siendo usable en pantallas medianas.

**Accesibilidad.** Foco visible; etiquetas asociadas a todos los controles; operación completa por teclado (Enter para agregar, tecla de borrar o botón accesible para quitar líneas); diálogo con atrapado de foco y retorno de foco al elemento que lo abrió (patrón ya usado en Inventario); resultados de captura anunciados en región `aria-live`; estados y errores no comunicados solo por color; mensajes de error asociados a su campo.

## 5. Estructura del proyecto

```text
src/
├── modules/
│   └── logistics/
│       ├── pages/
│       │   ├── TransferHistoryPage.tsx
│       │   ├── TransferCreatePage.tsx
│       │   └── TransferDetailPage.tsx
│       ├── components/
│       │   ├── TransferRouteSelector.tsx
│       │   ├── SerializedItemPicker.tsx
│       │   ├── QuantityItemPicker.tsx
│       │   ├── TransferLinesList.tsx
│       │   ├── TransferSummaryDialog.tsx
│       │   ├── TransferReceipt.tsx
│       │   ├── UnknownOutcomeNotice.tsx
│       │   ├── TransferHistoryFilters.tsx
│       │   ├── TransferHistoryTable.tsx
│       │   ├── TransferLinesView.tsx
│       │   └── TransferDirectionBadge.tsx
│       ├── hooks/
│       │   ├── useTransferDraft.ts
│       │   ├── useCreateTransfer.ts
│       │   ├── useOriginAvailability.ts
│       │   ├── useTransferHistory.ts
│       │   └── useTransferDetail.ts
│       ├── services/
│       │   ├── transferService.ts
│       │   └── transferMapper.ts
│       ├── models.ts
│       ├── permissions.ts
│       ├── labels.ts
│       ├── validation.ts
│       └── index.ts
├── hooks/
│   └── useBarcodeScanner.ts          # existente (Fase 1), sin modificaciones previstas
├── services/
│   └── scanner/                      # existente (Fase 1)
├── router/
│   ├── routes.ts                     # se agregan rutas de logistics
│   └── index.tsx
└── components/
    └── layout/
        └── navigation.ts             # se agrega «Logística» al grupo operations
```

Notas:

- Las pruebas se ubican junto a cada archivo (`*.test.ts`, `*.test.tsx`), como en la Fase 1.
- `index.ts` expone la interfaz pública del módulo; ningún otro módulo accede a su estructura interna.
- `labels.ts` concentra los textos de dominio en español (tipos de movimiento, etiquetas según perspectiva), para evitar cadenas duplicadas en componentes.
- No se crean `stores/`, `database/` ni `services/synchronization/` en esta fase, ni `services/printer/`.
- La única modificación esperable fuera de `logistics/` es agregar exportaciones a la interfaz pública de Inventario si hiciera falta (DP-05), además del registro de rutas y navegación.

## 6. Contratos del backend

### 6.1. Fuente contractual comprobada

Se consultaron `../backend-api/specs/API_CONTRACTS.md` (sección de distribución directa), controladores, DTOs, repositorios y casos de uso de `refact/logistica`, sin modificar backend ni cambiar su rama. Esta es la rama indicada expresamente por el usuario. El Swagger en ejecución y las verificaciones con datos reales siguen siendo evidencia de aceptación pendiente; no se confunde lectura de código con pruebas de integración.

### 6.2. Endpoints y estructuras reales

| Operación | Ruta | Roles | Respuesta |
|---|---|---|---|
| Crear movimiento | `POST /transfers/direct` | `ADMIN`, `ENCARGADO_ALMACEN` | Detalle de guía (`201`). |
| Listar | `GET /transfers` | Los cuatro roles | `TransferResponse[]`, sin paginación. |
| Consultar detalle | `GET /transfers/:id` | Los cuatro roles | Detalle por UUID o código `TR-XXXXXX`; `403` fuera de alcance y `404` inexistente. |
| Ubicaciones | `GET /locations?active=true` | Autenticados | `type` fiable `ALMACEN_CENTRAL` / `PUESTO`; no inferir nombres. |
| Resolver unidad | `GET /hardware-items/scan/:code` | Autenticados | Unidad, catálogo, ubicación y estado reales. |
| Catálogo / disponibilidad | `GET /catalog`, `GET /quantity-stock` | Autenticados | Reutilizar DTOs y servicios de Inventario; disponibilidad por `locationId` + `catalogItemId`. |
| Listar unidades / movimientos | `GET /hardware-items`, `GET /hardware-items/:id/lifecycle` | Según guard existente | Reutilizar lectura existente; F2-C11 solo ejecutores. |

Solicitud única de creación (no enviar tipo, estado, código, precios ni responsable):

```ts
interface CreateDirectTransferRequest {
  fromLocationId: string; // UUID v4
  toLocationId: string; // UUID v4
  hardwareItemIds?: string[]; // UUID v4, sin repetidos
  quantities?: Array<{ catalogId: string; quantity: number }>; // entero >= 1
  notes?: string;
}
```

Debe existir al menos una línea. Los grupos son opcionales y separados. El modo «abastecer/devolver» determina la ruta; no es una propiedad del DTO. No agregar cantidades de catálogos serializados para intentar compensar B6.

Consulta de listado: `{fromLocationId?, toLocationId?, locationId?, startDate?, endDate?}` (IDs UUID y fechas ISO). No hay filtros por código, N/S, estado, tipo ni responsable.

```ts
interface TransferResponse {
  id: string; code: string; type: 'DIRECTO'; status: 'COMPLETED';
  fromLocationId: string; fromLocationName: string | null;
  toLocationId: string; toLocationName: string | null;
  createdById: string; createdByName: string | null;
  notes: string | null; createdAt: string; updatedAt: string;
  itemsCount: number; // número de líneas, no suma de unidades
}
interface TransferItemResponse {
  id: string; catalogId: string; hardwareItemId: string | null;
  serialNumber: string | null; quantity: number;
  sku: string | null; model: string | null; brand: string | null;
}
interface TransferDetailResponse extends TransferResponse {
  items: TransferItemResponse[];
}
```

El detalle no entrega condición del producto: mostrarla únicamente si se conoce mediante una lectura real de Inventario, nunca inferirla. `createdByName` en POST actualmente contiene el rol; el GET de detalle recupera el nombre del usuario. No inventar un nombre en el comprobante.

Validaciones verificadas: ubicaciones activas/distintas, central ↔ puesto, duplicados, al menos una línea, unidades `EN_STOCK` en origen, enteros positivos y stock por cantidad suficiente al leer. Rechazos de negocio `400`, unidad inexistente `404`, JWT `401`, rol/alcance `403`. No se asume `409` como contrato de stock. Errores siguen el tratamiento común `message: string | string[]`.

### 6.3. Evidencia y límites observados

Todas las rutas siguientes son relativas a `backend-api/src/modules/`:

- `transfers/infrastructure/adapters/in/http/transfers.controller.ts` y `dto/{create-direct-transfer,query-transfers}.http-dto.ts`: rutas, guards y validadores.
- `transfers/application/dto/{transfer-response,transfer-detail-response}.dto.ts`: respuestas.
- `transfers/application/use-cases/{create-direct-transfer,get-transfers,get-transfer-detail}.use-case.ts`: validaciones, transacción, alcance y auditoría.
- `transfers/infrastructure/adapters/out/persistence/prisma-transfer.repository.ts`: arreglo sin paginación, orden descendente y filtros.
- `transfers/infrastructure/adapters/out/generators/crypto-transfer-code-generator.adapter.ts`: `TR-` + seis hexadecimales aleatorios (`randomBytes(3)`), no secuencia; unicidad protegida por esquema. BR-014 correlativo secuencial sigue pendiente.
- `auth/infrastructure/adapters/in/http/strategies/jwt.strategy.ts`: usuario actual con `locationId` y `locationName`, no selección de `locationStore`.
- `hardware-items/infrastructure/adapters/out/persistence/prisma-hardware-item.repository.ts`: eventos de hoja de vida por `payload.serials`.

No hay idempotencia contractual, validación previa remota, endpoint de anulación ni límite máximo de líneas documentado. El saldo oficial es `QuantityStock` también para modelos serializados; el código de traslados aún no lo actualiza en esa modalidad (B6). La transacción de stock por cantidad no demuestra seguridad contra consumo concurrente (B9). Auditoría fuera de transacción (B8). Véase §12 para impacto y tareas bloqueadas.

### 6.4. Regla de integración

Antes de implementar `transferService` se verificará en el contrato y/o en el código de `backend-api`:

- Rutas y métodos HTTP.
- DTO de entrada y de respuesta, campos obligatorios y opcionales, tipos de identificadores.
- Parámetros de consulta, filtros, ordenamiento y paginación.
- Códigos de error y estructura de `message`.
- Roles y permisos por endpoint y mecanismo de alcance por ubicación.
- Semántica de atomicidad y de rechazo.

No se implementarán estructuras provisionales como si fueran contratos oficiales; se usa el contraste comprobado en §6.2. Si hay discrepancia entre `API_CONTRACTS.md`, Swagger y la implementación, se solicita aclaración antes de integrar (Constitución §7.1). Cualquier discrepancia detiene únicamente la integración afectada y se reporta.

### 6.5. Lista de verificación para el contraste con `backend-api` (rama `refact/logistica`)

Para uso de OpenCode en la Etapa 0. Cada punto se responde con evidencia (archivo, controlador, DTO o prueba) y el resultado se registra en el `spec.md`:

1. ¿Existen endpoints de creación, listado y detalle de guías? ¿Cuáles son sus rutas y métodos? ¿Están en `API_CONTRACTS.md` de `origin/develop`?
2. ¿Cómo se representan las líneas mixtas en el payload de creación? ¿Se indica el tipo de movimiento de forma explícita o se infiere de origen y destino?
3. ¿Cómo se identifica el Almacén Central? ¿Existe un tipo de ubicación?
4. ¿El backend rechaza puesto → puesto, origen = destino y ubicaciones inactivas? ¿Con qué códigos y mensajes?
5. ¿Qué roles autorizan la creación? ¿Existe un rol de Encargado de Almacén o se usa `ADMIN`?
6. ¿Cómo se aplica el alcance de lectura para `VENDEDOR` y `TECNICO`? ¿Se obtiene de la ubicación asignada en el JWT o del usuario en base de datos, o se espera un parámetro? ¿Qué ocurre si no hay ubicación asignada?
7. ¿La guía de otro puesto devuelve `403` o `404`?
8. ¿Qué estados de unidad permiten el movimiento? ¿Qué sucede con chasis y componentes hijos, en ambos sentidos?
9. ¿Las cantidades deben ser enteras? ¿Hay máximo de líneas por guía?
10. ¿Qué devuelve la creación? ¿Incluye `id`, código `TR-`, fecha, responsable, ruta y líneas?
11. ¿El código `TR-XXXXXX` es numérico? ¿Se puede buscar por código en el listado?
12. ¿Qué filtros y qué orden soporta el listado? ¿Cuál es el formato de paginación?
13. ¿Existe una clave de idempotencia o detección de duplicados?
14. ¿La atomicidad cubre todo el conjunto de líneas (todo o nada)? ¿Cómo se informa el error por línea?
15. ¿Se escribe el evento en bitácora y en hoja de vida de cada unidad serializada? ¿Con qué acción y datos?
16. ¿Las respuestas de lectura incluyen datos sensibles (precios de costo) que no deban mostrarse?
17. ¿Formato y zona horaria de las fechas?
18. ¿Qué exporta realmente `src/modules/inventory/index.ts` en la rama de la Fase 1? ¿Está disponible el listado `GET /hardware-items` desde esa interfaz?
19. ¿Qué expone el perfil autenticado (`GET /auth/profile`) respecto de ubicación asignada y rol?
20. ¿Hay diferencias entre `refact/logistica`, `develop` y lo descrito en la definición funcional actualizada?

## 7. Rutas y navegación

Propuesta sujeta al `spec.md` de la fase (rutas en inglés, conforme a la Constitución §13.1):

| Ruta | Vista | Acceso |
|---|---|---|
| `/logistics` | Historial de guías | Autenticados (alcance aplicado por el backend) |
| `/logistics/new` | Nueva guía de traslado | Roles ejecutores (`LOGISTICS_EXECUTOR_ROLES`) |
| `/logistics/transfers/:id` | Detalle de guía | Autenticados, dentro de su alcance |

Toda ruta se registra en `src/router/routes.ts` y `src/router/index.tsx` con `ProtectedRoute` y, para la creación, `RoleGuard`. La entrada «Logística» se añade a `NAV_ITEMS` en el grupo `operations`, visible para los cuatro roles; la acción «Nueva guía» dentro del historial se muestra solo con `Can`. El `:id` acepta UUID o código `TR-XXXXXX`.

Tras un éxito de creación, el comprobante se muestra en la misma página y ofrece enlaces al detalle, al historial y a «Nueva guía». La navegación no contiene reglas de negocio.

## 8. Alcance de conectividad

**Online-only**, en coherencia con las fases anteriores y con la restricción expresa de no contemplar funcionalidades offline.

- Toda operación de M3 requiere backend y se clasifica como `Online-required` (Constitución §9.1).
- No hay caché local de ubicaciones, existencias ni guías, ni colas de sincronización.
- No se presenta información simulada como proveniente del backend.
- Ante ausencia de red se informa y se ofrece reintentar; en una creación se aplica además el tratamiento de resultado incierto de la sección 4.9.
- La captura HID del lector no requiere red, pero el registro del movimiento sí; no se genera ningún identificador de guía en el cliente.

## 9. Seguridad

- Se reutiliza el JWT en `sessionStorage` y el interceptor Bearer de la Fase 0.
- Las acciones de ejecución se ocultan con `Can` y las rutas con `RoleGuard`, pero el backend sigue siendo la autoridad; el cliente asume que cualquier operación puede ser manipulada.
- El alcance por puesto es una responsabilidad del backend. El frontend no lo simula en cliente ni confía en un `locationId` enviado por el cliente como mecanismo de autorización.
- No se almacena información de logística en `localStorage` ni en otros almacenes del navegador; el borrador solo vive en memoria.
- Los mensajes de error no exponen información interna; las respuestas fuera de alcance no confirman la existencia de guías ajenas.
- Se muestran solo los datos necesarios para operar (producto, N/S, cantidad, ruta, fecha); no se muestran precios de costo en vistas de logística.
- Los códigos y N/S se validan en cliente solo como ayuda de usabilidad.
- El escaneo se encapsula en `useBarcodeScanner` y `services/scanner/`; los componentes no acceden a eventos de teclado directamente.
- No se exponen credenciales ni secretos y no se añaden dependencias.

## 10. Estrategia de pruebas

Se reutiliza Vitest + React Testing Library. No se añaden librerías de pruebas sin aprobación. Los servicios se prueban con la capa HTTP mockeada; los mocks de Logística se construyen **solo con las estructuras verificadas** en la Etapa 0.

| Tipo | Alcance |
|---|---|
| Unitarias de servicios | `transferService` y `transferMapper`: construcción del payload desde el borrador, parámetros de consulta, mapeo de respuestas, errores y arreglo de listado sin paginación. |
| Unitarias del reductor | `useTransferDraft`: agregar y quitar líneas, duplicados, suma de cantidades, vaciado al cambiar la ruta, transiciones de fase. |
| Unitarias de validación | Reglas de la sección 4.8, cantidades, origen distinto de destino, guía sin líneas. |
| Hooks | `useCreateTransfer` (bloqueo de doble envío con `useRef`, fases `completed`/`rejected`/`unknown`), `useOriginAvailability`, `useTransferHistory` (cancelación de respuestas obsoletas). |
| Componentes | `TransferRouteSelector`, `SerializedItemPicker` (captura HID simulada y teclado), `QuantityItemPicker`, `TransferSummaryDialog` (foco, deshabilitado durante el envío), `TransferReceipt`, estados de carga, vacío y error. |
| Autorización | Acceso a `/logistics/new` solo para roles ejecutores; visibilidad de «Nueva guía» con `Can`; vista de solo lectura y ausencia de selector de puesto para `VENDEDOR` y `TECNICO`; manejo de `403` y de usuario sin ubicación asignada. |
| Flujos | Guía mixta completa (con escáner y por cantidad); abastecimiento y devolución; rechazo por stock insuficiente; doble clic; error de red y verificación posterior; historial con filtros contractuales y arreglo sin paginación; detalle y acceso fuera de alcance. |
| Accesibilidad | Consultas por rol/etiqueta de RTL, orden de foco, retorno de foco del diálogo, región `aria-live` en capturas. |
| Cumplimiento arquitectónico | Revisión de que logistics solo importa de `inventory/index.ts`, de que no hay peticiones HTTP en componentes y de que no hay dependencias circulares. |

**Verificación contra el backend real.** La Fase 1 reportó que no se usaron cuentas operativas (`VENDEDOR`/`TECNICO`) ni lector físico en su aceptación. En la Fase 2 el alcance por puesto es un requisito central, por lo que la validación final **debe incluir** cuentas `ADMIN` (o rol ejecutor), `VENDEDOR` y `TECNICO` con ubicación asignada, con datos de prueba identificados y limpieza lógica posterior. No hay pruebas end-to-end automatizadas aprobadas en el stack; esa validación es manual y documentada. Si no se dispone de cuentas operativas con ubicación, la verificación del alcance queda **pendiente** y no se declara cumplida.

## 11. Secuencia de implementación

### Etapa 0 — Verificación contractual y cierre de alcance (bloqueante)

- Contrastar este plan con `backend-api` (rama `refact/logistica`, `API_CONTRACTS.md` y Swagger) siguiendo la lista de la sección 6.5.
- Contrastar `specs/fase_2_core/spec.md` existente; conservar requisitos y documentar brechas técnicas. La autorización vigente permite implementar lo viable sin integrar antes documentos en `develop`.
- Verificar el estado real de Fase 0 (perfil, ubicación asignada, tipo de ubicación) y de Fase 1 (qué exporta `inventory/index.ts`; disponibilidad de escaneo, catálogo y stock).
- Confirmar que Fase 0 y Fase 1 están disponibles en la rama base (B2). Si la Fase 1 no está integrada en `develop`, decidir con el responsable cómo basar la rama.
- Si falta información crítica, detener la integración afectada y reportarla; no avanzar por suposiciones.

### Etapa 1 — Preparación del módulo

- Crear la estructura de `src/modules/logistics/` según la sección 5.
- Definir `models.ts` (estado del formulario), `permissions.ts` (constante de roles ejecutores), `labels.ts` e `index.ts`.
- Registrar rutas y navegación con guards.
- Si hiciera falta, exponer lo necesario en la interfaz pública de Inventario (DP-05), con revisión.

### Etapa 2 — Servicios y mapeo

- Implementar `transferService` y `transferMapper` con las estructuras **verificadas**.
- Probar con HTTP mockeado; manejo de errores con `asAppError`.

### Etapa 3 — Historial y detalle (solo lectura)

- Implementar `TransferHistoryPage`, filtros soportados, listado contractual sin paginación y estados.
- Implementar `TransferDetailPage` con manejo de acceso fuera de alcance.
- Implementar la vista por rol (global vs. puesto asignado) y el estado «sin puesto asignado».
- Se construye antes que la creación porque la lectura es de menor riesgo, valida pronto el alcance por puesto y sirve para la verificación posterior a envíos de resultado incierto.

### Etapa 4 — Borrador y validaciones

- Implementar `useTransferDraft`, `validation.ts` y el aviso de abandono del formulario.
- Implementar `TransferRouteSelector` con la identificación del Almacén Central y reglas de vaciado.

### Etapa 5 — Selección de mercancía

- `SerializedItemPicker` con `useBarcodeScanner` y entrada manual, validaciones de origen, duplicados y estado.
- `QuantityItemPicker` con el selector de catálogo, `useOriginAvailability` y validación de cantidad.
- `TransferLinesList` con totales por tipo.
- Listado de unidades en el origen solo si DP-06 se resolvió.

### Etapa 6 — Confirmación, envío y comprobante

- `TransferSummaryDialog`, `useCreateTransfer` con bloqueo de doble envío y fases `completed`/`rejected`/`unknown`.
- `UnknownOutcomeNotice` con «Verificar en el historial».
- `TransferReceipt` con el código `TR-` entregado por el backend y accesos a Inventario.
- Si DP-02 confirma idempotencia, integrarla según el contrato.

### Etapa 7 — Refinamiento de acceso, responsive y accesibilidad

- Revisión del alcance por rol con cuentas reales cuando estén disponibles.
- Ajustes responsive de historial y detalle y revisión de accesibilidad y foco.

### Etapa 8 — Pruebas y validación

- Implementar las pruebas de la sección 10.
- Ejecutar `npm test`, `npm run lint`, `npx tsc -b` y `npm run build`.
- Verificar los criterios de aceptación del `spec.md` y la integración real con el backend (incluyendo la bitácora).
- Actualizar el `task.md` solo tras verificar cada tarea.

## 12. Riesgos, bloqueos y decisiones pendientes

### 12.1. Bloqueos

| ID | Estado comprobado / brecha | Impacto / acción |
|---|---|---|
| B1 | Contrato verificado estáticamente en `refact/logistica` y `API_CONTRACTS.md`; ya no bloquea servicios. | Integración real/Swagger todavía debe verificarse; ver B6–B10. |
| B2 | Base disponible en `feature/fase-2-logistica` con Fases 0 y 1 actuales. | Sin bloqueo de rama; no cambiar ni modificar `develop`. |
| B3 | Asignación confirmada en perfil/JWT `locationId` / `locationName`. | Propagar a sesión frontend; ver B7 y pruebas reales pendientes. |
| B4 | Tres documentos existentes; corrección e implementación expresamente autorizadas. | Excepción a integración documental previa; sin commits, push, merge ni PR. |
| B5 | Tipo de ubicación confirmado `ALMACEN_CENTRAL` / `PUESTO`. | El formulario valida exactamente una central activa y puestos activos en los datos reales. |
| B6 | Seriales: actualiza `HardwareItem.locationId` sin mover `QuantityStock`; no maneja chasis/componentes. | Bloquear POST con seriales/mixtas; selección/lectura viable. Pendientes T2.5.2, T2.6 serial/mixto, T2.7.1/.2 serial, T2.9.1/.7 integral. |
| B7 | Sin puesto: `GetTransfersUseCase` elimina el filtro y expone listado global. | No llamadas frontend sin asignación. Backend debe rechazar; T2.9.4/.7 seguridad real pendientes. |
| B8 | Auditoría después del commit; puede fallar y devolver `5xx` con guía/stock ya registrados. | Tratar como incierto; T2.7.5 y garantía BR-015/BR-016 requieren corrección/verificación backend. |
| B9 | Stock cantidades: lectura y decremento sin condición atómica de saldo ni aislamiento explícito. | No afirmar protección concurrente; T2.9.3/.7 SC-27 pendiente de garantía backend. |
| B10 | Código `TR-` aleatorio con unicidad, no correlativo secuencial BR-014. | Mostrar código exacto recibido; generación correlativa pendiente backend. |

### 12.2. Decisiones pendientes

| ID | Decisión | Impacto |
|---|---|---|
| DP-01 | Resuelta: ejecutores `ADMIN` y `ENCARGADO_ALMACEN`. | Constante de roles ejecutores, rutas y pruebas. |
| DP-02 | Comprobado: no hay idempotencia contractual ni deduplicación de guías; conservar resultado incierto y no reintentar automáticamente. | Estrategia de reintento y de resultado incierto (Constitución §9.4). |
| DP-03 | Resuelta: `Location.type` distingue `ALMACEN_CENTRAL` y `PUESTO`; exigir central activa única en los datos recibidos. | Selector de ruta. |
| DP-04 | Comprobado: alcance servidor por ubicación del usuario actual; falla sin asignación (B7). | Historial, detalle y seguridad. |
| DP-05 | Reutilizar/ampliar exportaciones públicas de `inventory/index.ts`; no acceder a rutas internas ni mover dominios. | Límites entre módulos (Constitución §3.3). |
| DP-06 | Disponible en código actual: listado de unidades con filtros reales y DTO; reutilización por interfaz pública, sin repetir implementación. | Selección serializada alternativa al escáner. |
| DP-07 | Resuelta: únicamente unidades `EN_STOCK` ubicadas en origen. | Validación de líneas serializadas. |
| DP-08 | Pendiente backend: no hay tratamiento de chasis/componentes; envío serializado bloqueado junto con B6. | Reglas de selección y comprobante. |
| DP-09 | Resuelta en alcance: solo eventos logísticos de la hoja de vida, sin implementar M6 completo (F2-C11). | Alcance del detalle de guía. |
| DP-10 | Resuelta: arreglo sin paginación, `createdAt desc`; filtros extremos/ubicación/fechas; código mediante detalle, sin filtro N/S. | Historial. |
| DP-11 | Entero >= 1 confirmado; máximo de líneas y notas no documentado. No inventar límites. | Validaciones y rendimiento de la pantalla. |
| DP-12 | Resuelta: `type:DIRECTO`, `status:COMPLETED`; presentar como completada, sin estados editables. | Detalle e historial. |
| DP-13 | Fuera de alcance confirmado: impresión/exportación de guías. | Alcance. |
| DP-14 | Resuelta para frontend: consulta por unidad solo ejecutores; habilitar a vendedor/técnico requiere alcance seguro backend. | Alcance F2-C11. |
| DP-15 | Resuelta: scan de unidad y `GET /hardware-items/:id/lifecycle`, solo eventos `TRANSFER_DIRECT_COMPLETED`. | Fuente F2-C11. |

Ninguna de estas decisiones se resolverá por suposición dentro de la implementación.

### 12.3. Riesgos

| Riesgo | Mitigación |
|---|---|
| Doble movimiento de cantidades por reintento tras un error de red. | Bloqueo de doble envío, estado `unknown`, verificación en historial antes de reintentar y uso de idempotencia si el backend la ofrece. |
| Disponibilidad leída obsoleta al momento de confirmar. | Presentarla como lectura puntual, «Revisar disponibilidad» y rechazo del backend como autoridad. |
| Lecturas accidentales del lector HID durante el diálogo de confirmación. | Desactivar el lector mientras el diálogo está abierto. |
| Fuga de información entre puestos por un filtrado solo visual. | El alcance lo aplica el backend; no se filtra en cliente; pruebas con cuentas reales de `VENDEDOR` y `TECNICO`. |
| Acoplamiento indebido con Inventario. | Consumo solo por interfaz pública; revisión de importaciones. |
| El contrato real difiere de las hipótesis de este plan. | Etapa 0 bloqueante y `transferMapper` como único punto de adaptación. |

## 13. Criterios de finalización

La Fase 2 se considerará completada cuando:

1. El `spec.md` de la Fase 2 esté aprobado y concilie las decisiones pendientes aplicables.
2. El contrato de Logística esté verificado contra `API_CONTRACTS.md`, Swagger y la implementación, y se haya resuelto cualquier discrepancia.
3. Un rol ejecutor pueda abastecer un puesto desde el Almacén Central y devolver mercadería de un puesto al Almacén Central en un solo paso, sin estados intermedios.
4. Una misma guía pueda combinar unidades serializadas y productos por cantidad, y el frontend muestre el código `TR-XXXXXX` entregado por el backend.
5. No exista forma de crear traslados entre puestos desde la interfaz.
6. La selección serializada y por cantidad valide origen, duplicados y cantidades como ayuda, y comunique con claridad los rechazos del backend.
7. El resumen previo muestre origen, destino y contenido, y se prevengan los envíos duplicados, incluido el tratamiento del resultado incierto.
8. Las existencias y la ubicación se reflejen según lo informado por el backend, y los movimientos queden en la bitácora, verificado con la vista de bitácora de la Fase 0.
9. El historial y el detalle funcionen con listado contractual sin paginación y estados de carga, vacío, error y éxito coherentes con la Fase 1.
10. Vendedores y técnicos vean únicamente las guías de su puesto, en solo lectura, verificado con cuentas operativas reales; si no es posible verificarlo, el cierre lo documente como pendiente.
11. Solo los roles ejecutores definidos accedan a la creación, tanto en rutas como en acciones, y el backend siga siendo la autoridad.
12. Las pantallas sean responsive y accesibles según la sección 4.16.
13. No se haya implementado nada fuera de alcance (traslados entre puestos, confirmaciones, borradores, anulaciones, impresión, offline).
14. Las pruebas definidas se ejecuten satisfactoriamente.
15. `npm test`, `npm run lint`, `npx tsc -b` y `npm run build` finalicen sin errores.
16. La implementación cumpla la Constitución y no se hayan agregado dependencias ni patrones arquitectónicos no aprobados.

## Anexo A — Verificación de coherencia con la Constitución y el alcance

| Requisito | Cumplimiento en este plan |
|---|---|
| Arquitectura modular en `src/modules/logistics/` (§4, §5) | Sección 5. |
| Servicios HTTP en el módulo y una única instancia de Axios (§5.1, §7) | Secciones 2 y 4.2. |
| Sin peticiones HTTP ni lógica de negocio en componentes (§3.2, §13.3) | Secciones 2, 4.2 y 10. |
| Sin dependencias circulares ni acceso a internos de otros módulos (§3.3, §4) | Secciones 2, 4.2 y DP-05. |
| Hook y servicio de lector en las ubicaciones obligatorias (§5.2, §5.3) | Secciones 4.2 y 5; sin cambios. |
| Zustand para estado global y estado local de interfaz en el componente (§6) | Sección 4.3. |
| Contratos desde `API_CONTRACTS.md`; no inventar endpoints ni estructuras (§7.1, §16.2) | Secciones 6.1 a 6.5. |
| `sessionStorage` para el JWT; sin `localStorage` ni cookies para el token (§8.1) | Secciones 4.3 y 9. |
| Operación online-only y clasificación de operaciones (§9, nota de alcance) | Sección 8. |
| Sin Dexie, PWA ni impresión en esta fase (§2, nota de alcance; §11.2) | Secciones 2.1 y 3.1. |
| Rutas centralizadas en `src/router/` (§12) | Sección 7. |
| Idioma: código en inglés, textos visibles en español (§13.1) | Secciones 4.8, 4.16 y 7. |
| Seguridad: no confiar en validaciones de cliente (§14) | Secciones 4.8, 4.13 y 9. |
| Pruebas con Vitest y React Testing Library (§15) | Sección 10. |
| Nuevas dependencias y decisiones críticas con aprobación (§17) | Secciones 2.1 y 12.2. |
| Prevención de duplicados documentada (§9.4, §17.7) | Sección 4.9 y DP-02. |

| Restricción de la intervención | Cumplimiento |
|---|---|
| Alcance limitado a las tres líneas funcionales de M3 | Secciones 3 y 3.1. |
| Sin traslados entre puestos, confirmación del receptor, estados intermedios ni borradores | Secciones 0.3, 3.1 y 3.2. |
| Sin Ventas, Caja ni Servicio Técnico | Sección 3.1. |
| Sin offline | Secciones 3.1 y 8. |
| Sin endpoints, DTO, modelos ni respuestas inventados para Logística | Secciones 4.1, 4.2 y 6. |
| Sin asumir un rol específico para el Encargado de Almacén | Sección 4.13 y DP-01. |
| Sin reconstruir funcionalidades de las Fases 0 y 1 | Secciones 0.2 y 4.2. |
| Documentado frente a por verificar | Marcas en todo el documento; secciones 0.2 y 6. |

---

**Fin del plan de implementación de la Fase 2.**