# Spec: Fase 2 — Logística Interna y Movimientos

> **Estado del documento:** contrastado con `backend-api` en `refact/logistica` el 24/11/2026. La implementación y las correcciones documentales están autorizadas en la rama actual sin integración previa en `develop`, sin commits ni publicación. Se preservan los requisitos funcionales; los incumplimientos reales del backend se registran como bloqueos parciales (§12.3). No se consideran aceptados por disponer solo de pruebas locales.

**Rama comprobada:** `feature/fase-2-logistica`
**Repositorio:** `frontend-web`
**Fase:** 2 — M3 Logística Interna y Movimientos
**Estado:** implementación autorizada; contrato contrastado; aceptación pendiente.
**Plan técnico:** `specs/fase_2_core/plan.md`

**Marcas usadas en este documento**

| Marca | Significado |
|---|---|
| **Confirmada** | Regla o requisito establecido por la definición funcional actualizada de la Fase 2 o por la Constitución. |
| **Documentada** | Consta en documentos de las Fases 0 o 1 (contrato de Inventario, specs, plans, tasks). |
| **Por verificar** | Depende del contrato o de la implementación real del backend o del código de las Fases 0 y 1. No se asume. |
| **Decisión pendiente** | Requiere decisión de producto, backend o arquitectura (sección 12). |

---

## 1. Propósito

Definir el alcance funcional del módulo de Logística Interna y Movimientos (M3) del frontend de Mundo Portátil. El módulo permitirá a los roles autorizados distribuir mercadería del Almacén Central a los puestos y devolverla de los puestos al Almacén Central mediante guías de traslado inmediatas y atómicas, que pueden combinar equipos serializados y productos por cantidad, y permitirá consultar el historial de esas guías con visibilidad acotada al puesto asignado cuando el usuario sea vendedor o técnico.

El backend es la fuente de verdad. La atomicidad, la autorización, la generación de correlativos (`TR-XXXXXX`), el alcance por ubicación y la persistencia de los movimientos son responsabilidad del backend; el frontend los presenta y no los reproduce. Las solicitudes, respuestas, filtros y permisos deberán respetar `backend-api/specs/API_CONTRACTS.md` y la implementación en `refact/logistica`, rama indicada por el usuario; todo detalle no especificado permanece pendiente de confirmación, sin inferir campos ni endpoints.

### 1.1. Objetivos

- Distribuir mercadería del Almacén Central a un puesto en un solo paso, sin estados intermedios.
- Registrar devoluciones de un puesto al Almacén Central en un solo paso.
- Combinar en una misma guía unidades serializadas y productos por cantidad, o usar solo una de las dos modalidades.
- Mostrar el código correlativo único de cada guía generado por el backend.
- Consultar el historial de guías y el detalle de cada una (origen, destino, responsable, fecha y contenido).
- Consultar los movimientos de una unidad serializada, dentro del alcance permitido (F2-C11).
- Restringir la ejecución de movimientos al Administrador y al Encargado de Almacén.
- Limitar a vendedores y técnicos a una consulta de solo lectura de las guías de su puesto.
- Reutilizar la autenticación, el RBAC, las ubicaciones, la bitácora, el catálogo, el stock, la búsqueda por código y los componentes de feedback de las Fases 0 y 1.

### 1.2. Fuera de alcance

Esta fase no incluye:

- Traslados directos entre puestos.
- Confirmación o aceptación del receptor, estados «En Tránsito», solicitudes de traslado pendientes, borradores de solicitud o colas de pendientes.
- Anulación, edición o reversión de guías. Las guías son inalterables; una corrección se haría con un movimiento nuevo.
- Ventas, POS y garantías (M2), Servicio Técnico (M7), Cierre de Caja (M8), Auditoría Express (M4), Administración, Alertas y Aprobaciones (M5).
- Alertas de stock bajo y reposición automática.
- Impresión o exportación de guías y etiquetas.
- Vista general de hoja de vida de hardware (M6) más allá de la consulta acotada de movimientos de una unidad definida en FR-037 y FR-038.
- Gestión de ubicaciones y de usuarios (Fase 0).
- Persistencia offline, caché local, sincronización, Dexie.js, IndexedDB y Service Workers; el módulo opera online-only.
- Cambios en el backend o redefinición de sus contratos.
- Cualquier funcionalidad no solicitada expresamente en la definición actualizada de la Fase 2.

Los elementos del documento general de casos de uso que contradicen esta definición quedan **descartados** y no se reincorporan: RF-10 (transferencia entre puestos con confirmación y borrador de solicitud), los estados «En Tránsito», «Confirmar recepción de transferencia», «Confirmar / procesar transferencias pendientes», los estados DRAFT/COMPLETED del plan de fases y la ejecución de traslados por el personal (vendedores y técnicos).

---

## 2. Alcance funcional

| ID | Componente | Descripción | Línea funcional |
|---|---|---|---|
| F2-C01 | Distribución directa | Movimiento inmediato de mercadería del Almacén Central hacia un puesto. | Distribución Directa Inmediata |
| F2-C02 | Devolución directa | Movimiento inmediato de mercadería de un puesto hacia el Almacén Central. | Distribución Directa Inmediata |
| F2-C03 | Guía mixta | Una guía con unidades serializadas, con productos por cantidad, o con ambas. | Traslado Mixto |
| F2-C04 | Selección de mercancía | Captura de N/S por lector HID o teclado y selección de productos por cantidad con disponibilidad en el origen. | Traslado Mixto |
| F2-C05 | Confirmación y comprobante | Resumen previo, envío único atómico y comprobante con el código `TR-XXXXXX` entregado por el backend. | Traslado Mixto |
| F2-C06 | Reflejo de existencias y trazabilidad | Presentar el resultado del movimiento y permitir verificar existencias; el registro en bitácora y hoja de vida lo realiza el backend. | Traslado Mixto |
| F2-C07 | Historial de guías | Listado filtrable de guías (arreglo completo, sin paginación contractual), con la perspectiva «recibida/devuelta» para puestos. | Consulta y Visibilidad Acotada |
| F2-C08 | Detalle de guía | Cabecera, origen, destino, responsable, fecha y líneas serializadas y por cantidad. | Consulta y Visibilidad Acotada |
| F2-C09 | Visibilidad acotada por puesto | Vendedores y técnicos ven solo las guías vinculadas a su puesto asignado, en solo lectura. | Consulta y Visibilidad Acotada |
| F2-C10 | Ejecución restringida | Solo el Administrador y el Encargado de Almacén acceden a la creación de guías. | Distribución Directa Inmediata |
| F2-C11 | Movimientos de una unidad | Consulta de los movimientos logísticos de una unidad serializada, dentro del alcance permitido al rol. | Consulta y Visibilidad Acotada (trazabilidad) |

### 2.1. Actores

| Actor | Descripción |
|---|---|
| Administrador | Rol `ADMIN` (**Documentada**). Ejecuta movimientos y consulta todo el historial. |
| Encargado de Almacén | Rol `ENCARGADO_ALMACEN`, comprobado en el backend. Ejecuta movimientos y consulta todo el historial. |
| Vendedor | Rol `VENDEDOR`. Consulta en solo lectura las guías de su puesto asignado. |
| Técnico | Rol `TECNICO`. Consulta en solo lectura las guías de su puesto asignado. |
| Backend | Sistema que valida permisos, aplica el alcance por ubicación, garantiza atomicidad, genera el correlativo, persiste el movimiento y registra bitácora y hoja de vida. |

En este documento «**rol ejecutor**» designa a `ADMIN` y `ENCARGADO_ALMACEN`. Ambos se incluyen en una única constante de permisos reutilizada por rutas y componentes (DP-01 resuelta).

### 2.2. Matriz de roles y permisos

| Capacidad | Administrador | Encargado de Almacén | Vendedor | Técnico |
|---|---|---|---|---|
| Crear guía de distribución o devolución | Sí | Sí (rol por confirmar) | No | No |
| Consultar el historial de guías | Sí (todas) | Sí (todas) | Sí (solo su puesto) | Sí (solo su puesto) |
| Consultar el detalle de una guía | Sí | Sí | Sí (solo su puesto) | Sí (solo su puesto) |
| Consultar movimientos de una unidad | Sí | Sí | Sujeto a DP-14 | Sujeto a DP-14 |
| Consultar catálogo e inventario (Fase 1) | Sí | Sí | Sí | Sí |

La matriz es la **intención funcional** (**Confirmada**). La autorización efectiva por endpoint es **Por verificar**; la autoridad final es el backend, y las respuestas `401`/`403` deben manejarse aunque la acción se haya mostrado.

---

## 3. Reglas de negocio

### 3.1. Reglas confirmadas

| ID | Regla | Garantía principal |
|---|---|---|
| BR-001 | Los movimientos permitidos son del Almacén Central hacia los puestos y de los puestos hacia el Almacén Central. | Backend; el frontend no ofrece otra ruta. |
| BR-002 | No se permiten traslados directos entre puestos dentro del alcance actual. | Backend; el frontend no ofrece la opción. |
| BR-003 | Los movimientos son inmediatos y atómicos: o se registran completos o no se registra ninguno. | Backend. |
| BR-004 | No existen estados intermedios en tránsito. | Backend y frontend (sin pantallas de estado). |
| BR-005 | No se requiere confirmación del receptor. | Backend y frontend. |
| BR-006 | No existen solicitudes de traslado pendientes de aprobación. | Backend y frontend. |
| BR-007 | Una misma guía puede contener productos serializados y productos agrupados por cantidad. | Backend. |
| BR-008 | También pueden registrarse guías con una sola de las dos modalidades. | Backend. |
| BR-009 | Las unidades serializadas conservan su identidad, número de serie, condición e historial; un traslado solo cambia su ubicación. | Backend; el frontend no envía ni edita esos datos. |
| BR-010 | Los productos agrupados por cantidad actualizan sus existencias en origen (descuento) y destino (acreditación). | Backend. |
| BR-011 | No se puede trasladar una cantidad superior al stock disponible en el origen. | Backend; ayuda previa en frontend. |
| BR-012 | No se puede trasladar una unidad serializada que no pertenezca a la ubicación de origen. | Backend; ayuda previa en frontend. |
| BR-013 | No se puede registrar dos veces la misma unidad dentro de una guía. | Backend; ayuda previa en frontend. |
| BR-014 | Cada traslado tiene un código correlativo único `TR-XXXXXX`. | Backend; el frontend nunca lo genera. |
| BR-015 | Cada movimiento queda registrado en la bitácora inalterable. | Backend. |
| BR-016 | Cada unidad serializada conserva la trazabilidad de sus movimientos en su hoja de vida. | Backend. |
| BR-017 | Únicamente el Administrador y el Encargado de Almacén pueden ejecutar movimientos. | Backend; guards y `Can` en frontend. |
| BR-018 | Vendedores y técnicos tienen acceso de solo lectura a las guías vinculadas a su ubicación física asignada. | Backend; vistas de solo lectura en frontend. |
| BR-019 | Las restricciones de acceso, la atomicidad y la integridad de los movimientos están garantizadas por el backend. | Backend. |

### 3.2. Reglas y decisiones que requieren validación

| ID | Tema | Estado |
|---|---|---|
| BV-001 | Rol del Encargado de Almacén en el sistema (¿`ADMIN` o un rol nuevo?). | Decisión pendiente (DP-01). |
| BV-002 | Cómo se identifica el Almacén Central entre las ubicaciones (tipo de ubicación u otro mecanismo). | Por verificar (DP-03). |
| BV-003 | Estados de unidad que permiten ser trasladada (documentados: `EN_STOCK`, `DE_BAJA`, `SEGUNDA_MANO_PENDIENTE`, entre otros). | Por verificar (DP-07). |
| BV-004 | Traslado de un chasis con componentes hijos y traslado de componentes sueltos. | Decisión pendiente (DP-08). |
| BV-005 | Cantidades: solo enteras positivas; máximo de líneas por guía. | Por verificar (DP-11). |
| BV-006 | Mecanismo de alcance por puesto (JWT, base de datos o parámetro) y comportamiento sin ubicación asignada. | Por verificar (DP-04). |
| BV-007 | Idempotencia o detección de duplicados en la creación. | Por verificar (DP-02). |
| BV-008 | Alcance de la consulta de movimientos de una unidad para vendedores y técnicos. | Decisión pendiente (DP-14). |
| BV-009 | Si el backend aplica la misma regla de «misma ubicación» al destino de una devolución cuando el puesto de origen está inactivo. | Por verificar. |

---

## 4. Historias de usuario

### US-001 — Abastecer un puesto
Como rol ejecutor, quiero distribuir mercadería del Almacén Central a un puesto en un solo paso para que el puesto pueda vender de inmediato.

### US-002 — Devolver mercadería al almacén
Como rol ejecutor, quiero registrar la devolución de mercadería de un puesto al Almacén Central en un solo paso para regularizar existencias.

### US-003 — Armar una guía mixta
Como rol ejecutor, quiero incluir en una misma guía equipos con número de serie y productos por cantidad para despachar todo lo necesario en una sola operación.

### US-004 — Seleccionar mercancía con rapidez
Como rol ejecutor, quiero escanear los N/S y elegir productos por cantidad con la disponibilidad del origen a la vista para armar la guía sin errores.

### US-005 — Confirmar y obtener comprobante
Como rol ejecutor, quiero revisar origen, destino y contenido antes de confirmar y recibir el código `TR-XXXXXX` para dejar constancia del movimiento.

### US-006 — Consultar el historial de guías
Como usuario autenticado, quiero consultar las guías dentro de mi alcance para saber qué mercadería se ha movido.

### US-007 — Consultar el detalle de una guía
Como usuario autenticado, quiero ver origen, destino, responsable, fecha y contenido de una guía para verificar lo recibido o devuelto.

### US-008 — Ver los movimientos de mi puesto
Como vendedor o técnico, quiero ver únicamente las guías vinculadas a mi puesto, en solo lectura, para verificar la mercadería recibida o devuelta en mi tienda.

### US-009 — Rastrear una unidad
Como rol ejecutor, quiero consultar los movimientos de una unidad serializada para conocer por dónde ha pasado.

### US-010 — Recuperarme de fallos
Como usuario, quiero mensajes claros y un tratamiento seguro cuando una operación falle o su resultado sea incierto, para no duplicar ni perder un movimiento.

---

## 5. Requisitos funcionales

### 5.1. Ruta del movimiento — F2-C01, F2-C02, F2-C10

**FR-001 — Tipo de movimiento**
El frontend deberá solicitar al rol ejecutor el tipo de movimiento antes de armar la guía: «Abastecer un puesto» (Almacén Central → Puesto) o «Devolver al almacén» (Puesto → Almacén Central). El Almacén Central es siempre uno de los extremos.

**FR-002 — Selección de puesto y resumen de ruta**
El frontend deberá solicitar la selección explícita de un único puesto y mostrar de forma permanente el resumen «Origen → Destino» con el sentido correspondiente al tipo. No se preseleccionará un puesto a partir de la ubicación operativa del usuario.

**FR-003 — Ubicaciones activas**
Solo se ofrecerán ubicaciones activas, obtenidas del servicio de ubicaciones de la Fase 0 (`GET /locations?active=true`, **Documentada**). El Almacén Central deberá identificarse mediante un mecanismo fiable (**Por verificar**, DP-03). Si no puede identificarse exactamente un Almacén Central activo, o no hay puestos activos, se mostrará un estado explicativo y se bloqueará la creación; el frontend no deducirá el Almacén Central por su nombre.

**FR-004 — Imposibilidad de traslados entre puestos**
La interfaz no ofrecerá ningún control que permita elegir dos puestos como origen y destino, ni dos ubicaciones iguales. El backend conserva la validación definitiva.

**FR-005 — Cambio de ruta con líneas agregadas**
Si el rol ejecutor cambia el tipo de movimiento o el puesto con líneas ya agregadas, el frontend pedirá confirmación y vaciará las líneas, porque la disponibilidad depende del origen.

### 5.2. Selección de mercancía — F2-C03, F2-C04

**FR-006 — Composición de la guía**
Una guía deberá contener al menos una línea y podrá contener líneas serializadas, líneas por cantidad, o ambas. El botón de revisión y confirmación solo se habilitará cuando la guía cumpla las validaciones locales.

**FR-007 — Captura de unidades serializadas**
El frontend permitirá capturar un N/S o código interno mediante lector HID (`useBarcodeScanner` y `src/services/scanner/`, **Documentada**, Fase 1) o por escritura manual, y resolver la unidad mediante `GET /hardware-items/scan/:code` (**Documentada**; esquema de respuesta ilustrativo, **Por verificar**). Tras cada captura, el foco volverá al campo y el resultado se anunciará en una región `aria-live`.

**FR-008 — Validación de pertenencia al origen**
Antes de agregar una unidad, el frontend comparará su ubicación con el origen. Si no coincide, no la agregará y mostrará un mensaje que indique la ubicación actual de la unidad (por ejemplo, «Esta unidad está en [ubicación], no en [origen]»). Es una ayuda de usabilidad; el backend decide.

**FR-009 — Unidad duplicada en la guía**
Una unidad ya agregada no se agregará nuevamente; se informará con un aviso y la guía permanecerá sin cambios.

**FR-010 — Identidad y condición visibles**
Cada línea serializada mostrará el producto y el N/S, y la condición (nuevo/usado) y el estado cuando la respuesta confirmada los incluya. El frontend no modificará identidad, N/S ni condición de la unidad.

**FR-011 — Estado y relación padre-hijo (sujeto a decisión)**
La unidad solo se agregará si su estado permite el movimiento (**Por verificar**, DP-07). Cuando la unidad sea un chasis con componentes o un componente acoplado, la interfaz mostrará esa relación como información; la regla de si el chasis arrastra sus componentes o si un componente acoplado puede moverse por separado es **Decisión pendiente** (DP-08) y no se adopta por suposición.

**FR-012 — Selección de productos por cantidad**
El frontend permitirá buscar productos por nombre o SKU mediante el selector de catálogo reutilizable de la Fase 1 (`GET /catalog`, **Documentada**), limitando la presentación a productos con `isSerialized: false`. Un producto serializado nunca se agregará como línea por cantidad. No se inventará un parámetro de consulta para filtrar por tipo.

**FR-013 — Disponibilidad en el origen**
Al elegir un producto por cantidad, el frontend consultará su disponibilidad en el origen mediante `GET /quantity-stock` con `locationId` y `catalogItemId` (**Documentada**) y la mostrará como lectura puntual. Si la lectura no está disponible, lo indicará sin bloquear definitivamente.

**FR-014 — Cantidad válida**
La cantidad deberá ser un entero mayor que cero (la restricción de enteros es **Por verificar**, DP-11). Como ayuda, el frontend impedirá valores no numéricos, cero, negativos y cantidades superiores a la disponibilidad leída. El backend es la autoridad.

**FR-015 — Una línea por producto**
Un mismo producto por cantidad aparecerá en una sola línea; agregarlo de nuevo editará o sumará la cantidad existente, con aviso visible.

**FR-016 — Edición del contenido y revisión de disponibilidad**
Cada línea podrá quitarse, y las líneas por cantidad podrán editarse. Existirá la acción «Revisar disponibilidad», que reconsultará el stock de las líneas por cantidad y volverá a resolver las unidades serializadas del borrador, indicando cuáles dejaron de ser elegibles.

### 5.3. Confirmación y envío — F2-C05

**FR-017 — Resumen previo obligatorio**
Antes del envío se mostrará un resumen con: tipo de movimiento, ruta «Origen → Destino» destacada, líneas serializadas (producto, N/S, condición si está disponible), líneas por cantidad (producto, cantidad), totales por modalidad y una indicación de que el movimiento se aplica de inmediato. Los botones tendrán texto explícito («Confirmar abastecimiento» / «Confirmar devolución») y existirá «Volver a editar».

**FR-018 — Envío único y atómico**
El borrador se enviará en una única operación de creación de guía mixta atómica. La forma del payload se construirá exclusivamente a partir del contrato verificado y solo en la capa de mapeo del módulo. Las propiedades no definidas por el DTO no se enviarán.

**FR-019 — Prevención de envíos duplicados**
El frontend impedirá un segundo envío mientras haya uno en curso: bloqueo inmediato en cliente, botones deshabilitados con indicación de progreso, diálogo que no puede cerrarse accidentalmente y lector de códigos desactivado mientras el diálogo está abierto. No habrá reintentos automáticos de la creación.

**FR-020 — Éxito y comprobante**
Solo ante una respuesta exitosa del backend el movimiento se considerará realizado. Se mostrará un comprobante con los datos **devueltos por el backend**, incluido el código `TR-XXXXXX`; el frontend no generará ni modificará el código. Se ofrecerán «Nueva guía», «Ver detalle» y «Ver historial». El borrador se descartará.

**FR-021 — Rechazo del backend**
Ante un rechazo verificable de validación o autorización (`400`/`401`/`403`/`404`), el movimiento no se considerará realizado. Un `5xx` puede ocurrir tras el commit de stock al fallar la auditoría; se trata como resultado incierto (FR-022), sin asumir rollback. Se conservará el borrador, se mostrará el mensaje real (`message` como string o arreglo) y, cuando el rechazo se deba a disponibilidad, ubicación o estado de unidades, se ofrecerá «Revisar disponibilidad».

**FR-022 — Resultado incierto**
Ante un error sin respuesta (red, `timeout`, caída), o un `5xx` que no confirme el rechazo antes del commit, el frontend tratará el resultado como **incierto**: conservará el borrador, explicará que la guía pudo haberse registrado, bloqueará la reconfirmación y ofrecerá «Verificar en el historial» (consulta de las guías más recientes de la misma ruta y responsable). Solo después de esa verificación se habilitará «Reintentar», con una advertencia explícita de posible duplicación.

**FR-023 — Respuesta inconsistente o fallo parcial**
Dado que la operación debe ser atómica, el frontend no tendrá un modelo de éxito parcial. Si la respuesta indica un resultado parcial o inconsistente (por ejemplo, un código de guía sin todas las líneas enviadas), el frontend no lo presentará como éxito completo: mostrará una advertencia, impedirá reintentar de inmediato, dirigirá a verificar el detalle de la guía y lo reportará como incidencia del backend. El comportamiento atómico es una garantía del backend (BR-003); su comprobación es **Por verificar**.

### 5.4. Existencias y trazabilidad — F2-C06

**FR-024 — Reflejo de existencias**
El frontend no calculará ni almacenará nuevas existencias ni ubicaciones. Mostrará lo devuelto por el backend y ofrecerá accesos a las vistas de Inventario (`/inventory`, `/inventory/stock`) para verificar existencias en origen y destino. Opcionalmente, y solo si la respuesta de creación no los incluye, reconsultará `GET /quantity-stock` para mostrar los saldos resultantes de las líneas por cantidad; nunca los estimará por aritmética del cliente.

**FR-025 — Bitácora**
El backend registrará cada movimiento en la bitácora inalterable (BR-015) y en la hoja de vida de cada unidad serializada (BR-016). El frontend no escribirá eventos de auditoría. La validación final verificará, con la vista de bitácora de la Fase 0, que cada guía creada deja su registro.

### 5.5. Historial y detalle — F2-C07, F2-C08

**FR-026 — Listado de guías**
El frontend consultará `GET /transfers`, que devuelve un arreglo ordenado por `createdAt desc`, sin `page`, `limit` ni metadatos de paginación. Mostrará código `TR-XXXXXX`, fecha, ruta, responsable y `itemsCount` como número de líneas. Los totales por modalidad se consultan en el detalle, no se deducen de `itemsCount`. No se inventará paginación.

**FR-027 — Filtros**
Filtros confirmados: `fromLocationId`, `toLocationId`, `locationId`, `startDate`, `endDate` (ISO). El código de guía se consulta mediante `GET /transfers/:id`, no como filtro del listado; no existe filtro por N/S, tipo, estado ni responsable (DP-10). No se filtrará en cliente un subconjunto paginado para simular un filtro no soportado.

**FR-028 — Perspectiva del puesto**
Para vendedores y técnicos, las guías se presentarán desde la perspectiva de su puesto: «Recibida» para distribuciones hacia su puesto y «Devuelta» para devoluciones desde su puesto. Para roles ejecutores se mostrará el tipo y la ruta completos.

**FR-029 — Detalle de guía**
El detalle presentará: código, tipo, origen, destino, fecha y hora, responsable (si el backend lo entrega al rol), equipos serializados (producto, N/S, condición si está disponible), productos por cantidad (producto, cantidad) y totales. No incluirá acciones de edición, anulación ni reversión. El detalle acepta UUID o código `TR-XXXXXX`; su DTO no entrega condición de la unidad.

**FR-030 — Datos mínimos**
Las vistas de logística mostrarán solo lo necesario para operar y consultar. No mostrarán precios de costo ni de venta.

### 5.6. Visibilidad acotada por puesto — F2-C09

**FR-031 — Alcance por puesto**
Para vendedores y técnicos, el listado y el detalle mostrarán únicamente guías vinculadas a su ubicación física asignada (como origen o destino). El filtrado de seguridad lo aplica el backend (BR-018, BR-019). El frontend no simulará el alcance filtrando una lista global en cliente ni usará un `locationId` elegido libremente como mecanismo de autorización. Si el contrato exige o permite enviar la ubicación asignada, se enviará esa y no otra (**Por verificar**, DP-04).

**FR-032 — Solo lectura**
Para vendedores y técnicos no se mostrarán controles de creación ni ninguna acción que modifique datos de logística.

**FR-033 — Usuario sin ubicación asignada**
Si un vendedor o técnico no tiene ubicación física asignada, el frontend mostrará un estado explicativo («Tu usuario no tiene un puesto asignado. Contacta al administrador.») y no solicitará movimientos. El backend y el perfil exponen `locationId` / `locationName`; debe propagarse esa asignación al frontend. El listado backend no rechaza todavía un usuario sin ubicación: B7, pendiente de corrección del servidor.

**FR-034 — Guía de otro puesto**
Si el usuario intenta acceder al detalle de una guía fuera de su alcance (por ejemplo, mediante URL), el frontend mostrará un mensaje neutral («No tienes acceso a esta guía o no existe») sin confirmar la existencia de la guía. Los estados `403` y `404` recibirán el mismo tratamiento (el backend devuelve `403` fuera de alcance y `404` si no existe).

### 5.7. Ejecución restringida — F2-C10

**FR-035 — Acceso a la creación**
La ruta de creación estará protegida con `ProtectedRoute` y `RoleGuard` según la constante centralizada de roles ejecutores, y la acción «Nueva guía» se mostrará únicamente con `Can`. Ningún componente comparará roles de forma literal.

**FR-036 — Ejecución sin autorización**
Si un usuario sin permiso intenta acceder a la creación (por navegación directa) será redirigido o recibirá un estado de acceso denegado según la infraestructura de la Fase 0. Si una creación recibe `403` del backend, la guía no se considerará creada y se mostrará «No tienes permiso para realizar esta acción.».

### 5.8. Movimientos de una unidad — F2-C11

**FR-037 — Consulta por N/S**
El frontend permitirá consultar los movimientos logísticos de una unidad serializada a partir de su N/S o código (captura HID o teclado), mostrando para cada movimiento código de guía, tipo, origen, destino, fecha y responsable cuando el backend lo entregue, con acceso al detalle de la guía. La fuente comprobada es `GET /hardware-items/:id/lifecycle`, tras resolver la unidad mediante `GET /hardware-items/scan/:code`, reutilizando Inventario. No existe filtro por N/S en el listado de guías (DP-15 resuelta). La consulta mostrará solo los eventos de movimiento logístico; la presentación de otros eventos de la hoja de vida (ventas, instalaciones) está fuera de alcance salvo decisión expresa (DP-09).

**FR-038 — Alcance de la consulta por rol**
Esta consulta estará disponible para roles ejecutores. Para vendedores y técnicos solo se habilitará si el backend garantiza que la respuesta se limita a movimientos de su puesto; en caso contrario permanecerá oculta para esos roles, para no violar BR-018 (DP-14).

### 5.9. Estados, validación y feedback

**FR-039 — Estados de pantalla**
Las vistas con consultas u operaciones representarán estados de carga, éxito, vacío y error mediante los componentes reutilizables de la Fase 0 (`LoadingState`/`LoadingScreen`, `EmptyState`, `ErrorState`, `Notification`), con reintento cuando corresponda. Las respuestas obsoletas al cambiar filtros se descartarán.

**FR-040 — Validaciones y mensajes**
El frontend podrá validar localmente para facilitar el uso, pero el backend es la autoridad. Los límites, enums y obligatoriedad no documentados no se inferirán. Los errores del backend se presentarán con la estructura real `message` (string o arreglo), `error` y `statusCode`. Los textos visibles estarán en español y no expondrán trazas, consultas ni información interna.

**FR-041 — Operación online-only**
Los datos se obtendrán del backend. El módulo no presentará datos simulados como reales ni conservará información de logística en almacenamiento local. Un movimiento no se mostrará como realizado sin confirmación del servidor.

---

## 6. Flujos funcionales

### 6.1. Flujos principales

**FP-01 — Distribución de mercadería (Almacén Central → Puesto)**

| Paso | Actor | Respuesta del sistema |
|---|---|---|
| 1 | Rol ejecutor abre «Nueva guía» y elige «Abastecer un puesto». | Muestra el selector de puesto y el resumen de ruta (FR-001, FR-002). |
| 2 | Elige el puesto destino. | Fija origen = Almacén Central y destino = puesto. |
| 3 | Escanea N/S y/o busca productos por cantidad. | Valida pertenencia al origen, duplicados y disponibilidad; agrega líneas (FR-007 a FR-016). |
| 4 | Pulsa «Revisar y confirmar». | Muestra el resumen previo (FR-017). |
| 5 | Pulsa «Confirmar abastecimiento». | Envía la guía una sola vez (FR-018, FR-019). |
| 6 | — | El backend registra el movimiento de forma atómica y devuelve la guía con su código `TR-`. |
| 7 | — | Muestra el comprobante con enlaces a detalle, historial, Inventario y «Nueva guía» (FR-020, FR-024). |

**FP-02 — Devolución de mercadería (Puesto → Almacén Central)**
Igual a FP-01 con el tipo «Devolver al almacén»: origen = puesto elegido, destino = Almacén Central. La disponibilidad y la pertenencia de unidades se validan contra el puesto.

**FP-03 — Consulta del historial**
El usuario abre `/logistics`; el sistema solicita las guías dentro del alcance del rol (FR-026, FR-031), aplica filtros soportados (FR-027) y muestra la lista completa sin paginación con la perspectiva correspondiente (FR-028).

**FP-04 — Consulta del detalle de una guía**
Desde el historial o por enlace, el usuario abre el detalle; el sistema muestra cabecera, responsable, fecha, origen, destino y líneas (FR-029).

**FP-05 — Consulta de movimientos de una unidad**
El rol ejecutor escanea o escribe el N/S; el sistema resuelve la unidad y lista sus movimientos logísticos con acceso al detalle de cada guía (FR-037).

### 6.2. Flujos alternativos

| ID | Flujo alternativo |
|---|---|
| FA-01 | **Guía solo serializada o solo por cantidad:** el usuario agrega líneas de una sola modalidad; el flujo continúa igual (FR-006). |
| FA-02 | **Cambio de ruta con líneas:** el usuario cambia tipo o puesto; el sistema pide confirmación y vacía las líneas (FR-005). |
| FA-03 | **Revisión de disponibilidad:** antes de confirmar, el usuario ejecuta «Revisar disponibilidad»; el sistema marca las líneas que dejaron de ser elegibles (FR-016). |
| FA-04 | **Volver a editar desde el resumen:** el borrador se conserva sin cambios. |
| FA-05 | **Rechazo del backend:** el usuario corrige las líneas indicadas y vuelve a confirmar (FR-021). |
| FA-06 | **Resultado incierto:** el usuario verifica en el historial; si la guía existe, la considera realizada y descarta el borrador; si no, reintenta bajo advertencia (FR-022). |
| FA-07 | **Abandono del formulario con líneas:** el sistema solicita confirmación antes de salir y no persiste el borrador. |

---

## 7. Escenarios, comportamiento esperado y casos de error

Cada escenario enuncia el comportamiento esperado; los criterios de aceptación consolidados están en la sección 9. «Rol ejecutor» incluye al Administrador y al Encargado de Almacén, sujeto a DP-01.

### 7.1. Distribución de mercancía

| ID | Escenario | Comportamiento esperado |
|---|---|---|
| SC-01 | Distribución de equipos serializados desde el Almacén Central a un puesto. | Las unidades escaneadas, ubicadas en el Almacén Central, se agregan; tras confirmar, el backend actualiza su ubicación al puesto y se muestra el comprobante con `TR-`. El frontend no modifica N/S ni condición. |
| SC-02 | Distribución de productos agrupados por cantidad. | Cada producto por cantidad con cantidad válida y disponible se agrega; tras confirmar, el backend descuenta en el Almacén Central y acredita en el puesto; el comprobante muestra lo devuelto por el backend. |
| SC-03 | Distribución mixta dentro de una misma guía. | La guía contiene ambas modalidades, se envía en una sola operación atómica y recibe un único código `TR-`. |

### 7.2. Devolución de mercancía

| ID | Escenario | Comportamiento esperado |
|---|---|---|
| SC-04 | Devolución de equipos serializados desde un puesto al Almacén Central. | Las unidades deben estar en el puesto elegido; tras confirmar, pasan al Almacén Central. |
| SC-05 | Devolución de productos agrupados por cantidad. | La disponibilidad se valida contra el puesto; tras confirmar, el backend descuenta en el puesto y acredita en el Almacén Central. |
| SC-06 | Devolución mixta. | Una sola guía con ambas modalidades, un único código `TR-`. |

### 7.3. Consulta y trazabilidad

| ID | Escenario | Comportamiento esperado |
|---|---|---|
| SC-07 | Consulta del historial de movimientos. | Listado contractual sin paginación con código, fecha, tipo, origen, destino y resumen de contenido, dentro del alcance del rol. |
| SC-08 | Consulta del detalle de una guía. | Se muestran cabecera y líneas serializadas y por cantidad; sin acciones de modificación. |
| SC-09 | Identificación de origen, destino, responsable y fecha. | Todos aparecen en el detalle; el responsable se muestra si el backend lo entrega al rol (**Por verificar**); fecha y hora en zona horaria local, formato `es-PE`. |
| SC-10 | Consulta del historial de movimientos de una unidad serializada. | Se listan los movimientos logísticos de la unidad con acceso al detalle de cada guía (FR-037); para vendedores y técnicos solo bajo FR-038. |
| SC-11 | Consulta de movimientos recibidos y devueltos por un puesto. | Un vendedor o técnico ve su historial en perspectiva «Recibida» / «Devuelta»; un rol ejecutor puede filtrar por puesto (si el backend lo soporta). |

### 7.4. Permisos y restricciones

| ID | Escenario | Comportamiento esperado |
|---|---|---|
| SC-12 | Administrador ejecutando movimientos. | Accede a «Nueva guía», crea guías y consulta todo el historial. |
| SC-13 | Encargado de Almacén ejecutando movimientos. | Mismo comportamiento que SC-12, bajo el mecanismo que defina DP-01. Hasta entonces la verificación queda pendiente. |
| SC-14 | Vendedor consultando exclusivamente los movimientos de su puesto. | Ve solo guías de su puesto, sin selector de puesto ni controles de creación. |
| SC-15 | Técnico consultando exclusivamente los movimientos de su puesto. | Igual que SC-14. |
| SC-16 | Usuario sin ubicación física asignada. | Estado explicativo y ninguna consulta de movimientos (FR-033). |
| SC-17 | Intento de acceder a una guía de otro puesto. | Mensaje neutral sin confirmar existencia (FR-034). |
| SC-18 | Intento de ejecutar un movimiento sin autorización. | Ruta de creación inaccesible; si el backend responde `403`, no se considera creado (FR-036). |

### 7.5. Errores y casos límite

| ID | Caso | Comportamiento esperado |
|---|---|---|
| SC-19 | Stock insuficiente. | Ayuda local impide superar la disponibilidad leída; si el backend rechaza por stock insuficiente, se muestra su mensaje, se conserva el borrador y se ofrece «Revisar disponibilidad». |
| SC-20 | Unidad serializada ubicada en otro establecimiento. | No se agrega y se informa su ubicación actual (FR-008); si el backend rechaza al confirmar, se trata como rechazo (FR-021). |
| SC-21 | Unidad serializada duplicada dentro de una guía. | Se ignora con aviso (FR-009); el backend rechazaría una duplicación enviada. |
| SC-22 | Ubicación de origen o destino inválida. | Solo se ofrecen ubicaciones del servicio de ubicaciones; si el backend rechaza por ubicación inexistente, se muestra el mensaje y se recarga la lista. |
| SC-23 | Origen y destino iguales. | La interfaz no permite configurarlo (FR-004); el backend lo rechaza si llegara a enviarse. |
| SC-24 | Ubicaciones inactivas. | No se ofrecen (FR-003); si el backend rechaza por inactividad, se muestra el mensaje y se recarga. |
| SC-25 | Guía sin productos. | El botón de revisión permanece deshabilitado; mensaje «Agrega al menos un producto a la guía.». |
| SC-26 | Cantidades inválidas (cero, negativas, decimales, no numéricas, excesivas). | La interfaz las impide o advierte (FR-014); el backend rechaza si llegan. |
| SC-27 | Cambios de disponibilidad durante la operación. | La disponibilidad es una lectura puntual; si cambia antes de confirmar, el backend rechaza y se ofrece «Revisar disponibilidad». No se modifica el borrador de forma silenciosa. |
| SC-28 | Error de comunicación con el backend. | En consultas: `ErrorState` con reintento. En creación: resultado incierto (FR-022). |
| SC-29 | Intento de envío duplicado. | El segundo disparo se bloquea (FR-019); tras un resultado incierto, el reintento exige verificación previa (FR-022). |
| SC-30 | Fallo parcial de una operación que debe ser atómica. | No existe éxito parcial en el frontend (FR-023); ante una respuesta inconsistente se advierte, se impide reintento inmediato y se verifica el detalle de la guía. |
| SC-31 | Unidad en estado no movible o chasis con componentes. | Se aplica lo que confirmen DP-07 y DP-08; hasta entonces, se muestra la información y se delega el rechazo al backend. |
| SC-32 | Sesión expirada durante la operación. | `401` ejecuta el flujo de cierre de sesión de la Fase 0; la guía no se considera creada y el borrador no se persiste. |

---

## 8. Validaciones funcionales

| Regla | Mensaje en español | Origen |
|---|---|---|
| Debe elegirse tipo de movimiento y puesto. | «Selecciona el tipo de movimiento y el puesto.» | Frontend (ayuda) |
| La guía debe tener al menos una línea. | «Agrega al menos un producto a la guía.» | Frontend (ayuda) y backend |
| Origen y destino deben ser distintos. | «El origen y el destino deben ser distintos.» | Frontend (ayuda) y backend |
| La unidad no puede repetirse en la guía. | «Esta unidad ya está en la guía.» | Frontend (ayuda) y backend |
| La unidad debe estar en el origen. | «Esta unidad está en [ubicación], no en [origen].» | Frontend (ayuda) y backend |
| La cantidad debe ser un entero mayor que cero. | «Ingresa una cantidad entera mayor que cero.» | Frontend (ayuda) y backend |
| La cantidad no debe superar la disponibilidad. | «Solo hay N disponibles en [origen].» | Frontend (ayuda) y backend |
| Solo roles ejecutores pueden crear guías. | «No tienes permiso para realizar esta acción.» | Backend (autoridad) |

Los límites no documentados (por ejemplo, máximo de líneas) y los mensajes específicos de errores de negocio del backend se definirán solo tras verificar el contrato.

---

## 9. Criterios de aceptación

1. Un rol ejecutor puede abastecer un puesto desde el Almacén Central y devolver mercadería de un puesto al Almacén Central en un solo paso, sin estados intermedios ni confirmación del receptor (SC-01 a SC-06).
2. La interfaz no permite configurar traslados entre puestos ni con origen y destino iguales (SC-23).
3. Una guía puede contener solo serializados, solo cantidades o ambos, y se envía en una única operación atómica con un único código `TR-XXXXXX` entregado por el backend (SC-01 a SC-06).
4. La captura por lector HID o teclado resuelve la unidad por `GET /hardware-items/scan/:code`, valida pertenencia al origen y duplicados, y no agrega unidades fuera del origen (SC-20, SC-21).
5. Los productos por cantidad muestran su disponibilidad en el origen y la interfaz impide cantidades inválidas o superiores a lo leído (SC-19, SC-26).
6. El resumen previo muestra tipo, origen, destino y contenido con totales antes de enviar (FR-017).
7. Un doble clic o un segundo Enter no genera dos solicitudes de creación (SC-29).
8. Ante un error sin respuesta, el sistema trata el resultado como incierto, bloquea la reconfirmación y exige verificación en el historial antes de reintentar (SC-28, SC-29).
9. Ante un rechazo del backend, el borrador se conserva, el mensaje real se muestra y se ofrece «Revisar disponibilidad» cuando corresponde (SC-19, SC-20, SC-27).
10. El frontend no presenta éxito parcial; una respuesta inconsistente se advierte y se verifica (SC-30).
11. El movimiento no se muestra como realizado sin confirmación del backend (SC-28, SC-32).
12. Las existencias y ubicaciones mostradas tras un movimiento provienen del backend; el frontend no las calcula (FR-024).
13. Cada guía creada deja su registro en la bitácora, verificado con la vista de bitácora de la Fase 0 (FR-025).
14. El historial consume el arreglo sin paginación del backend y muestra solo filtros soportados; los estados de carga, vacío y error son coherentes con la Fase 1 (SC-07).
15. El detalle muestra código, tipo, origen, destino, fecha, responsable (si se entrega) y líneas; no ofrece edición, anulación ni reversión (SC-08, SC-09).
16. Un vendedor o un técnico ve solo las guías de su puesto, en solo lectura y con perspectiva «Recibida»/«Devuelta», sin selector de puesto (SC-11, SC-14, SC-15). La verificación se realiza con cuentas operativas reales; si no es posible, el cierre la reporta como pendiente.
17. Un usuario sin ubicación asignada recibe un estado explicativo y no obtiene movimientos (SC-16).
18. El acceso al detalle de una guía de otro puesto produce un mensaje neutral y no revela su existencia (SC-17).
19. Solo los roles ejecutores acceden a la creación, tanto en rutas como en acciones; la autorización del backend prevalece (SC-12, SC-13, SC-18).
20. La consulta de movimientos de una unidad está disponible a roles ejecutores y solo a vendedores y técnicos si el backend limita el resultado a su puesto (SC-10, FR-038).
21. Los errores `400`, `401`, `403`, `404`, `409` y de red se muestran sin filtrar información sensible; los códigos no documentados se confirman antes de asignar comportamiento especializado.
22. No se implementan traslados entre puestos, confirmaciones, estados en tránsito, borradores, anulaciones, impresión ni funcionalidades offline.
23. No se almacena información de logística en `localStorage` ni en otros almacenes del navegador.
24. Las pantallas son utilizables con teclado, con foco visible, etiquetas asociadas y adaptación a pantallas estrechas en historial y detalle.

---

## 10. Rutas de interfaz

Rutas previstas, sujetas a la integración con el router central de la Fase 0 (en inglés, conforme a la Constitución §13.1):

| Ruta | Vista | Acceso |
|---|---|---|
| `/logistics` | Historial de guías (incluye la consulta de movimientos de una unidad, FR-037) | Usuarios autenticados; alcance aplicado por el backend |
| `/logistics/new` | Nueva guía de traslado | Roles ejecutores |
| `/logistics/transfers/:id` | Detalle de guía | Usuarios autenticados, dentro de su alcance |

La entrada «Logística» se integrará en el menú existente, grupo `operations`. La forma del parámetro `:id` es **Por verificar**.

---

## 11. Dependencias con las fases anteriores y verificaciones necesarias

### 11.1. Fase 0 — Cimientos transversales

Los documentos de la Fase 0 no se entregaron; el estado se toma de la referencia del plan de la Fase 1.

| Capacidad | Estado documental | Verificación en el repositorio real |
|---|---|---|
| Autenticación y gestión de sesión (`authStore`, JWT en `sessionStorage`) | Documentada | Campos del perfil (rol, ubicación asignada). |
| RBAC (`ProtectedRoute`, `RoleGuard`, `Can`) | Documentada | Soporte de listas de roles configurables por constante. |
| Gestión de usuarios | Documentada (servicio) | No se reconstruye. |
| Ubicaciones físicas (`GET /locations?active=true`) | Documentada | Existencia de un tipo de ubicación que identifique el Almacén Central (DP-03). |
| **Ubicación física asignada al empleado** | Confirmada en perfil y estrategia JWT (`locationId`, `locationName`). | No confundir asignación con selección operativa; no consultar guías sin asignación. |
| Bitácora de auditoría (servicio) | Documentada | Registro de eventos de logística creados por el backend. |
| Navegación y componentes compartidos | Documentada | Registro de rutas y menú. |

### 11.2. Fase 1 — Inventario

| Capacidad | Estado documental | Observación |
|---|---|---|
| Catálogo, categorías y selector de catálogo | Implementada según `task.md` | Consumo mediante la interfaz pública de Inventario (DP-05). |
| Inventario serializado: ingreso y búsqueda por código (`scan`) y captura HID | Implementada según `task.md` | Base de la selección serializada. |
| Inventario por cantidad y stock por ubicación (`GET /quantity-stock`) | Implementada según `task.md` | Base de la disponibilidad. |
| Condición de los productos (`condition`: `nuevo`/`usado`; `isSecondHand`) | Documentada como filtro y campo | Presencia en la respuesta de `scan`: **Por verificar**. |
| Listado `GET /hardware-items` y detalle `GET /hardware-items/:id` | Disponibles en implementación actual | Reutilizar solo DTOs verificados e interfaz pública. |
| Historial de unidades (`GET /hardware-items/:id/lifecycle`) | Disponible actualmente | Reutilizar eventos logísticos para ejecutores; no expone alcance seguro por puesto (DP-14). |
| Modelos, servicios y hooks de Inventario | Implementados | Solo por interfaz pública `src/modules/inventory/index.ts` (**Por verificar** qué exporta). |

### 11.3. Restricciones arquitectónicas

- El código residirá en `src/modules/logistics/`, con servicios HTTP en `src/modules/logistics/services/` y sin dependencias circulares con Inventario (Constitución §3, §4, §5).
- Se reutilizarán la instancia de Axios, los interceptores, `authStore`, `locationStore`, los guards, `Can` y los componentes de feedback; no se crearán instancias HTTP propias.
- El estado de la guía será local; no se creará un store de Zustand salvo justificación.
- No se utilizarán Dexie.js, IndexedDB, Service Workers ni `src/services/printer/`.
- No se añadirán dependencias sin aprobación (Constitución §17).
- Rutas en inglés y textos visibles en español (Constitución §13.1).
- Pruebas con Vitest y React Testing Library (Constitución §15).

---

## 12. Integración y dependencias del backend

### 12.1. Fuente contractual

Se consultan `../backend-api/specs/API_CONTRACTS.md` y los controladores, DTOs y casos de uso de la rama `refact/logistica`, por instrucción expresa del usuario, sin modificarla. El contrato preciso y sus fuentes están en `plan.md` §6. La inspección estática no sustituye Swagger ni las pruebas reales pendientes. Se reutilizan JWT Bearer y errores comunes de Fase 0.

### 12.2. Capacidades comprobadas

| Capacidad | Operación HTTP | Contrato |
|---|---|---|
| Crear guía | `POST /transfers/direct` | `{fromLocationId,toLocationId,hardwareItemIds?,quantities?:[{catalogId,quantity}],notes?}`; IDs UUID v4 y cantidades enteras >= 1. Devuelve detalle. |
| Historial | `GET /transfers` | Arreglo sin paginación; filtros por extremos, ubicación y fechas ISO; `createdAt desc`. |
| Detalle | `GET /transfers/:id` | UUID o código `TR-`; cabecera e `items`. |
| Movimientos de unidad | `GET /hardware-items/:id/lifecycle` | Eventos por `serials`; presentar solo `TRANSFER_DIRECT_COMPLETED`, solo ejecutores. |
| Ubicaciones | `GET /locations?active=true` | `type: ALMACEN_CENTRAL | PUESTO`. |
| Selección / disponibilidad | `GET /hardware-items/scan/:code`, `GET /catalog`, `GET /quantity-stock` | Reutilizar servicios de Inventario; productos por cantidad `isSerialized:false`. |

Creación solo `ADMIN` / `ENCARGADO_ALMACEN`; lectura los cuatro roles, con alcance por puesto salvo el fallo sin asignación de B7. La guía nace `type:DIRECTO`, `status:COMPLETED`; no enviar esos campos ni inventar estados. El backend acepta únicamente unidades `EN_STOCK`. El frontend no genera códigos, calcula nuevos saldos ni registra auditoría.

### 12.3. Brechas reales y alcance implementable

- **B6 — Seriales y guías mixtas:** el caso de uso mueve `HardwareItem.locationId` sin actualizar `QuantityStock`, saldo oficial también para modelos serializados. No maneja chasis/componentes. Mantener selección serializada y consulta, pero bloquear el envío de guías con seriales hasta corrección backend; no compensar enviando cantidades adicionales. FR-018, FR-024 y BR-003 no se consideran satisfechos para esta modalidad.
- **B7 — Seguridad sin puesto:** `GetTransfersUseCase` convierte una ubicación nula a `undefined` y el repositorio devuelve todo el historial. El frontend no solicita guías si falta asignación; la autorización efectiva requiere corregir backend. No se declara validado BR-018/FR-031 para ese caso.
- **B8 — Auditoría no atómica:** se registra después de la transacción. Una falla de auditoría puede devolver `5xx` con stock/guía ya confirmados y sin evento de hoja de vida. Tratamiento incierto, verificación manual y sin reintentos automáticos; BR-015/BR-016 pendientes de garantía backend.
- **B9 — Concurrencia:** para cantidades se lee disponibilidad y luego se decrementa sin condición de saldo ni aislamiento explícito en el adaptador. No queda demostrada protección frente a consumo simultáneo; la validación frontend no la garantiza.
- **B10 — Correlativo:** el código real es `TR-` más seis hexadecimales aleatorios, con unicidad de esquema. La secuencia exigida por BR-014 no está implementada; el frontend muestra el valor exacto del servidor.
- Sin clave idempotente, filtro por responsable, N/S o código en historial, ni paginación remota. La búsqueda por código usa detalle; los reintentos inciertos no garantizan ausencia de duplicados. Los máximos de líneas/notas no están documentados; no inventarlos.
- El detalle no incluye condición; el POST devuelve rol en `createdByName`, mientras GET detalle resuelve el nombre. Recuperar detalle si se necesita identificar al responsable, sin sustituir por datos inventados.
- Las capacidades de lectura, el formulario y el traslado exclusivamente por cantidad pueden implementarse con el contrato real; la aceptación completa queda condicionada a los bloqueos y pruebas reales.

## 13. Requisitos no funcionales

**NFR-001 — Arquitectura modular:** el código de Logística residirá en `src/modules/logistics/`, respetará la separación de responsabilidades y consumirá Inventario solo mediante su interfaz pública, sin dependencias circulares.

**NFR-002 — Reutilización transversal:** las peticiones usarán la instancia Axios, la autenticación, los guards, `Can`, las ubicaciones, el lector HID, el feedback y las notificaciones existentes.

**NFR-003 — Seguridad:** las rutas y acciones se restringirán por rol; ningún control visual reemplaza la autorización del backend; el alcance por puesto lo aplica el backend; no se almacenará información de logística en `localStorage` ni en otros almacenes del navegador; las respuestas fuera de alcance no revelan la existencia de guías ajenas.

**NFR-004 — Accesibilidad y adaptación:** formularios, listados y diálogos serán utilizables con teclado, con foco visible, etiquetas asociadas, retorno de foco al cerrar diálogos, anuncios `aria-live` en capturas y errores no comunicados solo por color. Historial y detalle se diseñarán *mobile-first*; la creación debe seguir siendo usable en pantallas medianas.

**NFR-005 — Rendimiento percibido:** el listado de guías consumirá el arreglo contractual sin paginación y presentarán estados de carga; el resumen agrupará las líneas por modalidad para guías extensas.

**NFR-006 — Operación online-only:** una operación que requiera backend no se mostrará como exitosa sin confirmación del servidor.

**NFR-007 — Sin dependencias injustificadas:** no se añadirán librerías de formularios, tablas, diálogos, estado de servidor o virtualización.

**NFR-008 — Prevención de errores:** la interfaz mostrará siempre origen y destino juntos, exigirá una confirmación explícita y no preseleccionará destinos.

**NFR-009 — Consistencia visual y terminología:** se mantendrán los patrones de Inventario y la terminología en español definida (Guía de traslado, Abastecer un puesto, Devolver al almacén, Origen, Destino, N/S, Recibida, Devuelta).

**NFR-010 — Presentación de fechas:** fecha y hora en la zona horaria local del usuario con formato `es-PE`; el contrato transmite fechas ISO.

---

## 14. Decisiones pendientes

| ID | Decisión | Impacto |
|---|---|---|
| DP-01 | Resuelta: ejecutores `ADMIN` y `ENCARGADO_ALMACEN`. | Roles ejecutores, rutas y pruebas (SC-13). |
| DP-02 | Comprobado: no hay idempotencia contractual ni deduplicación de guías; conservar resultado incierto y no reintentar automáticamente. | Estrategia de reintento (FR-022). |
| DP-03 | Resuelta: `Location.type` distingue `ALMACEN_CENTRAL` y `PUESTO`; exigir central activa única en los datos recibidos. | Selector de ruta (FR-003). |
| DP-04 | Comprobado: alcance servidor por ubicación del usuario actual; falla sin asignación (B7). | Historial, detalle y seguridad. |
| DP-05 | Reutilizar/ampliar exportaciones públicas de `inventory/index.ts`; no acceder a rutas internas ni mover dominios. | Límites entre módulos. |
| DP-06 | Disponible en código actual: listado de unidades con filtros reales y DTO; reutilización por interfaz pública, sin repetir implementación. | Selección serializada alternativa al escáner. |
| DP-07 | Resuelta: únicamente unidades `EN_STOCK` ubicadas en origen. | Validación de líneas serializadas. |
| DP-08 | Pendiente backend: no hay tratamiento de chasis/componentes; envío serializado bloqueado junto con B6. | Selección y comprobante. |
| DP-09 | Resuelta en alcance: solo eventos logísticos de la hoja de vida, sin implementar M6 completo (F2-C11). | FR-037. |
| DP-10 | Resuelta: arreglo sin paginación, `createdAt desc`; filtros extremos/ubicación/fechas; código mediante detalle, sin filtro N/S. | Historial. |
| DP-11 | Entero >= 1 confirmado; máximo de líneas y notas no documentado. No inventar límites. | Validaciones. |
| DP-12 | Resuelta: `type:DIRECTO`, `status:COMPLETED`; presentar como completada, sin estados editables. | Detalle e historial. |
| DP-13 | Fuera de alcance confirmado: impresión/exportación de guías. | Alcance. |
| DP-14 | Resuelta para frontend: consulta por unidad solo ejecutores; habilitar a vendedor/técnico requiere alcance seguro backend. | FR-038 y BR-018. |
| DP-15 | Resuelta: scan de unidad y `GET /hardware-items/:id/lifecycle`, solo eventos `TRANSFER_DIRECT_COMPLETED`. | FR-037. |

Ninguna se resolverá por suposición durante la implementación.

---

## 15. Coherencia con el `plan.md` de la Fase 2 y ajustes requeridos

### 15.1. Trazabilidad con el plan

| Requisitos de esta Spec | Referencia en `plan.md` |
|---|---|
| FR-001 a FR-005 | F2-C01, F2-C02, F2-C10; secciones 4.5, 4.13 y 7. |
| FR-006 a FR-016 | F2-C03, F2-C04; secciones 4.6, 4.7 y 4.8. |
| FR-017 a FR-023 | F2-C05; secciones 4.9 y 4.15. |
| FR-024, FR-025 | F2-C06; secciones 4.10 y 4.14. |
| FR-026 a FR-030 | F2-C07, F2-C08; secciones 4.11 y 4.12. |
| FR-031 a FR-034 | F2-C09; sección 4.13. |
| FR-035, FR-036 | F2-C10; sección 4.13. |
| FR-037, FR-038 | F2-C11; plan §4.14, §6 y tareas T2.7.3–T2.7.4. |
| FR-039 a FR-041 | Secciones 4.15, 8, 9 y 10. |
| BR-001 a BR-019 | Secciones 3.2 y 4.1. |
| DP-01 a DP-13 | Sección 12.2 del plan; se agregan DP-14 y DP-15. |

### 15.2. Conciliación realizada

El encargo autoriza actualizar los tres documentos: rutas reales `specs/fase_2_core/`, roles, DTOs, listado sin paginación, fechas ISO, perfil asignado, consulta logística por unidad, errores inciertos y brechas B6–B10. Se preservan las reglas de negocio y los criterios no soportados permanecen pendientes; no se rebajan para declarar la fase completa.

## 16. Criterios de finalización de la fase

La Fase 2 se considerará completada cuando:

1. Esta Spec esté aprobada y las decisiones pendientes aplicables estén resueltas o documentadas como pendientes con su impacto.
2. El contrato de Logística esté verificado y publicado (`API_CONTRACTS.md`, Swagger e implementación) y las discrepancias se hayan resuelto.
3. Se cumplan los criterios de aceptación 1 a 24, o los no verificables estén documentados como pendientes sin presentarse como completados.
4. Los roles ejecutores puedan distribuir y devolver mercadería con guías mixtas atómicas y códigos `TR-` entregados por el backend.
5. Vendedores y técnicos consulten únicamente su puesto en solo lectura, verificado con cuentas operativas reales o documentado como pendiente.
6. La prevención de envíos duplicados y el tratamiento del resultado incierto funcionen según FR-019 y FR-022.
7. Cada guía deje su registro en la bitácora, verificado manualmente.
8. La consulta de movimientos de una unidad funcione conforme a FR-037 y FR-038, o su bloqueo esté documentado.
9. No se haya implementado ninguna funcionalidad fuera de alcance.
10. Las pruebas del plan se ejecuten satisfactoriamente y `npm test`, `npm run lint`, `npx tsc -b` y `npm run build` finalicen sin errores.
11. La implementación cumpla la Constitución, sin dependencias nuevas ni dependencias circulares.
12. El `task.md` existente refleje la implementación validada, las brechas backend y las verificaciones reales pendientes.

La implementación de cada capacidad queda sujeta al cierre de sus dependencias contractuales. El encargo actual autoriza implementar las capacidades viables conforme a `task.md`, sin integrar previamente los documentos en `develop`. No se autorizan commits ni publicación.

---

**Fin de la especificación de la Fase 2.**