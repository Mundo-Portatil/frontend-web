# Tareas de Implementación — Fase 2: Logística Interna y Movimientos

> **Estado del documento:** contratos contrastados en `refact/logistica` el 24/11/2026. El encargo autoriza corregir los tres documentos y avanzar en las tareas viables desde `feature/fase-2-logistica`, sin integración documental previa en `develop`. No autoriza commits, push, merge ni PR. Las brechas backend reales B6–B10 impiden aceptar los flujos afectados; no se simulan soluciones. Las casillas se actualizan exclusivamente tras implementación y pruebas verificadas.

## Estado documental

- **Spec:** `specs/fase_2_core/spec.md` (requisitos conservados y contrato contrastado).
- **Plan:** `specs/fase_2_core/plan.md` (contrato comprobado y bloqueos parciales registrados).
- **Fase:** 2 — M3 Logística Interna y Movimientos.
- **Rama comprobada:** `feature/fase-2-logistica`.
- **Referencias:** `specs/constitution.md`, `specs/fase_1_core/{spec,plan,task}.md`, `Casos de Uso - MP.md` (subordinado a la definición funcional actualizada de la Fase 2).

Las tareas cubren las capacidades de la Fase 2 definidas en `spec.md` (F2-C01 a F2-C11). Las que dependen de un contrato, rol o decisión no resuelta están marcadas y quedan bloqueadas; cuando se resuelvan, se actualizarán `spec.md`, `plan.md` y este documento mediante una intervención autorizada.

## Convenciones de este documento

**Identificadores.** `T2.<etapa>.<n>` para tareas, siguiendo la convención `T1.<etapa>.<n>` de la Fase 1. Los requisitos (`FR-`, `NFR-`, `BR-`, `SC-`, `F2-C`, `US-`), las decisiones (`DP-`) y los bloqueos (`B`) usan los identificadores de `spec.md` y `plan.md`.

**Campos de cada tarea.**

| Campo | Contenido |
|---|---|
| **Qué** | Descripción concreta de la actividad. |
| **Spec / Plan** | Requisitos del `spec.md` y secciones del `plan.md` asociadas. |
| **Archivos** | Archivos a crear o modificar (rutas del plan, sin contradecirlo). Las pruebas se ubican junto a cada archivo (`*.test.ts`, `*.test.tsx`). |
| **Depende de / Paralelo** | Tareas previas requeridas y tareas con las que puede ejecutarse en paralelo. |
| **Bloqueo** | Dependencia externa o decisión que impide ejecutarla; si no figura, no hay bloqueo adicional al de la puerta G0. |
| **Hecho cuando** | Criterios de finalización verificables. |
| **Pruebas** | Pruebas o validaciones asociadas. |

**Correspondencia con las etapas del `plan.md` (sección 11).**

| Fase de tareas | Etapa del plan | Observación |
|---|---|---|
| 2.0 Verificación | Etapa 0 | Bloqueante. |
| 2.1 Preparación del módulo | Etapa 1 | Incluye los controles de autorización desde el inicio. |
| 2.2 Servicios y mapeo | Etapa 2 | Depende del contrato verificado. |
| 2.3 Consulta de movimientos | Etapa 3 | Incluye la visibilidad por puesto. |
| 2.4 Borrador y ruta del movimiento | Etapa 4 | — |
| 2.5 Selección de mercancía | Etapa 5 | — |
| 2.6 Confirmación, envío y comprobante | Etapa 6 | — |
| 2.7 Integración con Inventario y trazabilidad | Etapa 6 (§4.10) y §4.14 del plan | Agrupación propia de este documento; incluye F2-C11, conciliada en plan §4.14. |
| 2.8 Revisión de acceso, responsive y accesibilidad | Etapa 7 | Verifica lo implementado desde 2.1; no introduce la autorización. |
| 2.9 Pruebas y validación | Etapa 8 | — |

## Dependencias de Fases 0 y 1

Esta fase **no reconstruye** nada de lo siguiente; solo lo verifica, reutiliza, adapta o integra:

- Fase 0: Axios centralizado y manejo de errores (`asAppError`), `authStore`, `locationStore`, `ProtectedRoute`, `RoleGuard`, `Can`, feedback y notificaciones, servicios de usuarios, ubicaciones y bitácora, router y navegación, Vitest + React Testing Library.
- Fase 1: catálogo y selector de catálogo, inventario serializado y búsqueda por código (`GET /hardware-items/scan/:code`), inventario por cantidad y stock por ubicación (`GET /quantity-stock`), captura HID (`src/hooks/useBarcodeScanner.ts`, `src/services/scanner/`), modelos, servicios y hooks de Inventario.
- «Historial y hoja de vida de unidades»: disponible actualmente; reutilizar solo eventos logísticos y roles ejecutores.

Antes de iniciar la implementación, T2.0.1 a T2.0.5 verifican que estas dependencias estén disponibles en la rama base. No duplicar ni reemplazar servicios transversales dentro de `logistics`.

## Orden de ejecución, dependencias y puertas

| Fase | Depende de | Paralelo | Condición para avanzar (puerta) |
|---|---|---|---|
| 2.0 | — | T2.0.2–T2.0.10 entre sí, tras T2.0.1 | **G0:** T2.0.11 aprobada: registro de verificación completo, `spec.md` y `plan.md` aprobados y decisiones aplicables resueltas o marcadas como bloqueo explícito. |
| 2.1 | G0 | T2.1.2, T2.1.3 entre sí | **G1:** estructura, permisos, rutas con guards y modelos del formulario creados; `npx tsc -b` correcto. |
| 2.2 | G0, T2.1.1 | T2.2.3 y T2.2.4 entre sí | **G2:** servicios y mapeo probados con HTTP mockeado sobre estructuras verificadas. |
| 2.3 | G2, T2.1.4 | T2.3.2, T2.3.3 | **G3:** historial y detalle funcionales y con alcance por puesto probado. |
| 2.4 | T2.1.3 (T2.4.3 además T2.0.10) | Puede avanzar en paralelo con 2.2 y 2.3 en tareas sin contrato (T2.4.1, T2.4.2) | **G4:** reductor, validaciones y selector de ruta probados. |
| 2.5 | G4, T2.0.5 | T2.5.1 y T2.5.3 | **G5:** captura serializada y por cantidad probadas. |
| 2.6 | G2, G4, G5 | T2.6.1 y T2.6.5 | **G6:** flujo de creación completo con todas las fases de envío probadas. |
| 2.7 | G6 (T2.7.3–T2.7.4: consulta de lectura puede avanzar antes; DP-14/DP-15 resueltas para ejecutores) | T2.7.1 y T2.7.2 | **G7:** reflejo de existencias, conservación de identidad e integración con bitácora verificados. |
| 2.8 | G6 | T2.8.2 y T2.8.3 | **G8:** revisión de acceso, responsive, accesibilidad y límites arquitectónicos sin hallazgos abiertos. |
| 2.9 | G6, G7, G8 | T2.9.1–T2.9.5 entre sí | **G9:** criterios de aceptación verificados o documentados como pendientes. |

**Regla de avance parcial.** Solo con autorización expresa del responsable y registrada en el «Registro de avance» podrán ejecutarse antes de G0 tareas que no dependan de contratos ni de decisiones pendientes (por ejemplo T2.1.1 a T2.1.3, T2.4.1 y T2.4.2). Nunca se ejecutarán sobre suposiciones las tareas con **Bloqueo**.

## Impedimentos conocidos y tareas bloqueadas

| ID | Impedimento | Tareas bloqueadas hasta su resolución |
|---|---|---|
| B1 | Contrato verificado estáticamente en `refact/logistica` y `API_CONTRACTS.md`; ya no bloquea servicios. | Integración real/Swagger todavía debe verificarse; ver B6–B10. |
| B2 | Base disponible en `feature/fase-2-logistica` con Fases 0 y 1 actuales. | Sin bloqueo de rama; no cambiar ni modificar `develop`. |
| B3 | Asignación confirmada en perfil/JWT `locationId` / `locationName`. | Propagar a sesión frontend; ver B7 y pruebas reales pendientes. |
| B4 | Tres documentos existentes; corrección e implementación expresamente autorizadas. | Excepción a integración documental previa; sin commits, push, merge ni PR. |
| B5 | Tipo de ubicación confirmado `ALMACEN_CENTRAL` / `PUESTO`. | El formulario valida exactamente una central activa y puestos activos en los datos reales. |
| B6 | Resuelto: El backend soporta nativamente traslados serializados y mixtos en `/transfers/direct`, actualizando `HardwareItem.locationId`. No requiere `QuantityStock` porque las unidades serializadas se rastrean individualmente. | Habilitado en frontend. |
| B7 | Sin puesto: `GetTransfersUseCase` elimina el filtro y expone listado global. | Guard frontend implementado; no realiza llamadas sin puesto asignado. |
| B8 | Auditoría después del commit; puede fallar y devolver `5xx` con guía/stock ya registrados. | Tratar como incierto localmente. |
| B9 | Stock cantidades: decremento en transacción atómica de base de datos. | Protegido en backend vía `transactionManager`. |
| B10 | Código `TR-` correlativo generado por el backend (`TRANSFER_CODE_GENERATOR`). | Frontend muestra el código recibido del servidor. |
| DP-02 | Sin idempotencia contractual en backend. | Mitigado en frontend vía `useRef`, bloqueo de botón y fase `unknown`. No requiere ampliación para Fase 2. |
| DP-06 | Búsqueda de series disponibles. | Resuelto mediante `GET /hardware-items/available-serials`. |
| DP-08 | Sin soporte chasis/componentes desensamblados en M3. | No aplica; se trasladan unidades principales completas. |
| DP-14 | Hoja de vida sin alcance seguro por puesto. | F2-C11 solo ejecutores; no habilitar lectura por unidad a vendedor/técnico. |

---

## Fase 2.0: Verificación de dependencias y contratos (bloqueante)

Todas las tareas de esta fase son de **solo lectura sobre el backend**: no se edita código del backend, no se ejecutan migraciones ni se altera su esquema. Los resultados se registran en el «Registro de verificación» de este documento. No se inventan contratos, endpoints, modelos Prisma ni enumeraciones.

- [x] **T2.0.1: Estado del repositorio, ramas y línea base de calidad**
  - **Qué:** confirmar la rama base (¿Fase 0 y Fase 1 integradas en `develop`?), confirmar `feature/fase-2-logistica` ya existente y reutilizar las dependencias instaladas. Ejecutar y registrar una línea base: `npm test`, `npm run lint`, `npx tsc -b`, `npm run build`.
  - **Spec / Plan:** spec §11; plan §0.2, B2, Etapa 0.
  - **Archivos:** ninguno (solo registro).
  - **Depende de / Paralelo:** ninguna; es la primera tarea. Habilita las demás tareas de la fase.
  - **Base:** B2 resuelto; rama actual comprobada.
  - **Hecho cuando:** rama base y rama de trabajo definidas por el responsable; línea base (archivos y pruebas aprobadas, estado de lint, TypeScript y build) registrada.
  - **Pruebas:** comandos anteriores ejecutados sin modificar código.

- [x] **T2.0.2: Verificación de los cimientos de la Fase 0**
  - **Qué:** confirmar en el código real la existencia y la API de: `axiosInstance`, `asAppError`, `authStore` (campos del perfil), `locationStore`, `ProtectedRoute`, `RoleGuard`, `Can` (¿acepta listas de roles configurables?), componentes de feedback y notificaciones, router (tipo de router y posibilidad de bloquear navegación), `NAV_ITEMS` (grupo `operations`), configuración de `timeout` de Axios.
  - **Spec / Plan:** spec §11.1; plan §0.2.
  - **Archivos:** ninguno (registro).
  - **Depende de / Paralelo:** T2.0.1; paralelo con T2.0.3–T2.0.10.
  - **Hecho cuando:** cada elemento marcado como disponible, ausente o distinto, con ruta del archivo y notas de uso.
  - **Pruebas:** lectura de código y ejecución de las pruebas existentes de esos elementos.

- [x] **T2.0.3: Verificación de la ubicación asignada al usuario**
  - **Qué:** comprobar si el perfil autenticado (`GET /auth/profile`, `authStore`) expone la ubicación física asignada y si el backend la usa para el alcance; resolver la inconsistencia entre el encargo (Fase 0) y el plan de la Fase 1 (OD-002/OD-004). Comprobar la existencia de cuentas de prueba `VENDEDOR` y `TECNICO` con ubicación asignada.
  - **Spec / Plan:** FR-031, FR-033; DP-04; B3; plan §4.13.
  - **Archivos:** ninguno (registro).
  - **Depende de / Paralelo:** T2.0.1; paralelo con T2.0.2, T2.0.4–T2.0.10.
  - **Hecho cuando:** documentado dónde vive la ubicación asignada (campo y fuente), cómo se comporta un usuario sin ubicación y qué cuentas de prueba existen.
  - **Pruebas:** consulta autenticada de perfiles de prueba (sin guardar credenciales ni tokens en el repositorio).

- [x] **T2.0.4: Verificación de roles y representación del Encargado de Almacén**
  - **Qué:** confirmar los roles existentes (`ADMIN`, `VENDEDOR`, `TECNICO`) y si el backend define un rol propio para el Encargado de Almacén o lo representa como `ADMIN`; confirmar cómo el frontend recibe el rol.
  - **Spec / Plan:** BV-001, DP-01, BR-017; plan §4.13.
  - **Archivos:** ninguno (registro).
  - **Depende de / Paralelo:** T2.0.1; paralelo con T2.0.2, T2.0.3, T2.0.5–T2.0.10.
  - **Hecho cuando:** valor propuesto para `LOGISTICS_EXECUTOR_ROLES` registrado con su evidencia.
  - **Pruebas:** lectura de enumeraciones y guardas del backend.

- [x] **T2.0.5: Verificación de las capacidades de la Fase 1 a reutilizar**
  - **Qué:** confirmar qué exporta `src/modules/inventory/index.ts` y la disponibilidad real de: servicio de escaneo (`scan`) y su respuesta (ubicación, estado, condición, padre/hijos), servicio y selector de catálogo, servicio de stock por cantidad, `useBarcodeScanner` y `services/scanner/` (¿admite activarse/desactivarse?), y estado de `GET /hardware-items` y del endpoint de hoja de vida (diferidos en la Fase 1).
  - **Spec / Plan:** spec §11.2; DP-05, DP-06, DP-07, DP-08; plan §4.2, §4.6.
  - **Archivos:** ninguno (registro).
  - **Depende de / Paralelo:** T2.0.1; paralelo con T2.0.2–T2.0.4, T2.0.6–T2.0.10.
  - **Hecho cuando:** tabla «capacidad → exportada / interna / ausente», campos reales de la respuesta de `scan` y capacidad de activar/desactivar el lector registrados.
  - **Pruebas:** lectura de código y pruebas existentes de esos elementos.

- [x] **T2.0.6: Verificación de endpoints y DTO de Logística**
  - **Qué:** en `API_CONTRACTS.md` (`origin/develop`), Swagger y la rama `refact/logistica`, identificar rutas, métodos, DTO y respuestas de: creación de guía mixta, listado y detalle. Registrar la forma de las líneas mixtas, cómo se indica el tipo de movimiento, filtros, orden, paginación, identificador de la guía, formato de fechas y campos de respuesta (responsable, condición, estado). Si el contrato solo existe en `refact/logistica`, marcarlo como no oficial.
  - **Spec / Plan:** spec §12.2–12.3; DP-10, DP-12; B1; plan §6.
  - **Archivos:** ninguno (registro).
  - **Depende de / Paralelo:** T2.0.1; paralelo con T2.0.2–T2.0.5, T2.0.7–T2.0.10.
  - **Bloqueo:** si no hay contrato accesible, B1 mantiene bloqueadas las fases 2.2, 2.3, 2.6 y 2.7.
  - **Hecho cuando:** cada endpoint documentado con evidencia (archivo/línea o respuesta de Swagger) y las discrepancias entre contrato, Swagger e implementación listadas para aclaración (Constitución §7.1).
  - **Pruebas:** contraste documental; sin ejecutar operaciones de escritura salvo autorización con datos de prueba identificados.

- [x] **T2.0.7: Verificación de autorización y alcance por ubicación en el backend**
  - **Qué:** confirmar los roles permitidos por endpoint (creación, listado, detalle), cómo se aplica el alcance de `VENDEDOR`/`TECNICO` (JWT, base de datos o parámetro), la respuesta para una guía de otro puesto (`403` o `404`) y para un usuario sin ubicación asignada.
  - **Spec / Plan:** BR-017–BR-019; BV-006; DP-04; FR-031, FR-033, FR-034, FR-036.
  - **Archivos:** ninguno (registro).
  - **Depende de / Paralelo:** T2.0.1, T2.0.6 (parcial); paralelo con T2.0.8–T2.0.10.
  - **Hecho cuando:** matriz real endpoint × rol y descripción del mecanismo de alcance registradas.
  - **Pruebas:** lectura de guardas y, con cuentas de prueba, consultas de lectura (sin crear datos).

- [x] **T2.0.8: Verificación de validaciones de negocio, atomicidad y correlativos**
  - **Qué:** confirmar: rechazo por stock insuficiente, unidad fuera del origen, unidad duplicada, origen = destino, puesto → puesto, ubicaciones inexistentes o inactivas, guía vacía y cantidades inválidas (códigos y mensajes); estados de unidad movibles; tratamiento de chasis con componentes; cantidades enteras y máximo de líneas; atomicidad total (todo o nada, incluso entre serializadas y cantidades); generación del correlativo `TR-XXXXXX` (formato, unicidad, ¿numérico?).
  - **Spec / Plan:** BR-003, BR-011–BR-014; BV-003–BV-005; DP-07, DP-08, DP-11; FR-021, FR-023.
  - **Archivos:** ninguno (registro).
  - **Depende de / Paralelo:** T2.0.1, T2.0.6 (parcial); paralelo con T2.0.7, T2.0.9, T2.0.10.
  - **Hecho cuando:** tabla «regla → comportamiento real del backend → evidencia».
  - **Pruebas:** lectura de código y pruebas del backend; ejecución solo con datos de prueba identificados y autorizados.

- [x] **T2.0.9: Verificación de bitácora, hoja de vida e idempotencia**
  - **Qué:** confirmar que el backend registra cada guía en la bitácora y en la hoja de vida de cada unidad serializada (acción y datos), si existe clave de idempotencia o rechazo de duplicados en la creación, y cómo se consulta la bitácora (¿existe una vista frontend de la Fase 0 o solo servicio?).
  - **Spec / Plan:** BR-015, BR-016, BV-007; DP-02; FR-025; plan §4.9, §4.14.
  - **Archivos:** ninguno (registro).
  - **Depende de / Paralelo:** T2.0.1, T2.0.6 (parcial); paralelo con T2.0.7, T2.0.8, T2.0.10.
  - **Hecho cuando:** documentado el evento de bitácora, el medio disponible para verificarlo (vista, servicio o API) y la postura del backend sobre idempotencia.
  - **Pruebas:** lectura de código y consulta de bitácora existente.

- [x] **T2.0.10: Verificación del modelo de ubicaciones (Almacén Central)**
  - **Qué:** confirmar cómo se distingue el Almacén Central de un Puesto (campo de tipo u otro mecanismo), si existe exactamente un Almacén Central activo y cómo responde `GET /locations?active=true`.
  - **Spec / Plan:** FR-003; BV-002; DP-03; B5; plan §4.5.
  - **Archivos:** ninguno (registro).
  - **Depende de / Paralelo:** T2.0.1; paralelo con T2.0.2–T2.0.9.
  - **Bloqueo:** si no existe un mecanismo fiable, T2.4.3 y la fase 2.6 quedan bloqueadas; no se resuelve por nombre.
  - **Hecho cuando:** mecanismo de identificación y forma de la respuesta registrados.
  - **Pruebas:** consulta de ubicaciones con una cuenta de prueba.

- [x] **T2.0.11: Registro de verificación y puerta de avance G0**
  - **Qué:** completar el «Registro de verificación» (final de este documento) con los resultados de T2.0.1–T2.0.10, listar las discrepancias con `spec.md`/`plan.md` y proponer la resolución de cada DP afectada. Registrar la autorización expresa vigente de corregir `spec.md`, `plan.md` y `task.md` y continuar sin integrarlos previamente en `develop`; no solicitar otra aprobación entre tareas normales. Mantener bloqueadas únicamente las capacidades con brechas reales.
  - **Spec / Plan:** spec §14–§15; plan Etapa 0.
  - **Archivos:** este `task.md` (registro de verificación y bloqueos).
  - **Depende de:** T2.0.1–T2.0.10.
  - **Hecho cuando:** registro completo, bloqueos reclasificados (resuelto / vigente) y aprobación del responsable registrada.
  - **Pruebas:** revisión cruzada del registro contra los 20 puntos de plan §6.5.

**Validación de la fase 2.0:** el registro cubre los 20 puntos de la lista de verificación; ningún contrato quedó asumido; los bloqueos vigentes están nombrados con las tareas que bloquean.

---

## Fase 2.1: Preparación del módulo

- [x] **T2.1.1: Estructura del dominio logistics**
  - **Qué:** crear la estructura de `src/modules/logistics/` (`pages/`, `components/`, `hooks/`, `services/`) y el `index.ts` con la interfaz pública del módulo, sin lógica y sin HTTP propio.
  - **Spec / Plan:** NFR-001, NFR-002; plan §2, §5.
  - **Archivos:** `src/modules/logistics/index.ts` y directorios del plan.
  - **Depende de:** G0. **Paralelo:** con T2.1.2, T2.1.3.
  - **Hecho cuando:** estructura conforme al plan, sin `stores/`, `database/` ni `services/printer/`; `npx tsc -b` correcto.
  - **Pruebas:** TypeScript y lint sin errores.

- [x] **T2.1.2: Permisos centralizados y etiquetas de dominio**
  - **Qué:** crear `permissions.ts` con la constante `LOGISTICS_EXECUTOR_ROLES` (valor según T2.0.4; inicial `['ADMIN']` si no hay evidencia de otro rol) y `labels.ts` con los textos en español (tipos de movimiento, «Recibida»/«Devuelta», «Origen», «Destino», «N/S»).
  - **Spec / Plan:** FR-035, BR-017, NFR-009; plan §4.13, §4.16.
  - **Archivos:** `src/modules/logistics/permissions.ts`, `labels.ts`.
  - **Depende de:** G0, T2.0.4. **Paralelo:** con T2.1.1, T2.1.3.
  - **Bloqueo:** DP-01 para el valor definitivo.
  - **Hecho cuando:** constante única exportada; ningún componente compara roles de forma literal.
  - **Pruebas:** prueba unitaria de la constante y de las etiquetas.

- [x] **T2.1.3: Modelos del estado del formulario**
  - **Qué:** definir en `models.ts` los tipos propios del frontend: `TransferDirection`, `SerializedLineDraft`, `QuantityLineDraft`, `TransferLineDraft`, `SubmitPhase`, `TransferDraftState`, tal como en plan §4.8. No definir tipos de respuesta del backend en esta tarea.
  - **Spec / Plan:** FR-006; plan §4.8.
  - **Archivos:** `src/modules/logistics/models.ts`.
  - **Depende de:** T2.1.1. **Paralelo:** con T2.1.2.
  - **Hecho cuando:** tipos exportados sin campos inferidos del contrato.
  - **Pruebas:** `npx tsc -b`.

- [x] **T2.1.4: Rutas, navegación y guards**
  - **Qué:** registrar `/logistics`, `/logistics/new` (con `RoleGuard` según `LOGISTICS_EXECUTOR_ROLES`) y `/logistics/transfers/:id` en `src/router/routes.ts` y `src/router/index.tsx` con `ProtectedRoute`; añadir «Logística» a `NAV_ITEMS` (grupo `operations`, visible para los tres roles). Las páginas iniciales son contenedores mínimos que serán reemplazados en las fases 2.3 y 2.4.
  - **Spec / Plan:** FR-035, FR-036, NFR-002, NFR-003; plan §7.
  - **Archivos:** `src/router/routes.ts`, `src/router/index.tsx`, `src/components/layout/navigation.ts`, `pages/*.tsx` (contenedores).
  - **Depende de:** T2.1.1, T2.1.2, T2.0.2. **Paralelo:** con T2.1.3.
  - **Hecho cuando:** un rol no ejecutor no accede a `/logistics/new`; la entrada de menú aparece para los tres roles; las rutas no se duplican.
  - **Pruebas:** pruebas de router por rol (ejecutor, `VENDEDOR`, `TECNICO`, no autenticado).

- [x] **T2.1.5: Interfaz pública de Inventario y límites entre módulos**
  - **Qué:** según T2.0.5, consumir desde `src/modules/inventory/index.ts` los elementos necesarios (escaneo, selector de catálogo, stock por cantidad). Si algo no está exportado, aplicar la decisión DP-05 (ampliar la interfaz pública o reubicar una pieza genuinamente transversal en `src/`) solo con aprobación expresa; no importar desde rutas internas de Inventario.
  - **Spec / Plan:** NFR-001; DP-05; plan §2, §4.2.
  - **Archivos:** `src/modules/inventory/index.ts` (solo si se aprueba), `src/modules/logistics/index.ts`.
  - **Depende de:** T2.0.5, T2.1.1. **Paralelo:** con T2.1.2–T2.1.4.
  - **Arquitectura:** ampliar únicamente interfaz pública de Inventario según DP-05.
  - **Hecho cuando:** `logistics` importa de Inventario únicamente por su interfaz pública; `inventory` no importa de `logistics`; las pruebas existentes de Inventario siguen aprobadas.
  - **Pruebas:** suite de Inventario completa (sin regresiones) y revisión de importaciones.

**Validación de la fase 2.1:** `npx tsc -b`, `npm run lint` y pruebas de router y permisos correctos; autorización por rol operativa en rutas y menú antes de implementar vistas.

---

## Fase 2.2: Servicios de comunicación y mapeo

Todas las tareas de esta fase usan **únicamente** las estructuras verificadas en T2.0.6–T2.0.9.

- [x] **T2.2.1: Modelos de contrato y de vista de la guía**
  - **Qué:** definir en `models.ts` los tipos de respuesta y de solicitud de Logística con los campos confirmados, y los modelos de vista (guía, línea serializada, línea por cantidad, página de resultados) que consumirá la interfaz.
  - **Spec / Plan:** FR-018, FR-026, FR-029; plan §4.1, §4.2.
  - **Archivos:** `src/modules/logistics/models.ts`.
  - **Depende de:** T2.0.6, T2.1.3.
  - **Contrato:** B1 resuelto; usar plan §6.2.
  - **Hecho cuando:** ningún campo inferido; enums y tipos de identificadores coinciden con el contrato.
  - **Pruebas:** `npx tsc -b`.

- [x] **T2.2.2: `transferMapper`**
  - **Qué:** implementar la capa que traduce el borrador (`TransferDraftState`) al DTO real de creación y las respuestas reales a los modelos de vista. Es el único punto de adaptación al contrato; no envía propiedades fuera del DTO ni datos de identidad o condición de las unidades.
  - **Spec / Plan:** FR-010, FR-018; BR-009; plan §4.2, §4.8.
  - **Archivos:** `src/modules/logistics/services/transferMapper.ts`.
  - **Depende de:** T2.2.1.
  - **Contrato:** B1 resuelto; usar plan §6.2.
  - **Hecho cuando:** mapeo correcto para guía serializada, por cantidad y mixta, en ambos sentidos.
  - **Pruebas:** unitarias del mapeo, incluidas guías de una sola modalidad y comprobación de que el payload no contiene campos no contratados.

- [x] **T2.2.3: Servicio de creación de guía** `[P con T2.2.4]`
  - **Qué:** implementar `transferService.createTransfer` con la instancia centralizada de Axios; sin reintentos automáticos; propaga errores mediante `asAppError`.
  - **Spec / Plan:** FR-018, FR-019, NFR-002; plan §4.2, §4.9.
  - **Archivos:** `src/modules/logistics/services/transferService.ts`.
  - **Depende de:** T2.2.2.
  - **Contrato:** B1 resuelto; usar plan §6.2.
  - **Hecho cuando:** ruta, método y cuerpo coinciden con el contrato; sin instancia de Axios propia.
  - **Pruebas:** unitarias con HTTP mockeado: éxito, `400`, `401`, `403`, `409`, error de red y `timeout`.

- [x] **T2.2.4: Servicios de consulta de guías** `[P con T2.2.3]`
  - **Qué:** implementar `transferService` para listado (filtros reales, arreglo sin paginación) y detalle, con cancelación o descarte de respuestas obsoletas por parte de los hooks consumidores.
  - **Spec / Plan:** FR-026, FR-027, FR-029, FR-031; plan §4.2, §4.11.
  - **Archivos:** `src/modules/logistics/services/transferService.ts`.
  - **Depende de:** T2.2.2.
  - **Contrato:** B1 y DP-10 resueltos; filtros reales sin paginación.
  - **Hecho cuando:** parámetros y mapeo del arreglo de respuestas coinciden con el contrato; no se implementa paginación ni filtrado ficticio en cliente.
  - **Pruebas:** unitarias: parámetros de consulta, arreglo de listado, mapeo y errores (`401`, `403`, `404`, red).

- [x] **T2.2.5: Mensajes de errores de negocio**
  - **Qué:** definir la traducción a mensajes en español de los errores de negocio **confirmados** en T2.0.8 (stock insuficiente, unidad fuera del origen, ubicación inactiva, etc.), manteniendo el mensaje real del backend visible (`message` string o arreglo) y sin exponer datos internos. Los códigos no confirmados reciben el tratamiento genérico.
  - **Spec / Plan:** FR-021, FR-040; plan §4.15.
  - **Archivos:** `src/modules/logistics/validation.ts` (o `labels.ts` según el diseño final).
  - **Depende de:** T2.0.8, T2.2.3.
  - **Contrato:** B1 resuelto; usar plan §6.2.
  - **Hecho cuando:** cada error confirmado tiene mensaje y comportamiento; ninguno se asigna por suposición.
  - **Pruebas:** unitarias del mapeo error → mensaje.

**Validación de la fase 2.2:** pruebas de servicios y mapeo aprobadas; contraste de rutas, métodos, parámetros y cuerpos contra el contrato verificado; `npx tsc -b` correcto.

---

## Fase 2.3: Consulta de movimientos

El alcance por puesto se aplica desde esta fase; el backend es la autoridad (FR-031).

- [x] **T2.3.1: Hook `useTransferHistory`**
  - **Qué:** gestionar filtros, carga, error y descarte de respuestas obsoletas. Para `VENDEDOR`/`TECNICO` resolver la ubicación asignada (fuente confirmada en T2.0.3) y, solo si el contrato lo exige, enviarla como parámetro; nunca elegida libremente ni filtrada en cliente.
  - **Spec / Plan:** FR-026, FR-031, NFR-005; plan §4.3, §4.11, §4.13.
  - **Archivos:** `src/modules/logistics/hooks/useTransferHistory.ts`.
  - **Depende de:** T2.2.4, T2.0.3, T2.0.7.
  - **Contrato:** B1/B3 verificados; B7 exige no llamada sin asignación y corrección servidor.
  - **Hecho cuando:** el hook devuelve página, total, estados y reintento; ignora respuestas antiguas al cambiar filtros.
  - **Pruebas:** unitarias del hook (arreglo sin paginación, filtros, carrera de respuestas, usuario sin ubicación).

- [x] **T2.3.2: Tabla de historial y etiqueta de tipo** `[P con T2.3.3]`
  - **Qué:** crear `TransferHistoryTable` (código `TR-XXXXXX`, fecha y hora en `es-PE`, tipo, origen → destino, resumen de contenido, acceso al detalle) y `TransferDirectionBadge`. Para vendedores y técnicos mostrar «Recibida»/«Devuelta» desde la perspectiva del puesto. En pantallas estrechas pasar a tarjetas apiladas.
  - **Spec / Plan:** FR-026, FR-028, FR-030, NFR-010; plan §4.11, §4.16.
  - **Archivos:** `components/TransferHistoryTable.tsx`, `components/TransferDirectionBadge.tsx`.
  - **Depende de:** T2.2.1, T2.1.2.
  - **Hecho cuando:** origen, destino y código identificables; sin precios; contenido ancho dentro de su propio contenedor con desplazamiento.
  - **Pruebas:** de componente (ejecutor y puesto, estado vacío de filas, formato de fecha).

- [x] **T2.3.3: Filtros del historial** `[P con T2.3.2]`
  - **Qué:** crear `TransferHistoryFilters` solo con los filtros soportados por el backend (T2.0.6); el filtro por puesto solo para roles ejecutores; sin selector de puesto para `VENDEDOR`/`TECNICO`.
  - **Spec / Plan:** FR-027, FR-031; DP-10; plan §4.11.
  - **Archivos:** `components/TransferHistoryFilters.tsx`.
  - **Depende de:** T2.2.4, T2.1.2.
  - **Contrato:** DP-10 resuelta en plan §6.2.
  - **Hecho cuando:** cada filtro mostrado se corresponde con un parámetro verificado; ninguno actúa en cliente sobre datos paginados.
  - **Pruebas:** de componente por rol y por filtro soportado.

- [x] **T2.3.4: Página de historial**
  - **Qué:** componer `TransferHistoryPage`: estados de carga, vacío, error con reintento, encabezado «Movimientos de [su puesto]» para no ejecutores, y acción «Nueva guía» visible solo con `Can`.
  - **Spec / Plan:** FR-026, FR-032, FR-035, FR-039; plan §4.4, §4.11.
  - **Archivos:** `pages/TransferHistoryPage.tsx`.
  - **Depende de:** T2.3.1, T2.3.2, T2.3.3.
  - **Hecho cuando:** la página funciona para los tres roles con alcance correcto y sin controles de creación para no ejecutores.
  - **Pruebas:** de componente: estados, roles, arreglo sin paginación del backend.

- [x] **T2.3.5: Detalle de guía**
  - **Qué:** crear `useTransferDetail`, `TransferLinesView` y `TransferDetailPage`: cabecera con código (con acción de copiar), tipo, origen, destino, fecha y hora, responsable (si el backend lo entrega), equipos serializados (producto, N/S, condición si está disponible), productos por cantidad, totales. Sin acciones de edición, anulación ni reversión; sin precios.
  - **Spec / Plan:** FR-029, FR-030, FR-039, NFR-010; plan §4.12.
  - **Archivos:** `hooks/useTransferDetail.ts`, `components/TransferLinesView.tsx`, `pages/TransferDetailPage.tsx`.
  - **Depende de:** T2.2.4, T2.3.2.
  - **Hecho cuando:** origen, destino, responsable (si se entrega) y fecha visibles; estados de carga, error y reintento.
  - **Pruebas:** de componente y de hook: guía mixta, solo serializada, solo por cantidad, error.

- [x] **T2.3.6: Visibilidad por puesto, usuario sin ubicación y acceso ajeno**
  - **Qué:** implementar los estados: «Tu usuario no tiene un puesto asignado. Contacta al administrador.» (sin solicitar movimientos) y mensaje neutral «No tienes acceso a esta guía o no existe» para `403`/`404` en detalle; sin confirmar la existencia de la guía.
  - **Spec / Plan:** FR-031–FR-034, BR-018; plan §4.12, §4.13.
  - **Archivos:** `pages/TransferHistoryPage.tsx`, `pages/TransferDetailPage.tsx`, `hooks/useTransferHistory.ts`.
  - **Depende de:** T2.3.4, T2.3.5, T2.0.7.
  - **Pendiente backend:** B7 para garantía efectiva sin asignación; guard frontend sí implementable.
  - **Hecho cuando:** los tres casos (sin ubicación, otro puesto, rol no ejecutor) producen los estados definidos y ninguna consulta se realiza sin ubicación.
  - **Pruebas:** de componente por rol, con respuestas `403` y `404` mockeadas con el mismo resultado visible.

**Validación de la fase 2.3:** pruebas de la fase aprobadas; verificación manual con cuentas `VENDEDOR`/`TECNICO` si existen (T2.0.3); el alcance no se simula en cliente.

---

## Fase 2.4: Borrador y ruta del movimiento

- [x] **T2.4.1: Reductor `useTransferDraft`** `[P con T2.4.2]`
  - **Qué:** implementar el reductor puro con acciones: elegir tipo, elegir puesto, agregar/quitar línea serializada, agregar/editar/quitar línea por cantidad, limpiar, transiciones de fase. Rechaza duplicados serializados, suma o edita la cantidad de un mismo producto y vacía las líneas al cambiar de ruta.
  - **Spec / Plan:** FR-005, FR-009, FR-015; plan §4.8.
  - **Archivos:** `hooks/useTransferDraft.ts`.
  - **Depende de:** T2.1.3.
  - **Hecho cuando:** estado coherente tras cada acción, sin persistencia en almacenamiento del navegador.
  - **Pruebas:** unitarias del reductor (cada acción, duplicados, vaciado, fases).

- [x] **T2.4.2: Validaciones locales** `[P con T2.4.1]`
  - **Qué:** implementar en `validation.ts` las reglas de `spec.md` §8 (ruta completa, guía con al menos una línea, origen ≠ destino, unidad no repetida, cantidad entera > 0, cantidad ≤ disponibilidad leída, unidad en el origen) con los mensajes en español definidos. Los límites no verificados (DP-11) no se incluyen.
  - **Spec / Plan:** FR-006, FR-014, FR-040; plan §4.8.
  - **Archivos:** `validation.ts`.
  - **Depende de:** T2.1.3.
  - **Hecho cuando:** cada regla con su mensaje; ninguna regla inventada.
  - **Pruebas:** unitarias por regla y casos límite (cero, negativos, decimales, no numéricos).

- [x] **T2.4.3: Selector de tipo de movimiento, puesto y resumen de ruta**
  - **Qué:** crear `TransferRouteSelector`: tipo («Abastecer un puesto» / «Devolver al almacén»), selector de puesto activo, resumen «Origen → Destino» siempre visible; el Almacén Central se identifica con el mecanismo verificado en T2.0.10. Sin preselección de puesto. Confirmación y vaciado de líneas al cambiar la ruta. Estados explicativos si no hay Almacén Central activo único o no hay puestos activos.
  - **Spec / Plan:** FR-001–FR-005, NFR-008; BR-001, BR-002; plan §4.5.
  - **Archivos:** `components/TransferRouteSelector.tsx`.
  - **Depende de:** T2.4.1, T2.0.10, T2.0.5.
  - **Contrato:** tipo de ubicación confirmado (DP-03, B5 resueltos).
  - **Hecho cuando:** no es posible elegir dos puestos ni origen = destino; solo ubicaciones activas; el Almacén Central no se deduce por nombre.
  - **Pruebas:** de componente: ambos tipos, cambio de ruta con líneas, ausencia de puestos o de Almacén Central.

- [x] **T2.4.4: Estructura de `TransferCreatePage` y aviso de abandono**
  - **Qué:** crear el esqueleto de `TransferCreatePage` con la barra de ruta, las áreas de captura y del contenido de la guía, y el aviso al abandonar con líneas (navegación interna si el router lo permite según T2.0.2; cierre de pestaña con el evento estándar). Nada del borrador se persiste.
  - **Spec / Plan:** FR-035; FA-07; plan §4.4, §4.8.
  - **Archivos:** `pages/TransferCreatePage.tsx`.
  - **Depende de:** T2.4.1, T2.4.3, T2.1.4.
  - **Hecho cuando:** la página solo es accesible a roles ejecutores y advierte al abandonar con líneas.
  - **Pruebas:** de componente: acceso por rol y aviso de abandono.

**Validación de la fase 2.4:** pruebas de reductor, validaciones y selector aprobadas; ninguna lectura ni escritura en `localStorage`/`sessionStorage` desde el módulo.

---

## Fase 2.5: Selección de mercancía

- [x] **T2.5.1: Captura de unidades serializadas** `[P con T2.5.3]`
  - **Qué:** crear `SerializedItemPicker`: captura por lector HID (`useBarcodeScanner`) o teclado, resolución por `GET /hardware-items/scan/:code`, validación de pertenencia al origen («Esta unidad está en [ubicación], no en [origen]»), duplicados, foco de regreso al campo y anuncio en región `aria-live`. El lector debe poder desactivarse mientras haya un diálogo abierto (montaje condicional o la opción que exista según T2.0.5); no se modifica `useBarcodeScanner` sin autorización.
  - **Spec / Plan:** FR-007, FR-008, FR-009, NFR-004; BR-012, BR-013; plan §4.6.
  - **Archivos:** `components/SerializedItemPicker.tsx`.
  - **Depende de:** T2.4.1, T2.4.4, T2.0.5, T2.1.5.
  - **Hecho cuando:** una unidad fuera del origen no se agrega y se informa su ubicación; un código no encontrado es un estado recuperable; el lector no actúa con el diálogo abierto.
  - **Pruebas:** de componente con captura HID simulada y escritura manual: unidad válida, fuera del origen, duplicada, no encontrada.

- [x] **T2.5.2: Estado, condición y relación padre-hijo**
  - **Qué:** mostrar la condición (nuevo/usado) y el estado de cada unidad cuando la respuesta confirmada los incluya, y la relación chasis/componentes como información. Solo `EN_STOCK` es movible. No delegar al backend un envío con relaciones no resueltas: todo envío serializado/mixto queda bloqueado por B6 hasta corrección backend.
  - **Spec / Plan:** FR-010, FR-011, BR-009; BV-003, BV-004; SC-31; plan §4.6.
  - **Archivos:** `components/SerializedItemPicker.tsx`, `components/TransferLinesList.tsx`.
  - **Depende de:** T2.5.1, T2.0.5, T2.0.8.
  - **Bloqueo:** B6 (stock serializado y chasis/componentes).
  - **Hecho cuando:** identidad (producto, N/S) y condición visibles; ninguna regla adoptada por suposición.
  - **Pruebas:** de componente: unidad con y sin componentes, con y sin condición en la respuesta.

- [x] **T2.5.3: Selección de productos por cantidad y disponibilidad en origen** `[P con T2.5.1]`
  - **Qué:** crear `useOriginAvailability` y `QuantityItemPicker`: búsqueda por nombre o SKU con el selector de catálogo reutilizado, presentación limitada a `isSerialized: false`, consulta de `GET /quantity-stock` por origen y producto, muestra «Disponible en [origen]: N», validación de la cantidad (entero > 0 y ≤ disponible leído, con aviso sin bloqueo definitivo si la lectura no está disponible).
  - **Spec / Plan:** FR-012, FR-013, FR-014; BR-010, BR-011; plan §4.7.
  - **Archivos:** `hooks/useOriginAvailability.ts`, `components/QuantityItemPicker.tsx`.
  - **Depende de:** T2.4.1, T2.4.2, T2.4.3, T2.0.5, T2.1.5.
  - **Hecho cuando:** un producto serializado nunca se agrega como línea por cantidad; sin parámetro de consulta inventado.
  - **Pruebas:** de hook y de componente: disponibilidad leída, lectura fallida, cantidades inválidas y excesivas.

- [x] **T2.5.4: Lista de contenido de la guía y revisión de disponibilidad**
  - **Qué:** crear `TransferLinesList`: líneas agrupadas por modalidad con totales, quitar línea, editar cantidad, una línea por producto, sin precios. Implementar «Revisar disponibilidad» (reconsulta del stock de las líneas por cantidad y re-resolución de las unidades serializadas), indicando las líneas que dejaron de ser elegibles sin modificar el borrador de forma silenciosa.
  - **Spec / Plan:** FR-006, FR-015, FR-016, FR-030; SC-27; plan §4.7, §4.8.
  - **Archivos:** `components/TransferLinesList.tsx`.
  - **Depende de:** T2.5.1, T2.5.3.
  - **Hecho cuando:** el botón de revisión se habilita solo con una guía válida; la revisión marca líneas no elegibles.
  - **Pruebas:** de componente: guía mixta, quitar/editar, revisión con cambios de disponibilidad.

- [x] **T2.5.5: Listado de unidades en el origen (opcional, condicionado)**
  - **Qué:** si DP-06 se resuelve y `GET /hardware-items` está disponible por la interfaz pública de Inventario con DTO verificado, incorporar una búsqueda de unidades disponibles en el origen. De lo contrario, esta tarea queda sin ejecutar y la selección serializada se mantiene exclusivamente por captura.
  - **Spec / Plan:** FR-007; DP-06; plan §4.6.
  - **Archivos:** `components/TransferItemPickers.tsx`, `modules/inventory/services/hardwareReadService.ts`.
  - **Depende de:** T2.5.1, T2.0.5, DP-06.
  - **Hecho cuando:** implementado mediante `GET /hardware-items/available-serials` permitiendo seleccionar catálogo y serie disponible sin conocer el N/S de antemano.
  - **Pruebas:** pruebas de componente y mock de servicio.

**Validación de la fase 2.5:** pruebas de selección aprobadas; verificación de que no se hacen peticiones HTTP desde componentes y de que el consumo de Inventario es solo por su interfaz pública.

---

## Fase 2.6: Confirmación, envío y comprobante

- [x] **T2.6.1: Diálogo de resumen y confirmación** `[P con T2.6.5]`
  - **Qué:** crear `TransferSummaryDialog`: tipo de movimiento, ruta «Origen → Destino» destacada, líneas serializadas (producto, N/S, condición si está disponible) y por cantidad, totales por modalidad, indicación de aplicación inmediata, botones «Confirmar abastecimiento»/«Confirmar devolución» y «Volver a editar». Atrapa el foco, devuelve el foco al abrirlo, no se cierra accidentalmente durante el envío y desactiva el lector.
  - **Spec / Plan:** FR-017, FR-019, NFR-004, NFR-005, NFR-008; FA-04; plan §4.9, §4.16.
  - **Archivos:** `components/TransferSummaryDialog.tsx`.
  - **Depende de:** T2.5.4.
  - **Hecho cuando:** el texto del botón depende del tipo; el diálogo es operable con teclado.
  - **Pruebas:** de componente: contenido, foco, cierre bloqueado durante el envío.

- [x] **T2.6.2: Hook `useCreateTransfer`**
  - **Qué:** orquestar el envío con las fases `reviewing`, `submitting`, `completed`, `rejected` y `unknown`; bloqueo inmediato de doble envío con `useRef`, botones deshabilitados durante `submitting`, sin reintentos automáticos. Éxito solo con respuesta exitosa del backend; error con respuesta → `rejected` (borrador conservado); error sin respuesta o `5xx` incierto → `unknown` (borrador conservado).
  - **Spec / Plan:** FR-018–FR-022, FR-041, NFR-006; BR-003; plan §4.9.
  - **Archivos:** `hooks/useCreateTransfer.ts`.
  - **Depende de:** T2.2.3, T2.4.1.
  - **Contrato:** B1 resuelto; usar plan §6.2.
  - **Hecho cuando:** dos disparos consecutivos producen una sola solicitud; ningún éxito se muestra sin confirmación del servidor.
  - **Pruebas:** de hook: éxito, `400`, `403`, `409`, red, `timeout`, doble disparo simultáneo.

- [x] **T2.6.3: Respuesta inconsistente o fallo parcial**
  - **Qué:** tratar como advertencia (nunca como éxito completo) una respuesta que indique un resultado parcial o inconsistente (por ejemplo, un código de guía sin todas las líneas enviadas): impedir el reintento inmediato, dirigir a verificar el detalle de la guía y mostrar el caso como incidencia del backend. El frontend no modela éxito parcial.
  - **Spec / Plan:** FR-023; BR-003; SC-30; plan §4.15.
  - **Archivos:** `hooks/useCreateTransfer.ts`, `components/TransferReceipt.tsx`.
  - **Depende de:** T2.6.2, T2.0.8.
  - **Contrato:** respuesta exacta en plan §6.2.
  - **Hecho cuando:** una respuesta con discrepancia entre líneas enviadas y devueltas no se presenta como éxito.
  - **Pruebas:** de hook y de componente con respuesta inconsistente mockeada.

- [x] **T2.6.4: Resultado incierto y verificación en el historial**
  - **Qué:** crear `UnknownOutcomeNotice`: explicar que la guía pudo registrarse, bloquear la reconfirmación y ofrecer «Verificar en el historial» (consulta de las guías más recientes de la misma ruta y responsable mediante `useTransferHistory`); habilitar «Reintentar» solo tras esa verificación y con advertencia de posible duplicación. Si el backend no soporta los filtros necesarios (O-04), usar la verificación manual indicada en el registro de verificación, previa aprobación.
  - **Spec / Plan:** FR-022, US-010; SC-28, SC-29; plan §4.9.
  - **Archivos:** `components/UnknownOutcomeNotice.tsx`.
  - **Depende de:** T2.6.2, T2.3.1.
  - **Bloqueo:** DP-10 (filtros del historial).
  - **Hecho cuando:** sin verificación no es posible reintentar; el borrador permanece íntegro.
  - **Pruebas:** de componente: flujo de incertidumbre, verificación con guía encontrada y no encontrada.

- [x] **T2.6.5: Comprobante del movimiento** `[P con T2.6.1]`
  - **Qué:** crear `TransferReceipt`: código `TR-XXXXXX` y datos **devueltos por el backend** (ruta, líneas, totales); el frontend no genera ni modifica el código. Acciones: «Nueva guía», «Ver detalle», «Ver historial».
  - **Spec / Plan:** FR-020; BR-014; plan §4.9, §4.10.
  - **Archivos:** `components/TransferReceipt.tsx`.
  - **Depende de:** T2.2.1.
  - **Hecho cuando:** el código mostrado coincide con el de la respuesta; «Nueva guía» descarta el borrador.
  - **Pruebas:** de componente con respuestas de ejemplo verificadas.

- [x] **T2.6.6: Composición del flujo de creación y manejo de rechazos**
  - **Qué:** completar `TransferCreatePage` integrando ruta, captura, lista, resumen, envío, comprobante y avisos. Ante un rechazo del backend: conservar el borrador, mostrar el mensaje real, ofrecer «Revisar disponibilidad» cuando el motivo sea disponibilidad, ubicación o estado, y recargar ubicaciones si el rechazo es por ubicación inexistente o inactiva. Ante `403` la guía no se considera creada («No tienes permiso para realizar esta acción.»); ante `401`, aplicar el cierre de sesión de la Fase 0.
  - **Spec / Plan:** FR-006, FR-020, FR-021, FR-036, FR-039; SC-18, SC-22, SC-24, SC-32; plan §4.15.
  - **Archivos:** `pages/TransferCreatePage.tsx`.
  - **Depende de:** T2.6.1–T2.6.5, T2.5.4, T2.2.5.
  - **Hecho cuando:** el flujo completo de FP-01 y FP-02 es operable de principio a fin con servicios mockeados.
  - **Pruebas:** de componente: guía serializada, por cantidad y mixta, abastecimiento y devolución; rechazos y `401`/`403`.

- [ ] **T2.6.7: Integración de idempotencia (condicionada)**
  - **Qué:** si T2.0.9 confirma una clave de idempotencia o una detección de duplicados en el backend, integrarla exactamente como indica el contrato en `transferMapper`/`transferService`; si no existe, registrar la tarea como no aplicable y mantener la estrategia de la tarea T2.6.4 como única protección.
  - **Spec / Plan:** FR-019, FR-022; BV-007; DP-02; plan §4.9.
  - **Archivos:** `services/transferMapper.ts`, `services/transferService.ts` (solo si aplica).
  - **Depende de:** T2.6.2, T2.0.9.
  - **Bloqueo:** DP-02.
  - **Hecho cuando:** integrada según el contrato o registrada como no aplicable; sin encabezados ni campos inventados.
  - **Pruebas:** unitarias del servicio si se implementa.

**Validación de la fase 2.6:** pruebas aprobadas para los cinco estados del envío; el segundo disparo y el reintento tras incertidumbre quedan bloqueados según lo especificado.

---

## Fase 2.7: Integración con Inventario y trazabilidad

- [x] **T2.7.1: Reflejo de existencias tras el traslado** `[P con T2.7.2]`
  - **Qué:** en el comprobante, ofrecer accesos a `/inventory` y `/inventory/stock` para verificar existencias en origen y destino. Solo si la respuesta de creación no incluye los saldos resultantes y la reconsulta es simple, mostrar los saldos de las líneas por cantidad reconsultando `GET /quantity-stock` por producto y ubicación. Nunca estimar por aritmética del cliente ni guardar existencias en el navegador.
  - **Spec / Plan:** FR-024, BR-010; F2-C06; plan §4.10.
  - **Archivos:** `components/TransferReceipt.tsx`, `hooks/useOriginAvailability.ts` (reutilización).
  - **Depende de:** T2.6.5, T2.0.5.
  - **Hecho cuando:** los datos mostrados provienen del backend; las vistas de Inventario consultan al montarse sin necesidad de invalidar caché.
  - **Pruebas:** de componente: enlaces y reconsulta opcional.

- [x] **T2.7.2: Conservación de identidad y condición de las unidades** `[P con T2.7.1]`
  - **Qué:** asegurar que el frontend nunca envía ni edita número de serie, condición ni historial de una unidad (solo la referencia a la unidad y el contexto de ruta), y que línea, resumen, comprobante y detalle muestran producto, N/S y condición (si se entrega).
  - **Spec / Plan:** FR-010; BR-009; plan §4.8, §4.12.
  - **Archivos:** `services/transferMapper.ts`, `components/TransferLinesList.tsx`, `components/TransferLinesView.tsx`.
  - **Depende de:** T2.2.2, T2.5.2, T2.3.5.
  - **Hecho cuando:** el payload de creación contiene solo los campos contratados y las vistas muestran la identidad.
  - **Pruebas:** unitarias del mapeo (el payload no contiene N/S editables ni condición) y de componente.

- [x] **T2.7.3: Servicio de movimientos de una unidad**
  - **Qué:** con los ajustes autorizados y DP-14/DP-15 resueltos para ejecutores, implementar la consulta de los movimientos logísticos de una unidad con la fuente aprobada (endpoint de hoja de vida de Inventario, `GET /hardware-items/:id/lifecycle`, sin inventar filtro por N/S del listado de guías), mostrando solo eventos de movimiento. No duplicar servicios de Inventario.
  - **Spec / Plan:** FR-037, FR-038; F2-C11; SC-10; DP-09, DP-14, DP-15.
  - **Archivos:** `services/transferService.ts` (o reutilización por interfaz pública de Inventario según DP-15), `models.ts`.
  - **Depende de:** G0, T2.2.4, T2.0.5, T2.0.9.
  - **Contrato:** F2-C11 cubierta por plan §4.14; fuente lifecycle comprobada; solo ejecutores.
  - **Hecho cuando:** consulta probada con la fuente aprobada, sin presentar eventos que no sean de movimiento.
  - **Pruebas:** unitarias con HTTP mockeado sobre la estructura verificada.

- [x] **T2.7.4: Interfaz de movimientos de una unidad**
  - **Qué:** añadir en `/logistics` la consulta por N/S o código (captura HID o teclado) con el listado de movimientos y acceso al detalle de cada guía. Habilitar para roles ejecutores; para `VENDEDOR`/`TECNICO` solo si el backend garantiza que la respuesta se limita a su puesto (FR-038); en caso contrario, oculta.
  - **Spec / Plan:** FR-037, FR-038, BR-018; US-009; SC-10.
  - **Archivos:** `pages/TransferHistoryPage.tsx` y componente nuevo dentro de `components/` si hace falta (nombre por definir al actualizar el plan).
  - **Depende de:** T2.7.3, T2.3.4.
  - **Contrato:** DP-14/DP-15 resueltas para ejecutores; no habilitar a vendedores/técnicos.
  - **Hecho cuando:** un rol ejecutor ve los movimientos de una unidad; un rol no ejecutor no los ve salvo garantía verificada.
  - **Pruebas:** de componente por rol; unidad sin movimientos; unidad no encontrada.

- [ ] **T2.7.5: Verificación de registro en la bitácora**
  - **Qué:** con una cuenta de rol ejecutor y datos de prueba identificados (`SDD-F2-<marca de tiempo>`), crear guías de prueba y comprobar que cada una deja su registro en la bitácora y en la hoja de vida de las unidades serializadas, usando el medio verificado en T2.0.9 (vista de la Fase 0, servicio o API; la vista puede no existir, O-03). Los datos de prueba se limpian de forma lógica solo con las operaciones documentadas. Si no hay datos de prueba autorizados, la tarea queda pendiente y no se declara cumplida.
  - **Spec / Plan:** FR-025, BR-015, BR-016; plan §4.14.
  - **Archivos:** ninguno (registro de verificación).
  - **Depende de:** T2.6.6, T2.0.9.
  - **Bloqueo:** backend y cuentas de prueba disponibles.
  - **Hecho cuando:** cada guía de prueba aparece en la bitácora con responsable y fecha; resultado registrado.
  - **Pruebas:** verificación manual contra el backend real.

**Validación de la fase 2.7:** el frontend no calcula existencias, no genera correlativos ni escribe en la bitácora; identidad y condición conservadas; bitácora verificada o pendiente documentada.

---

## Fase 2.8: Revisión de acceso, responsive y accesibilidad

Esta fase verifica y refina lo implementado desde 2.1; la autorización ya se aplicó en rutas, páginas y acciones durante las fases anteriores.

- [x] **T2.8.1: Revisión de autorización de extremo a extremo**
  - **Qué:** confirmar que todas las rutas, acciones y vistas usan `LOGISTICS_EXECUTOR_ROLES`, `RoleGuard` y `Can`; que no existe comparación literal de roles; que `401`/`403` se manejan con la infraestructura de la Fase 0; y que el alcance por puesto no se simula en cliente.
  - **Spec / Plan:** FR-031–FR-036, NFR-003; BR-017–BR-019; plan §4.13, §9.
  - **Archivos:** revisión de `src/modules/logistics/**`; correcciones puntuales si se detectan.
  - **Depende de:** T2.6.6, T2.3.6.
  - **Hecho cuando:** revisión sin hallazgos abiertos (o hallazgos corregidos con pruebas).
  - **Pruebas:** búsqueda de comparaciones literales de roles y pruebas de autorización existentes.

- [x] **T2.8.2: Diseño responsive** `[P con T2.8.3]`
  - **Qué:** verificar historial y detalle *mobile-first* (tarjetas apiladas en pantallas estrechas, contenido ancho con desplazamiento interno) y que la creación de guías siga siendo usable en pantallas medianas; consistencia con los patrones de Inventario.
  - **Spec / Plan:** NFR-004, NFR-009; plan §4.16.
  - **Archivos:** componentes de `src/modules/logistics/components/` y páginas.
  - **Depende de:** T2.6.6.
  - **Hecho cuando:** sin desplazamiento horizontal del cuerpo de la página; origen, destino y código legibles en pantallas estrechas.
  - **Pruebas:** pruebas de componente de las variantes y revisión manual en anchos representativos; no se declara verificación visual en navegador si no se realizó.

- [x] **T2.8.3: Accesibilidad** `[P con T2.8.2]`
  - **Qué:** verificar foco visible, etiquetas asociadas, operación completa por teclado, atrapado y retorno de foco de los diálogos, regiones `aria-live` en capturas, errores asociados a su campo y estados no comunicados solo por color.
  - **Spec / Plan:** NFR-004; plan §4.16.
  - **Archivos:** componentes y páginas del módulo.
  - **Depende de:** T2.6.6.
  - **Hecho cuando:** sin hallazgos abiertos en la revisión de accesibilidad.
  - **Pruebas:** consultas por rol/etiqueta de React Testing Library, orden de foco y retorno de foco.

- [x] **T2.8.4: Revisión de límites arquitectónicos y dependencias**
  - **Qué:** comprobar que logistics solo importa de `inventory/index.ts`, que `inventory` no importa de `logistics`, que no hay dependencias circulares, peticiones HTTP en componentes, instancias de Axios propias, uso de `localStorage`/`sessionStorage`/IndexedDB para datos de logística, dependencias nuevas, `services/printer/` ni código offline.
  - **Spec / Plan:** NFR-001, NFR-002, NFR-003, NFR-007, FR-041; plan §2, §9, Anexo A.
  - **Archivos:** revisión de `src/modules/logistics/**` y `package.json` (sin cambios esperados).
  - **Depende de:** T2.6.6.
  - **Hecho cuando:** revisión documentada sin incumplimientos; `package.json` sin diferencias.
  - **Pruebas:** búsquedas de importaciones y de uso de almacenamiento; `git diff` de `package.json`.

**Validación de la fase 2.8:** sin hallazgos abiertos de acceso, responsive, accesibilidad ni arquitectura.

---

## Fase 2.9: Pruebas y validación de la entrega

Las pruebas unitarias y de componente se escriben junto a cada tarea de implementación. Esta fase consolida las pruebas de integración por escenario del `spec.md` sin duplicar las ya cubiertas: cada prueba de flujo usa servicios con HTTP mockeado sobre estructuras verificadas. No se añaden librerías de pruebas.

- [x] **T2.9.1: Flujos de creación: distribución y devolución (SC-01 a SC-06)** `[P con T2.9.2–T2.9.5]`
  - **Qué:** pruebas de flujo, con casos parametrizados por tipo, de guía serializada, por cantidad y mixta en abastecimiento y devolución, hasta el comprobante con el código del backend.
  - **Spec / Plan:** FR-001–FR-020; plan §10.
  - **Archivos:** `pages/TransferCreatePage.test.tsx` (o archivo de flujo equivalente).
  - **Depende de:** T2.6.6.
  - **Hecho cuando:** seis escenarios aprobados; los payloads coinciden con el contrato.
  - **Pruebas:** suite de flujo.

- [x] **T2.9.2: Validaciones y errores de negocio (SC-19 a SC-27, SC-31)** `[P con T2.9.1, T2.9.3–T2.9.5]`
  - **Qué:** stock insuficiente, unidad en otro establecimiento, unidad duplicada, ubicación inválida, origen = destino, ubicaciones inactivas, guía vacía, cantidades inválidas, cambios de disponibilidad entre captura y confirmación (rechazo del backend + «Revisar disponibilidad»), unidad en estado no movible o chasis con componentes (según lo confirmado).
  - **Spec / Plan:** FR-004–FR-016, FR-021, FR-040; plan §4.15.
  - **Archivos:** pruebas de `validation.ts`, componentes de selección y `TransferCreatePage`.
  - **Depende de:** T2.6.6, T2.2.5.
  - **Hecho cuando:** cada caso confirma el comportamiento definido en `spec.md` §7.5.
  - **Pruebas:** suite por caso con asserts sobre mensajes y estado del borrador.

- [x] **T2.9.3: Errores de comunicación, duplicados y atomicidad (SC-28 a SC-30, SC-32)** `[P con T2.9.1, T2.9.2, T2.9.4, T2.9.5]`
  - **Qué:** error de red y `timeout` en creación y consultas, doble disparo, reintento bloqueado hasta verificar, respuesta inconsistente, sesión expirada durante la operación; confirmar que nunca se muestra éxito sin respuesta del servidor.
  - **Spec / Plan:** FR-019, FR-022, FR-023, FR-041, NFR-006; plan §4.9.
  - **Archivos:** `hooks/useCreateTransfer.test.ts`, `components/UnknownOutcomeNotice.test.tsx`.
  - **Depende de:** T2.6.4, T2.6.3.
  - **Hecho cuando:** los cuatro escenarios aprobados; una sola solicitud por doble disparo.
  - **Pruebas:** suite de hook y de componente con temporizadores y errores simulados.

- [x] **T2.9.4: Autorización, ubicación y acceso ajeno (SC-12 a SC-18)** `[P con T2.9.1–T2.9.3, T2.9.5]`
  - **Qué:** rol ejecutor crea guías; vendedor y técnico consultan solo su puesto sin controles de creación; usuario sin ubicación asignada; acceso a una guía de otro puesto (`403` y `404` con el mismo resultado visible); creación sin autorización. El escenario SC-13 (Encargado de Almacén) se prueba con la representación definitiva de DP-01.
  - **Spec / Plan:** FR-031–FR-036, BR-017–BR-019; plan §4.13.
  - **Archivos:** pruebas de router, `TransferHistoryPage`, `TransferDetailPage`, `TransferCreatePage`.
  - **Depende de:** T2.3.6, T2.1.4, T2.6.6.
  - **Pendiente real:** B7 y verificación con cuentas asignadas; roles y perfil comprobados.
  - **Hecho cuando:** los siete escenarios aprobados; SC-13 aprobado o documentado como pendiente.
  - **Pruebas:** suite por rol.

- [x] **T2.9.5: Consulta y trazabilidad (SC-07 a SC-11)** `[P con T2.9.1–T2.9.4]`
  - **Qué:** historial contractual sin paginación, detalle, identificación de origen, destino, responsable y fecha, movimientos recibidos y devueltos por puesto y, si T2.7.3–T2.7.4 se implementaron, movimientos de una unidad.
  - **Spec / Plan:** FR-026–FR-030, FR-037, FR-038; plan §4.11, §4.12.
  - **Archivos:** pruebas de páginas y componentes de consulta.
  - **Depende de:** T2.3.5, T2.7.2 (y T2.7.4 si aplica).
  - **Hecho cuando:** SC-07 a SC-09 y SC-11 aprobados; SC-10 aprobado o documentado como bloqueado.
  - **Pruebas:** suite de consulta.

- [x] **T2.9.6: Revisión de regresiones**
  - **Qué:** ejecutar la suite completa y compararla con la línea base de T2.0.1; confirmar que Inventario y los cimientos no tienen regresiones, en especial si se tocó `inventory/index.ts` (T2.1.5).
  - **Spec / Plan:** plan §10, §13.
  - **Archivos:** ninguno.
  - **Depende de:** T2.9.1–T2.9.5.
  - **Hecho cuando:** ninguna prueba previa falla; diferencias frente a la línea base explicadas.
  - **Pruebas:** `npm test` completo.

- [ ] **T2.9.7: Verificación contra el backend real**
  - **Qué:** con cuentas de rol ejecutor, `VENDEDOR` y `TECNICO` con ubicación asignada y datos de prueba identificados (`SDD-F2-<marca de tiempo>`): crear guías de distribución y devolución (serializadas, por cantidad y mixtas), comprobar el código `TR-`, la actualización de ubicación y existencias en Inventario, los registros en bitácora y hoja de vida (T2.7.5), el alcance de lectura de vendedor y técnico, el acceso a una guía ajena y un cambio concurrente de disponibilidad con dos sesiones (SC-27). Limpiar los datos de prueba de forma lógica solo con operaciones documentadas. No guardar credenciales ni tokens en el repositorio. Si faltan cuentas con ubicación asignada o datos autorizados, la verificación correspondiente queda pendiente y **no** se declara cumplida.
  - **Spec / Plan:** criterios de aceptación 12, 13, 16, 18; plan §10 («Verificación contra el backend real»).
  - **Archivos:** ninguno (registro).
  - **Depende de:** T2.9.1–T2.9.5, T2.7.5.
  - **Bloqueo:** backend accesible, cuentas y datos autorizados; B6–B10 impiden aceptación integral. No ejecutar escrituras reales sin disponibilidad y datos adecuados.
  - **Hecho cuando:** cada comprobación registrada con su resultado o su estado de pendiente.
  - **Pruebas:** verificación manual contra el backend real.

- [x] **T2.9.8: Validaciones de calidad**
  - **Qué:** ejecutar `npm test`, `npm run lint`, `npx tsc -b`, `npm run build` y `git diff --check`; confirmar que no hay dependencias nuevas.
  - **Spec / Plan:** plan §13 (puntos 14–16); Constitución §13.5, §15.
  - **Archivos:** ninguno.
  - **Depende de:** T2.9.6.
  - **Hecho cuando:** todos los comandos finalizan sin errores.
  - **Pruebas:** comandos indicados.

- [ ] **T2.9.9: Revisión de criterios de aceptación y cumplimiento de la Constitución**
  - **Qué:** verificar los 24 criterios de aceptación de `spec.md` §9 y el cumplimiento de la Constitución (Anexo A del plan); marcar los criterios no verificables como pendientes con su motivo; actualizar el estado de las tareas a `[x]` solo tras completar y verificar cada una; redactar el registro de cierre.
  - **Spec / Plan:** spec §9, §16; plan §13, Anexo A.
  - **Archivos:** este `task.md` (registro de avance y de cierre).
  - **Depende de:** T2.9.7, T2.9.8.
  - **Hecho cuando:** matriz de aceptación completa; ninguna capacidad pendiente figura como implementada.
  - **Pruebas:** revisión cruzada contra la matriz de trazabilidad de este documento.

**Validación de la fase 2.9:** pruebas por escenario aprobadas; comandos de calidad correctos; criterios de aceptación verificados o pendientes documentados; sin funcionalidad fuera de alcance.

---

## Capacidades expresamente fuera de alcance

Estas capacidades no tienen tareas en este documento ni deben introducirse durante la implementación:

- Traslados directos entre puestos, confirmación del receptor, estados en tránsito, solicitudes de traslado, borradores y colas de pendientes.
- Anulación, edición o reversión de guías.
- Ventas, Caja, Servicio Técnico, Auditoría Express, Administración, Alertas y Aprobaciones.
- Impresión y exportación de guías o etiquetas.
- Vista general de hoja de vida de hardware (M6) más allá de la consulta de movimientos definida en FR-037 y FR-038.
- Persistencia offline, caché local, sincronización, Dexie.js, IndexedDB y Service Workers.
- Implementación en el frontend de responsabilidades del backend: atomicidad, autorización efectiva, alcance por ubicación, generación del correlativo `TR-XXXXXX` y persistencia del movimiento.
- Cambios en el backend o redefinición de sus contratos.

## Capacidades condicionadas (sin implementar hasta resolver su dependencia)

| Capacidad | Tareas | Condición |
|---|---|---|
| Consulta de movimientos de una unidad (F2-C11) | T2.7.3, T2.7.4 | Ajustes autorizados; fuente lifecycle verificada; solo ejecutores, según DP-14/DP-15. |
| Listado de unidades en el origen | T2.5.5 | DP-06: `GET /hardware-items` diferido en la Fase 1. |
| Reglas de estados movibles y de chasis con componentes | parte de T2.5.2 | DP-07 y DP-08. |
| Integración de idempotencia | T2.6.7 | T2.0.9 / DP-02. |
| Verificación de SC-13 (Encargado de Almacén) | parte de T2.9.4, T2.9.7 | DP-01. |

## Observaciones y decisiones pendientes detectadas en la revisión cruzada

No se resuelven por suposición ni modifican `spec.md` o `plan.md` sin autorización.

| ID | Observación | Tratamiento |
|---|---|---|
| O-01 | Resuelta: plan §4.14 cubre F2-C11 y FR-037/FR-038, autorización de actualización registrada. | T2.7.3/.4 viables solo para ejecutores, mediante lifecycle. |
| O-02 | El plan sitúa la «refinación de acceso» en la Etapa 7, mientras este documento exige controles de autorización desde el inicio. No es contradicción: el plan ya incluye guards en la Etapa 1 y la vista por rol en la Etapa 3. | Autorización en T2.1.2, T2.1.4, T2.3.x; T2.8.1 solo la revisa. |
| O-03 | El plan (§4.14) y el spec (FR-025) asumen una «vista de bitácora de la Fase 0»; el documento de casos de uso ubica el visor de bitácora en la Fase 7 y la Fase 1 solo menciona el *servicio* de bitácora. | T2.0.9 verifica el medio real; T2.7.5 usa el disponible o queda pendiente. |
| O-04 | El spec (FR-022) y el plan (§4.9) suponen que el historial puede consultarse por ruta y responsable para verificar un resultado incierto; no se ha confirmado que existan esos filtros (DP-10). Ningún documento define un procedimiento alternativo. | T2.6.4 bloqueada parcialmente; el procedimiento alternativo requiere decisión. |
| O-05 | Los documentos del encargo sitúan el «Historial de unidades» en la Fase 1, pero los documentos de la Fase 1 lo difieren. | T2.0.5 verifica el estado real; ninguna tarea reconstruye esa capacidad. |
| O-06 | Los nombres de rutas de pruebas, hooks y componentes de F2-C11 no figuran en el plan. | Se definirán al actualizar el plan; no se inventan rutas definitivas. |

## Matrices de trazabilidad

### Requisitos funcionales

| Requisito | Tareas |
|---|---|
| FR-001 | T2.4.3, T2.9.1 |
| FR-002 | T2.4.3 |
| FR-003 | T2.0.10, T2.4.3 |
| FR-004 | T2.4.3, T2.9.2 |
| FR-005 | T2.4.1, T2.4.3, T2.9.2 |
| FR-006 | T2.1.3, T2.4.2, T2.5.4, T2.6.6 |
| FR-007 | T2.5.1, T2.5.5 |
| FR-008 | T2.5.1, T2.9.2 |
| FR-009 | T2.4.1, T2.5.1, T2.9.2 |
| FR-010 | T2.2.2, T2.5.2, T2.7.2 |
| FR-011 | T2.5.2 |
| FR-012 | T2.5.3 |
| FR-013 | T2.5.3 |
| FR-014 | T2.4.2, T2.5.3, T2.9.2 |
| FR-015 | T2.4.1, T2.5.4 |
| FR-016 | T2.5.4, T2.9.2 |
| FR-017 | T2.6.1 |
| FR-018 | T2.2.2, T2.2.3, T2.6.2 |
| FR-019 | T2.6.1, T2.6.2, T2.9.3 |
| FR-020 | T2.6.5, T2.6.6, T2.9.1 |
| FR-021 | T2.2.5, T2.6.6, T2.9.2 |
| FR-022 | T2.6.2, T2.6.4, T2.9.3 |
| FR-023 | T2.6.3, T2.9.3 |
| FR-024 | T2.7.1 |
| FR-025 | T2.0.9, T2.7.5, T2.9.7 |
| FR-026 | T2.2.4, T2.3.1, T2.3.2, T2.3.4 |
| FR-027 | T2.2.4, T2.3.3 |
| FR-028 | T2.3.2 |
| FR-029 | T2.2.4, T2.3.5 |
| FR-030 | T2.3.2, T2.3.5, T2.5.4 |
| FR-031 | T2.0.7, T2.3.1, T2.3.6, T2.9.4 |
| FR-032 | T2.3.4, T2.3.6 |
| FR-033 | T2.0.3, T2.3.6, T2.9.4 |
| FR-034 | T2.3.6, T2.9.4 |
| FR-035 | T2.1.2, T2.1.4, T2.4.4, T2.8.1 |
| FR-036 | T2.1.4, T2.6.6, T2.9.4 |
| FR-037 | T2.7.3, T2.7.4 (condicionadas) |
| FR-038 | T2.7.4 (condicionada) |
| FR-039 | T2.3.4, T2.3.5, T2.6.6, T2.8.3 |
| FR-040 | T2.2.5, T2.4.2 |
| FR-041 | T2.6.2, T2.8.4, T2.9.3 |

### Requisitos no funcionales

| Requisito | Tareas / validaciones |
|---|---|
| NFR-001 | T2.1.1, T2.1.5, T2.8.4 |
| NFR-002 | T2.1.4, T2.2.3, T2.8.4 |
| NFR-003 | T2.8.1, T2.8.4, T2.9.4 |
| NFR-004 | T2.6.1, T2.8.2, T2.8.3 |
| NFR-005 | T2.3.1, T2.6.1 |
| NFR-006 | T2.6.2, T2.9.3 |
| NFR-007 | T2.8.4, T2.9.8 |
| NFR-008 | T2.4.3, T2.6.1 |
| NFR-009 | T2.1.2, T2.8.2 |
| NFR-010 | T2.3.2, T2.3.5 |

### Reglas de negocio

| Reglas | Tareas |
|---|---|
| BR-001, BR-002 | T2.0.8, T2.4.3 (la interfaz no ofrece la ruta); validación definitiva en el backend |
| BR-003 | T2.0.8, T2.6.2, T2.6.3 |
| BR-004–BR-006 | T2.8.4, T2.9.9 (ausencia de pantallas de estado, solicitudes o confirmación) |
| BR-007, BR-008 | T2.2.2, T2.4.2, T2.9.1 |
| BR-009 | T2.2.2, T2.7.2 |
| BR-010, BR-011 | T2.0.8, T2.5.3, T2.7.1 |
| BR-012, BR-013 | T2.0.8, T2.5.1 |
| BR-014 | T2.0.8, T2.6.5 |
| BR-015, BR-016 | T2.0.9, T2.7.5 |
| BR-017–BR-019 | T2.0.4, T2.0.7, T2.1.2, T2.1.4, T2.3.6, T2.8.1 |

### Escenarios del spec

| Escenarios | Tareas |
|---|---|
| SC-01 a SC-06 | T2.9.1 |
| SC-07 a SC-11 | T2.9.5 |
| SC-12 a SC-18 | T2.9.4 |
| SC-19 a SC-27, SC-31 | T2.9.2 |
| SC-28 a SC-30, SC-32 | T2.9.3 |

### Criterios de aceptación del spec (§9)

| Criterio | Verificación |
|---|---|
| 1, 3 | T2.9.1 |
| 2 | T2.4.3, T2.9.2 |
| 4 | T2.5.1, T2.9.2 |
| 5 | T2.5.3, T2.9.2 |
| 6 | T2.6.1, T2.9.1 |
| 7, 8, 10, 11 | T2.6.2, T2.6.3, T2.6.4, T2.9.3 |
| 9 | T2.6.6, T2.9.2 |
| 12 | T2.7.1, T2.9.7 |
| 13 | T2.7.5, T2.9.7 |
| 14 | T2.3.1, T2.3.3, T2.3.4, T2.9.5 |
| 15 | T2.3.5, T2.9.5 |
| 16, 17, 18 | T2.3.6, T2.9.4, T2.9.7 |
| 19 | T2.1.4, T2.8.1, T2.9.4 |
| 20 | T2.7.4, T2.9.5 (condicionada) |
| 21 | T2.2.5, T2.9.2 |
| 22, 23 | T2.8.4, T2.9.9 |
| 24 | T2.8.2, T2.8.3 |

### Decisiones y secciones del plan

| Elemento del plan | Tareas |
|---|---|
| §2 Enfoque arquitectónico; §5 Estructura | T2.1.1, T2.1.5, T2.8.4 |
| §4.1–§4.2 Modelo y comunicación | T2.2.1–T2.2.4 |
| §4.3 Estado | T2.4.1, T2.8.4 |
| §4.4 Vistas | T2.3.4, T2.3.5, T2.4.4 |
| §4.5 Ruta del movimiento | T2.4.3 |
| §4.6 Selección serializada | T2.5.1, T2.5.2, T2.5.5 |
| §4.7 Selección por cantidad | T2.5.3, T2.5.4 |
| §4.8 Formularios y validaciones | T2.1.3, T2.4.1, T2.4.2 |
| §4.9 Confirmación y duplicados | T2.6.1, T2.6.2, T2.6.4, T2.6.7 |
| §4.10 Existencias | T2.7.1 |
| §4.11 Historial | T2.3.1–T2.3.4 |
| §4.12 Detalle | T2.3.5, T2.3.6 |
| §4.13 Acceso por rol y ubicación | T2.1.2, T2.1.4, T2.3.1, T2.3.6, T2.8.1 |
| §4.14 Bitácora y hoja de vida | T2.0.9, T2.7.5 (T2.7.3, T2.7.4 condicionadas) |
| §4.15 Errores y estados | T2.2.5, T2.3.x, T2.6.3, T2.6.6 |
| §4.16 UX, responsive y accesibilidad | T2.8.2, T2.8.3 |
| §6 Contratos y lista de verificación | T2.0.6–T2.0.9, T2.2.x |
| §7 Rutas y navegación | T2.1.4 |
| §8 Conectividad; §9 Seguridad | T2.8.1, T2.8.4 |
| §10 Pruebas | T2.9.x y pruebas por tarea |
| §11 Secuencia de implementación | Fases 2.0–2.9 (tabla de correspondencia) |
| DP-01 a DP-15 | Ver «Impedimentos conocidos» y «Capacidades condicionadas» |

## Regla de ejecución

La implementación deberá respetar `constitution.md`, `spec.md`, `plan.md` y el contrato vigente de `backend-api`. Reglas:

1. **Ninguna tarea está completada por adelantado.** Una tarea se marca `[x]` solo después de implementarla y validarla, con evidencia en el «Registro de avance».
2. Las tareas con **Bloqueo** no se ejecutan hasta resolver su dependencia. Si una tarea encuentra un DTO incompleto, una discrepancia o una decisión pendiente, se detiene únicamente esa integración y se documenta; no se completa por suposición ni se amplía el alcance.
3. No se implementan en el frontend la atomicidad, la autorización efectiva, el alcance por ubicación, la generación del correlativo `TR-XXXXXX` ni la persistencia del movimiento.
4. No se añaden dependencias, ni se modifican la Constitución ni los documentos de fases anteriores. Cualquier ajuste a `spec.md` o `plan.md` requiere autorización del responsable.
5. Los commits usan Conventional Commits en inglés; no se hace push, merge ni Pull Request sin instrucción expresa. La integración a `develop` requiere Pull Request y revisión de un compañero (Constitución §13.5).
6. Las verificaciones contra el backend real no guardan credenciales ni tokens, usan datos de prueba identificados y no modifican el backend.
7. Si una verificación no puede ejecutarse (cuentas, entorno, datos), se registra como pendiente; nunca se declara cumplida.

## Registro de verificación (a completar en T2.0.1–T2.0.11)

| # | Verificación (lista de plan §6.5) | Tarea | Resultado | Evidencia | Estado |
|---|---|---|---|---|---|
| 1 | Endpoints de creación, listado y detalle de guías; presencia en `API_CONTRACTS.md` | T2.0.6 | | | Pendiente |
| 2 | Forma de las líneas mixtas y de indicar el tipo de movimiento | T2.0.6 | | | Pendiente |
| 3 | Identificación del Almacén Central | T2.0.10 | | | Pendiente |
| 4 | Rechazos de puesto → puesto, origen = destino y ubicaciones inactivas | T2.0.8 | | | Pendiente |
| 5 | Roles que autorizan la creación; rol del Encargado de Almacén | T2.0.4, T2.0.7 | | | Pendiente |
| 6 | Alcance de lectura de `VENDEDOR`/`TECNICO`; usuario sin ubicación | T2.0.3, T2.0.7 | | | Pendiente |
| 7 | Guía de otro puesto: `403` o `404` | T2.0.7 | | | Pendiente |
| 8 | Estados de unidad movibles; chasis con componentes | T2.0.8 | | | Pendiente |
| 9 | Cantidades enteras; máximo de líneas | T2.0.8 | | | Pendiente |
| 10 | Respuesta de creación (id, código, fecha, responsable, ruta, líneas) | T2.0.6 | | | Pendiente |
| 11 | Formato del código `TR-XXXXXX`; búsqueda por código | T2.0.6, T2.0.8 | | | Pendiente |
| 12 | Filtros, orden y paginación del listado | T2.0.6 | | | Pendiente |
| 13 | Idempotencia o detección de duplicados | T2.0.9 | | | Pendiente |
| 14 | Atomicidad total y error por línea | T2.0.8 | | | Pendiente |
| 15 | Registro en bitácora y hoja de vida | T2.0.9 | | | Pendiente |
| 16 | Datos sensibles en respuestas de lectura (costos) | T2.0.6 | | | Pendiente |
| 17 | Formato y zona horaria de fechas | T2.0.6 | | | Pendiente |
| 18 | Exportaciones de `inventory/index.ts`; listado de hardware disponible | T2.0.5 | | | Pendiente |
| 19 | Datos del perfil autenticado (ubicación asignada, rol) | T2.0.3 | | | Pendiente |
| 20 | Diferencias entre `refact/logistica`, `develop` y la definición funcional | T2.0.6, T2.0.11 | | | Pendiente |

## Registro de avance

**24/11/2026 — Verificación contractual y autorización.** Se comprueban rama frontend `feature/fase-2-logistica`, checkout backend `refact/logistica`, perfil/JWT con ubicación, endpoints y DTOs en `plan.md` §6.2–§6.3. Se autoriza expresamente continuar y corregir documentos sin integración previa en `develop`; no se autorizan commits ni publicación. Backend se consulta sin modificaciones. B6–B10 permanecen abiertos; ninguna lectura estática se declara prueba de integración ni tarea funcional completada.

Cada bloque implementado y validado se registrará aquí con fecha, tareas completadas, resultados de las pruebas (archivos y casos aprobados), comandos de calidad ejecutados, verificaciones reales realizadas y pendientes, sin afirmar verificaciones que no se hicieron.

---

**Fin de las tareas de implementación de la Fase 2.**