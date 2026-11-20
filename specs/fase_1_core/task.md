# Tareas de Implementación — Fase 1: Inventario y Catálogo

> **Excepción autorizada por el usuario (2026-11-19):** los documentos de esta fase se registran directamente en `feature/fase-1-inventario` y se permite implementar sin incorporarlos previamente a `develop`. Solo se exceptúa ese prerrequisito; permanecen vigentes la Constitución, los contratos y el alcance definido. No se autorizan merges ni pushes.

## Estado documental

- **Spec:** `specs/fase_1_core/spec.md` (autorizado para el alcance implementable).
- **Plan:** `specs/fase_1_core/plan.md` (autorizado para ejecución progresiva).
- **Fase:** 1 — M1 Inventario y Catálogo.
- **Rama de implementación prevista:** `feature/fase-1-inventario`, creada desde `develop` actualizado; documentos incorporados en esta rama por excepción autorizada.

Las tareas de este documento cubren las capacidades que cuentan con soporte suficiente en el contrato vigente para su implementación. Se mantienen pendientes, sin tareas de desarrollo en esta lista, las capacidades que requieren nuevos endpoints, DTO incompletos o decisiones de alcance/ADR. Cuando se resuelvan, se actualizará este `task.md` en una intervención posterior.

## Dependencias de Fase 0

Antes de iniciar la implementación, verificar que Fase 0 esté integrada en `develop` y que estén disponibles:

- Cliente Axios centralizado, JWT Bearer y manejo común de `401`, `403`, red y errores del backend.
- `authStore`, `locationStore`, `ProtectedRoute`, `RoleGuard` y `Can`.
- `GET /locations?active=true` y selector de ubicación operativa.
- Estados reutilizables de carga, vacío y error, y notificaciones.
- Router y navegación centralizados.
- Infraestructura de pruebas existente, si corresponde a validaciones ya aprobadas para el proyecto.

No duplicar ni reemplazar estos servicios transversales dentro de Inventario.

---

## Fase 1.1: Preparación del módulo

- [x] **T1.1.1: Verificación del repositorio y documentos aprobados**
  - Confirmar autorización de `spec.md` y `plan.md` y su commit en la rama de Fase 1, según la excepción registrada.
  - Verificar la integración de los cimientos de Fase 0.
  - Consultar `backend-api/specs/API_CONTRACTS.md` desde `origin/develop` y contrastar los DTO utilizados con Swagger/DTO backend cuando el contrato escrito sea abreviado.
  - No incluir operaciones cuyo DTO o alcance siga pendiente de definición.

- [x] **T1.1.2: Estructura del dominio inventory**
  - Crear la estructura de `src/modules/inventory/` según `plan.md`.
  - Mantener componentes, hooks, modelos, validación y servicios dentro del módulo.
  - Reutilizar `src/services/api/axiosInstance.ts` y los componentes transversales de Fase 0.
  - No crear persistencia local, sincronización offline ni una instancia HTTP propia.

- [x] **T1.1.3: Modelos TypeScript contratados**
  - Definir modelos para Category, CatalogItem, HardwareItem, QuantityStock y respuestas paginadas con los campos confirmados por el contrato.
  - Representar los enums `ItemStatus` y los roles usando los valores exactos documentados.
  - No añadir propiedades inferidas en los DTO.

---

## Fase 1.2: Categorías

- [x] **T1.2.1: Servicio de categorías**
  - Implementar `GET /categories` con query opcional `active`.
  - Implementar `POST /categories` con los campos permitidos por el DTO (`name`, `description`, `active`).
  - Implementar `PATCH /categories/:id` con UUID y actualización parcial conforme al DTO.
  - Utilizar Axios centralizado y normalizar errores mediante la infraestructura transversal.

- [x] **T1.2.2: Consulta y filtros de categorías**
  - Crear la vista de categorías para usuarios autenticados.
  - Mostrar los campos disponibles, incluido `productsCount` cuando esté presente.
  - Permitir filtrar por estado activo usando `active` del backend.
  - Representar estados de carga, vacío y error.

- [x] **T1.2.3: Formularios de categoría**
  - Crear formularios de alta y edición para `ADMIN`.
  - Validar localmente solo las reglas confirmadas por el DTO.
  - Mostrar errores de validación (`400`), conflicto (`409`) y recurso inexistente (`404`) según respuesta backend.
  - Actualizar la vista a partir de la respuesta confirmada por el servidor.

- [x] **T1.2.4: Autorización de categorías**
  - Restringir mutaciones a `ADMIN` mediante `Can`.
  - Mantener lectura para `ADMIN`, `VENDEDOR` y `TECNICO`.
  - Tratar `403` como rechazo del backend, aunque la UI haya ocultado la acción.

---

## Fase 1.3: Catálogo maestro

- [x] **T1.3.1: Servicio de catálogo**
  - Implementar `GET /catalog` con `categoryId`, `active`, `search`, `page` y `limit` según el contrato.
  - Implementar `GET /catalog/:id` y adaptar el detalle `{ item, categoryName, stockSummary, totalStockOverall }`.
  - Implementar `POST /catalog` con el DTO confirmado.
  - Usar la instancia Axios centralizada.

- [x] **T1.3.2: Listado y búsqueda de catálogo**
  - **Validado:** corrección del DTO de backend comprobada por API autenticada con productos activos e inactivos de prueba; el frontend conserva el parámetro booleano contractual.
  - Crear la vista del catálogo con búsqueda y filtros contratados.
  - Consumir paginación del backend (`page`, `limit`, `total`), con defaults documentados 1 y 50.
  - Mostrar tipo de seguimiento (`isSerialized`), categoría, precio y estado cuando esos campos estén incluidos en la respuesta.
  - Representar carga, lista vacía, error y reintento.

- [x] **T1.3.3: Detalle de producto y resumen por ubicación**
  - Presentar los campos recibidos en `item` y `categoryName`.
  - Mostrar `stockSummary` y `totalStockOverall` por ubicación sin recalcularlos en frontend.

- [x] **T1.3.4: Formulario administrativo de catálogo**
  - Implementar creación para `ADMIN` con los campos aceptados por el DTO publicado.
  - Obtener categorías desde `categoryService` y permitir seleccionar una categoría activa.
  - Presentar validaciones, conflictos y errores del backend sin enviar propiedades desconocidas.

- [x] **T1.3.5: Autorización de catálogo**
  - Permitir consultas a los tres roles.
  - Restringir la creación implementada a `ADMIN` usando `Can`; las actualizaciones siguen diferidas hasta confirmar el DTO de `PATCH /catalog/:id`.

---

## Fase 1.4: Ingreso de hardware serializado

- [x] **T1.4.1: Servicio de validación de series**
  - Implementar `POST /hardware-items/validate-serials` con `{ serialNumbers }`.
  - Presentar `existingSerials` y `allValid` asociados a las series ingresadas.
  - Tratar esta consulta como asistencia de formulario; el resultado final del ingreso corresponde al backend.

- [x] **T1.4.2: Formulario de ingreso serializado masivo**
  - Implementar `POST /hardware-items/batch-inbound` con `{ locationId, items }`.
  - Permitir agregar ítems con `catalogId`, serie y precios según DTO.
  - Permitir agregar `children` anidados con los campos contractuales.
  - Permitir revisar un resumen y confirmar el envío atómico.
  - Mostrar el arreglo de HardwareItems y componentes devuelto por el backend.
  - No crear entidad ni interfaz de consulta/edición/anulación de lote.

- [x] **T1.4.3: Ubicación y contexto operativo**
  - Cargar ubicaciones activas mediante las capacidades de Fase 0.
  - Enviar el `locationId` seleccionado requerido por el endpoint.
  - No inferir restricciones de ubicación por rol o usuario no establecidas en el contrato.

- [x] **T1.4.4: Autorización de ingreso**
  - Restringir alta masiva y validación de series a `ADMIN`.
  - Mantener la validación definitiva en el backend.

---

## Fase 1.5: Búsqueda y relación de hardware

- [x] **T1.5.1: Búsqueda scanner-first**
  - Integrar la captura HID reutilizable de `src/hooks/useBarcodeScanner.ts` y `src/services/scanner/`.
  - Permitir ingreso manual del código como alternativa.
  - Consultar `GET /hardware-items/scan/:code` y presentar la respuesta documentada: serie/código, ubicación y relación padre/hijos cuando estén incluidas.
  - Manejar código no encontrado, carga y error de conexión.

- [x] **T1.5.2: Acople de componentes**
  - Implementar `POST /hardware-items/:id/children` con `{ childIds }` para `ADMIN`.
  - Presentar restricciones backend de mismo sitio, estado `EN_STOCK`, no autoacople y ausencia de ciclos.
  - Refrescar la relación después de éxito mediante la respuesta confirmada o una consulta disponible.

- [x] **T1.5.3: Desacople de componentes**
  - Implementar `DELETE /hardware-items/:id/children/:childId` para `ADMIN`.
  - Actualizar la relación y reflejar que el componente queda sin padre, de acuerdo con la respuesta/consulta disponible.

---

## Fase 1.6: Stock por cantidad

- [x] **T1.6.1: Servicio de stock cuantitativo**
  - Implementar `GET /quantity-stock` con `locationId`, `categoryId`, `catalogItemId`, `lowStock`, `page` y `limit`.
  - Implementar `POST /quantity-stock/inbound` con `catalogId`, `locationId`, `quantity` y precios opcionales admitidos.
  - Implementar `PATCH /quantity-stock/adjust` con `catalogId`, `locationId`, `newQuantity` y `reason` obligatorio.
  - Consumir Axios centralizado y manejar errores comunes.

- [x] **T1.6.2: Vista de stock por cantidad**
  - Mostrar saldos y campos recibidos, incluyendo `minStockThreshold` e `isLowStock`.
  - Implementar filtros y paginación disponibles.
  - Permitir a todos los roles consultar; mostrar entrada y ajuste solo a `ADMIN`.
  - No generar alertas de M5 ni calcular una condición distinta de la respuesta del backend.

- [x] **T1.6.3: Formularios de entrada y ajuste**
  - Crear formularios administrativos para entrada y ajuste absoluto.
  - Solicitar `reason` para ajustes y mostrar el saldo retornado.
  - Presentar mensajes de éxito, validación, autorización y error de red.

---

## Fase 1.7: Datos de etiquetas

- [x] **T1.7.1: Servicio de etiquetas masivas**
  - Implementar `POST /hardware-items/barcode-labels/batch` con `{ hardwareItemIds }` y el arreglo de etiquetas documentado.
  - Mantener acceso a los tres roles conforme al contrato.

- [x] **T1.7.2: Vista previa de datos de etiqueta**
  - Mostrar `barcodeValue`, `title`, `specsSummary`, `locationName` y `price` para etiquetas masivas.
  - Mantener la solicitud de datos separada de la transmisión a una impresora.
  - No implementar protocolo físico, WebSerial/WebSocket ni codificación local pendiente de ADR.

---

## Fase 1.8: Integración de interfaz y navegación

- [x] **T1.8.1: Rutas del módulo**
  - Registrar `/inventory`, `/inventory/inbound`, `/inventory/stock`, `/inventory/catalog` y `/inventory/categories`.
  - Usar `ProtectedRoute` y guards existentes.

- [x] **T1.8.2: Navegación**
  - Añadir la entrada de Inventario al menú definido por el plan.
  - Restringir solo las acciones administrativas; las consultas deben respetar los tres roles autorizados.

- [x] **T1.8.3: Estados y feedback compartidos**
  - Reutilizar estados de carga, vacío, error y notificación de Fase 0 en las vistas de Inventario.
  - Presentar errores `message` string o arreglo sin exponer información sensible.
  - Permitir reintentar consultas cuando corresponda.

---

## Fase 1.9: Validación de la entrega

- [x] **T1.9.1: Revisión de contratos utilizados**
  - Confirmar cada método, ruta, query param, body y respuesta utilizados contra `API_CONTRACTS.md` y los DTO confirmados.
  - Confirmar que no se incluyan propiedades no contratadas.

- [x] **T1.9.2: Revisión de autorización y dependencias**
  - Confirmar las acciones administrativas restringidas a `ADMIN` y las consultas/etiquetas disponibles para los tres roles autorizados.
  - Confirmar la reutilización de Axios, auth, ubicación y feedback de Fase 0.
  - Confirmar que no se haya añadido persistencia offline ni lógica de M2–M8 fuera de alcance.

- [ ] **T1.9.3: Revisión de criterios de aceptación**
  - **Parcial:** validación automatizada y consultas autenticadas correctas. Falta cerrar el filtro inactivo del backend y comprobar escrituras válidas con datos de prueba autorizados; no se crearon registros de Inventario en esta revisión.
  - Verificar los criterios de aceptación de `specs/fase_1_core/spec.md` que corresponden a los alcances incluidos en estas tareas.
  - Verificar que las capacidades pendientes no se reporten como implementadas.
  - Actualizar las tareas a `[x]` solo después de completar y verificar su resultado.

---

## Capacidades expresamente diferidas

Estas capacidades no tienen tareas de implementación en este documento. Cuando se definan en backend o se apruebe su alcance, deberán incorporarse mediante una actualización de `spec.md`, `plan.md` y `task.md`:

- Consulta, edición y anulación de lotes como entidad (el contrato actual solo soporta `POST /hardware-items/batch-inbound`).
- Alta de productos por pase con stock cero.
- Cola/flujo de extracción y aprobación M2/M5; también queda fuera la invocación de `POST /hardware-items/approve-used` hasta que se confirme su alcance funcional frontend.
- Hoja de vida `GET /hardware-items/:id/lifecycle` (M6).
- Actualización de catálogo mediante `PATCH /catalog/:id`, hasta confirmar el DTO completo.
- Alta serializada individual `POST /hardware-items`, listado `GET /hardware-items`, detalle `GET /hardware-items/:id` y actualización general `PATCH /hardware-items/:id`, hasta confirmar sus DTO completos.
- Datos de etiqueta individual `GET /hardware-items/:id/barcode-label`, hasta confirmar su DTO de respuesta.
- Impresión física, EAN y transporte a impresora hasta la aprobación del ADR y del formato correspondiente.

## Regla de ejecución

La implementación deberá respetar `constitution.md`, `spec.md`, `plan.md` y el contrato vigente. Si una tarea incluida encuentra un DTO incompleto o una discrepancia, se detendrá únicamente esa integración y se documentará la dependencia; no se completará mediante suposiciones ni se ampliará el alcance unilateralmente.

## Registro de avance — bloque 1 (2026-11-19)

- Completadas T1.1.1, T1.1.2 y T1.2.1–T1.2.4 según la excepción autorizada.
- T1.1.3 parcial: solo modelos de categorías; catálogo, hardware y cantidades se definirán con sus respectivos bloques.
- Integrados `GET /categories`, `POST /categories`, `PATCH /categories/:id`; ruta `/inventory/categories` y navegación de Operaciones. La integración de T1.8 sigue parcial hasta disponer de las otras pantallas.
- Validación automatizada: `npm test` 23 archivos/191 pruebas aprobadas; `npm run lint`, `npm run build` (incluye TypeScript) y `git diff --check` correctos. Incluye RBAC de los tres roles, formularios, filtros, estados, carreras de consulta y bloqueo de cambio de edición durante guardado.
- Revisión frontend-builder/frontend-reviewer: se corrigió la pérdida de edición por respuesta tardía de otra categoría. Skill utilizada: vercel-react-best-practices.
- Backend real no disponible en `http://localhost:3000/api` (sin respuesta HTTP); pruebas de servicio con HTTP mockeado y contraste estático con contrato/DTO de `origin/develop`. No se afirma verificación en vivo ni visual en navegador.
- Siguiente bloque: modelos de catálogo y T1.3.1–T1.3.5, manteniendo diferida la actualización de catálogo con DTO incompleto.

## Registro de avance — catálogo (2026-11-19)

- T1.3.1–T1.3.5 implementadas: GET paginado, detalle con stock por ubicación y POST administrativo. No se incorpora PATCH diferido.
- Pruebas dirigidas de catálogo/navegación: 16 aprobadas; router: 23 aprobadas; build con TypeScript correcto. Revisión global de lint/pruebas pendiente al integrar los demás bloques en curso.
- Filtros según contrato y cancelación de respuestas antiguas; posible incidencia del backend: `@Type(() => Boolean)` en filtro `active` puede interpretar texto `false` como verdadero. No se altera el backend ni se inventa un parámetro alternativo.
- Verificación real aún bloqueada desde este entorno: conexión rechazada a localhost:3000 con la restricción de red y fuera de ella. Se solicitó dirección accesible al usuario mientras continúa implementación.

## Registro de avance — cantidades (2026-11-19)

- T1.6.1–T1.6.3 implementadas con GET paginado, filtros contratados, entrada y ajuste absoluto con motivo y confirmación.
- Selector reutilizable de catálogo por nombre/SKU con paginación real; únicamente se filtra el tipo de seguimiento sobre los productos recibidos, sin inventar un query de API.
- Validación dirigida: 12 pruebas en 3 archivos aprobadas; ESLint de archivos propios correcto. Revisión de rutas y suite global al finalizar integración.
- Se conserva pendiente la verificación contra servidor accesible y cuentas de prueba.

## Registro de avance — hardware y etiquetas (2026-11-19)

- T1.1.3, T1.4.1–T1.4.4, T1.5.1–T1.5.3 y T1.7.1–T1.7.2 implementadas y verificadas mediante pruebas de servicios/componentes y contraste de DTO.
- Ingreso atómico con equipos/componentes, series opcionales, validación de duplicados y resumen; catálogo por nombre/SKU y ubicación activa.
- Consultas por HID o teclado, acople por serie/ID resuelto y desacople; etiquetas masivas con datos del backend, sin impresión física.
- Se conservó el diseño existente y se corrigió el regreso del resumen de ingreso: el formulario permanece montado y conserva selecciones de equipos e hijos.
- Pruebas dirigidas: 14 aprobadas en 4 archivos. Suite final única: 32 archivos/241 pruebas aprobadas. ESLint, TypeScript/build y diff-check correctos. No se ejecutó la suite completa después de cada cambio.

## Registro de cierre técnico — integración y diseño (2026-11-19)

- T1.8.1–T1.8.3: cinco rutas implementadas bajo `/inventory`, navegación por secciones, ingreso restringido a ADMIN, consultas y datos de etiquetas para los tres roles. Se preservaron las mejoras visuales existentes, modales y retorno de foco.
- T1.9.1–T1.9.2: contraste de solicitudes/modelos contra contrato `origin/develop`, DTO y Swagger local; guardas JWT/RBAC y reutilización de Axios/feedback verificadas mediante código y pruebas de rutas/componentes.
- Backend iniciado temporalmente desde `dist/main.js`, sin recompilar ni modificar archivos del backend. Swagger respondió 200. La lectura Prisma con `active:true` confirmó resuelto el error P2022 anterior.
- Inicio de sesión con la cuenta ADMIN facilitada por el usuario: satisfactorio. Perfil, categorías, catálogo con/sin active, stock paginado y ubicaciones devolvieron 200. Sin JWT, categorías/catálogo/stock devolvieron 401. No se guardaron credenciales ni tokens en el repositorio.
- Payload vacío autenticado rechazado con 400 en creación de categoría/catálogo, ingreso de hardware, entrada/ajuste de cantidad y etiquetas masivas. No se enviaron altas válidas de Inventario ni se ejecutaron migraciones.
- Discrepancia de estado HTTP observada: login y validate-serials devuelven 201 aunque el contrato describe 200; el cliente acepta 2xx y no depende de la distinción. No se modificó backend para ocultarla.
- Bloqueo confirmado en backend: `plainToInstance(QueryCatalogHttpDto, {active: 'false'})` produce `active: true` por `@Type(() => Boolean)`. El frontend envía el booleano contractual; no se inventa un workaround. T1.3.2 y T1.9.3 permanecen parciales hasta corrección por backend/validación final.
- Suite completa ejecutada una vez al cerrar: 241 pruebas aprobadas en 32 archivos. TypeScript, ESLint, build de producción y `git diff --check` correctos. Las altas válidas y transiciones persistidas en vivo no se consideran comprobadas: requieren datos de prueba autorizados.
- Capacidades expresamente diferidas continúan excluidas; este cierre no implica CRUD de lotes, pases, M6, aprobación usada ni impresión física.

## Cierre de T1.3.2 — filtro real de catálogo (2026-11-19)

- Corrección del DTO de backend confirmada en el código disponible y mediante API local autenticada. No se modificó código ni esquema del backend.
- Con los registros aislados `SDD-CLOSE-1795144709524`: `active=true` devolvió los dos productos activos; `active=false` devolvió únicamente el producto inactivo. La búsqueda encontró los tres productos y páginas 1/2 con límite 1 devolvieron elementos distintos y total 3.
- Pruebas frontend dirigidas: `npm test -- src/modules/inventory/services/catalogService.test.ts src/modules/inventory/pages/CatalogPage.test.tsx`: 11 pruebas aprobadas en 2 archivos. El envío de `false` y la paginación ya estaban implementados correctamente; no requirieron cambios de interfaz.
- La incidencia histórica del filtro descrita en registros anteriores queda resuelta por la corrección de backend y esta verificación real.
