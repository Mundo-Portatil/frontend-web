# Spec: Phase 0 — Frontend Foundations

**Feature Branch:** `feature/phase-0-foundation`  
**Repository:** `frontend-web`  
**Phase:** 0 — Cimientos Transversales  
**Status:** Draft

---

## 1. Purpose

Establecer la infraestructura transversal del frontend de Mundo Portátil para proporcionar autenticación, gestión de sesión, autorización visual, administración de usuarios, gestión de ubicaciones y consulta de bitácora.

Esta fase implementará las interfaces y mecanismos de integración necesarios para consumir los servicios existentes del backend, manteniendo una experiencia coherente y segura para los usuarios.

Los componentes desarrollados deberán ser reutilizables por los módulos funcionales M1-M8, evitando duplicar lógica de autenticación, manejo de permisos, selección de ubicación y comunicación con el backend.

### 1.1. Goals

- Implementar la pantalla de inicio de sesión.
- Gestionar la sesión del usuario mediante Zustand.
- Consumir los endpoints de autenticación existentes.
- Adjuntar automáticamente el JWT en las solicitudes protegidas mediante Axios.
- Implementar protección de rutas según los roles del usuario.
- Implementar la interfaz administrativa de gestión de usuarios.
- Implementar la desactivación (baja) de usuarios conforme al contrato del backend.
- Implementar la interfaz de gestión de ubicaciones.
- Proporcionar un selector global de ubicación operativa.
- Implementar una interfaz de consulta de bitácora de solo lectura.
- Centralizar el tratamiento de errores y las notificaciones.
- Operar exclusivamente con conexión al backend durante esta fase (la arquitectura Offline-First queda aplazada a una fase posterior, conforme a la decisión aprobada y documentada en la Constitución).

### 1.2. Non-Goals

Esta fase no contempla:

- Implementar lógica interna de autenticación del servidor.
- Generar o firmar tokens JWT desde el frontend.
- Validar criptográficamente tokens.
- Implementar reglas de autorización en el backend.
- Implementar operaciones internas de base de datos.
- Modificar los contratos o endpoints del backend.
- Implementar las funcionalidades comerciales de M1-M8.
- Desarrollar la interfaz completa de los módulos posteriores.

---

## 2. Scope

### 2.1. Functional Components

| ID | Component | Description |
|---|---|---|
| F0-C01 | Authentication UI | Inicio de sesión y gestión de sesión del usuario. |
| F0-C02 | Session Management | Persistencia y disponibilidad del contexto autenticado. |
| F0-C03 | Frontend Authorization | Protección de rutas y visibilidad condicional de acciones. |
| F0-C04 | Location Management | Consulta, creación y edición de ubicaciones. |
| F0-C05 | Active Location Context | Selección y disponibilidad de la ubicación operativa. |
| F0-C06 | Audit Log Viewer | Consulta de registros de auditoría. |
| F0-C07 | Error Handling | Manejo centralizado de errores y notificaciones. |
| F0-C08 | User Management | Administración de usuarios desde la interfaz frontend. |

### 2.2. User Roles

El frontend deberá reconocer los siguientes roles:

- `ADMIN`
- `VENDEDOR`
- `TECNICO`

La visibilidad de las rutas, pantallas y acciones deberá ajustarse al rol y a los permisos disponibles para el usuario.

El frontend no será considerado una fuente de autorización definitiva. El backend continuará siendo responsable de aplicar las restricciones reales de acceso.

---

## 3. User Stories

### US-001 — Authentication

Como usuario del sistema, quiero iniciar sesión con mis credenciales para acceder a las funcionalidades que tengo autorizadas.

### US-002 — Session Persistence

Como usuario autenticado, quiero conservar mi sesión al navegar por la aplicación para no tener que iniciar sesión nuevamente en cada cambio de pantalla.

### US-003 — Protected Navigation

Como usuario, quiero visualizar únicamente las rutas y acciones que corresponden a mis permisos para evitar acceder accidentalmente a funcionalidades no autorizadas.

### US-004 — User Administration

Como administrador, quiero consultar, registrar y editar usuarios para gestionar el acceso al sistema.

### US-005 — Location Administration

Como administrador, quiero consultar, registrar y editar ubicaciones para mantener actualizada la estructura física del negocio.

### US-006 — Active Location Selection

Como usuario operativo, quiero seleccionar mi ubicación de trabajo para que las funcionalidades del sistema utilicen el contexto operativo correspondiente.

### US-007 — Audit Log Consultation

Como administrador, quiero consultar y filtrar los registros de auditoría para revisar las operaciones realizadas en el sistema.

### US-008 — Error Feedback

Como usuario, quiero recibir mensajes claros en español cuando ocurra un error para comprender qué sucedió y qué puedo hacer.

---

## 4. Functional Requirements

### 4.1. Authentication and Session

**FR-001 — Login Screen**

El frontend deberá proporcionar una pantalla de inicio de sesión accesible mediante la ruta `/login`.

La pantalla deberá permitir introducir las credenciales requeridas por el contrato de autenticación del backend.

**FR-002 — Login Request**

El frontend deberá consumir `POST /auth/login` mediante Axios.

Los nombres de los campos enviados y la estructura de la respuesta deberán corresponder exactamente al contrato publicado por el backend.

**FR-003 — Session Initialization**

Después de una autenticación exitosa, el frontend deberá inicializar el estado de sesión en Zustand utilizando la información recibida del backend.

**FR-004 — User Profile**

El frontend deberá consumir `GET /auth/profile` para obtener la información del usuario autenticado.

**FR-005 — Session Store**

El estado global de sesión deberá administrarse mediante Zustand.

Deberá contemplar, como mínimo:

- Estado de autenticación.
- Información del usuario.
- Roles disponibles.
- Estado de inicialización de sesión.
- Estado de carga.
- Información necesaria para la gestión de sesión.

**FR-006 — Bearer Authentication**

El cliente Axios centralizado deberá adjuntar el encabezado:

`Authorization: Bearer <token>`

a las solicitudes protegidas que requieran autenticación.

**FR-007 — Session Restoration**

Al inicializar la aplicación, el frontend deberá comprobar si existe un JWT almacenado en `sessionStorage` y, en tal caso, restaurar el contexto del usuario consultando `GET /auth/profile`. Si el token no existe, ha expirado o el perfil no puede validarse, el frontend deberá presentar el estado de sesión no autenticada.

**FR-008 — Session Expiration**

Cuando una solicitud protegida reciba una respuesta `401 Unauthorized`, el frontend deberá gestionar la expiración o invalidez de la sesión, limpiar el contexto autenticado y redirigir al usuario a `/login`, evitando ciclos de redirección.

**FR-009 — Logout**

El frontend deberá permitir cerrar la sesión, limpiar el estado global de autenticación y eliminar el JWT de `sessionStorage`, conforme a la estrategia de almacenamiento aprobada en la Constitución (sección 8.1).

**FR-010 — Authentication Feedback**

Los errores de autenticación deberán mostrarse mediante mensajes comprensibles en español, sin exponer información interna del servidor.

### 4.2. Authorization and Protected Routes

**FR-011 — Route Guards**

El frontend deberá implementar mecanismos de protección de rutas mediante React Router.

**FR-012 — Role-Based Access**

Las rutas protegidas deberán comprobar los roles disponibles en el contexto autenticado.

**FR-013 — Unauthorized Route**

El frontend deberá proporcionar la ruta `/unauthorized` para mostrar una pantalla de acceso denegado.

**FR-014 — Unauthorized Access**

Cuando un usuario autenticado intente acceder a una ruta para la que no tenga autorización, el frontend deberá mostrar la pantalla de acceso denegado o redirigir a `/unauthorized`.

**FR-015 — Conditional UI Actions**

Los botones, opciones, formularios y acciones administrativas deberán mostrarse u ocultarse según los permisos correspondientes.

La visibilidad condicional deberá implementarse mediante un mecanismo único y reutilizable ubicado en `src/components/guards/`, que consuma los roles y permisos disponibles en el contexto autenticado.

Queda prohibido implementar comprobaciones de rol dispersas o ad-hoc dentro de los componentes visuales.

Este mecanismo es complementario a los guards de navegación: la protección de rutas vive exclusivamente en `src/router/`.

**FR-016 — Backend Authorization Awareness**

El frontend deberá manejar las respuestas `403 Forbidden` del backend, incluso cuando una acción se haya mostrado previamente en la interfaz.

La ocultación de acciones en UI no sustituye la autorización del servidor.

### 4.3. User Management — F0-C08

**FR-017 — Users Screen**

El frontend deberá proporcionar una interfaz administrativa de gestión de usuarios accesible mediante `/users`.

**FR-018 — User Listing**

La interfaz deberá permitir consultar los usuarios registrados mediante `GET /users`.

**FR-019 — User Creation**

La interfaz deberá permitir registrar usuarios mediante `POST /users`.

**FR-020 — User Editing**

La interfaz deberá permitir editar la información de un usuario mediante `PATCH /users/:id`.

**FR-021 — User Deactivation**

La interfaz deberá permitir desactivar (dar de baja) usuarios mediante el cambio de estado (`active: false`) en `PATCH /users/:id`, conforme al contrato del backend.

El listado de usuarios deberá reflejar el estado (`active`) de cada usuario y la operación de baja deberá estar restringida a los usuarios autorizados.

**FR-022 — User Administration Permissions**

La ruta y las acciones de gestión de usuarios deberán estar restringidas a los usuarios autorizados, de acuerdo con el contrato y la matriz de permisos.

**FR-023 — User Form Validation**

Los formularios deberán validar los datos antes de enviarlos al backend y presentar los errores de validación correspondientes.

**FR-024 — User Operation Feedback**

El frontend deberá informar el resultado de las operaciones de consulta, creación, edición y desactivación de usuarios mediante estados visuales y mensajes en español.

### 4.4. Location Management — F0-C04

**FR-025 — Locations Screen**

El frontend deberá proporcionar una interfaz de administración de ubicaciones accesible mediante `/locations`.

**FR-026 — Location Listing**

La interfaz deberá consultar las ubicaciones mediante `GET /locations`.

**FR-027 — Active Locations Listing**

El frontend deberá permitir consultar las ubicaciones activas mediante `GET /locations?active=true`.

**FR-028 — Location Creation**

La interfaz deberá permitir registrar ubicaciones mediante `POST /locations`.

**FR-029 — Location Editing**

La interfaz deberá permitir editar ubicaciones mediante `PATCH /locations/:id`, conforme al contrato vigente del backend (actualizado hasta Fase 0 — Core y Auth).

**FR-030 — Location Form Validation**

Los formularios deberán validar los datos requeridos por el contrato del backend antes de enviar las solicitudes.

**FR-031 — Location Administration Permissions**

Las operaciones de administración de ubicaciones deberán mostrarse únicamente a los usuarios autorizados.

### 4.5. Active Location Context — F0-C05

**FR-032 — Active Location Selector**

El frontend deberá proporcionar un selector de ubicación operativa disponible desde el contexto global de la aplicación.

**FR-033 — Active Location Store**

La ubicación operativa seleccionada deberá administrarse mediante Zustand.

**FR-034 — Active Location Availability**

La ubicación operativa deberá estar disponible para los módulos funcionales que requieran identificar desde dónde se realiza una operación.

**FR-035 — Active Location Validation**

El frontend deberá evitar seleccionar ubicaciones que no estén disponibles o que no correspondan a las opciones permitidas para el usuario.

**FR-036 — Location Context Persistence**

La ubicación operativa seleccionada se mantendrá en memoria mediante Zustand durante la sesión activa. Su persistencia entre recargas o sesiones de trabajo **no forma parte de la Fase 0** y se definirá en la fase Offline-First posterior, respetando las restricciones de asignación y operación que defina el negocio.

### 4.6. Audit Log Viewer — F0-C06

**FR-037 — Audit Log Screen**

El frontend deberá proporcionar una interfaz de consulta de bitácora accesible mediante `/audit-logs`.

**FR-038 — Audit Log Listing**

La interfaz deberá consumir `GET /audit-logs` para consultar los registros de auditoría.

**FR-039 — Audit Log Filters**

La interfaz deberá proporcionar filtros de consulta compatibles con los parámetros disponibles en el contrato del backend.

**FR-040 — Audit Log Information**

La interfaz deberá presentar los campos de auditoría disponibles en la respuesta del backend, sin inventar información que el contrato no proporcione.

**FR-041 — Read-Only Interface**

La interfaz de bitácora será exclusivamente de consulta.

No deberá proporcionar acciones para crear, modificar o eliminar registros de auditoría.

**FR-042 — Audit Log Permissions**

La ruta `/audit-logs` y su información deberán estar restringidas al rol y permisos administrativos definidos por el backend.

**FR-043 — Audit Log Feedback**

La interfaz deberá presentar estados de carga, ausencia de resultados y errores durante las consultas.

### 4.7. Centralized Error Handling — F0-C07

**FR-044 — Axios Error Interceptor**

El cliente Axios centralizado deberá implementar un mecanismo común para interceptar y procesar errores HTTP.

**FR-045 — HTTP 401 Handling**

El frontend deberá interpretar `401 Unauthorized` como un problema de autenticación o sesión y ejecutar el flujo correspondiente.

**FR-046 — HTTP 403 Handling**

El frontend deberá interpretar `403 Forbidden` como una operación no autorizada y presentar una respuesta visual apropiada.

**FR-047 — Network Error Handling**

El frontend deberá identificar errores de conectividad y mostrar mensajes que permitan al usuario reconocer que no se pudo establecer comunicación con el servidor.

**FR-048 — Server Error Handling**

El frontend deberá manejar errores de servidor sin exponer detalles técnicos internos.

**FR-049 — Error Contract Mapping**

Los errores deberán interpretarse utilizando la estructura real definida en el contrato del backend.

**FR-050 — Spanish User Messages**

Los mensajes visibles para el usuario deberán estar redactados en español.

**FR-051 — Notifications**

El frontend deberá proporcionar componentes reutilizables para notificaciones de éxito, advertencia y error.

---

## 5. Frontend Architecture and File Organization

La implementación deberá respetar la organización arquitectónica definida en `constitution.md`.

### 5.1. URL Routes

Las siguientes rutas deberán formar parte de la configuración centralizada de React Router.

| Route | Component | Access |
|---|---|---|
| `/login` | LoginPage | Público |
| `/users` | UsersPage | ADMIN autorizado |
| `/profile` | ProfilePage | Usuarios autenticados: ADMIN, VENDEDOR y TECNICO |
| `/locations` | LocationsPage | Usuarios autenticados; acciones de administración restringidas a ADMIN |
| `/audit-logs` | AuditLogsPage | ADMIN autorizado |
| `/unauthorized` | UnauthorizedPage | Usuarios autenticados |

Las rutas adicionales de los módulos M1-M8 no forman parte de esta especificación.

### 5.2. Module Organization

La organización funcional esperada será:

```text
src/
├── modules/
│   └── foundation/
│       ├── auth/
│       │   ├── pages/
│       │   │   └── LoginPage.tsx
│       │   ├── components/
│       │   └── services/
│       │
│       ├── users/
│       │   ├── pages/
│       │   │   └── UsersPage.tsx
│       │   ├── components/
│       │   └── services/
│       │
│       ├── locations/
│       │   ├── pages/
│       │   │   └── LocationsPage.tsx
│       │   ├── components/
│       │   └── services/
│       │
│       └── audit-logs/
│           ├── pages/
│           │   └── AuditLogsPage.tsx
│           ├── components/
│           └── services/
│
├── components/
│   ├── guards/
│   ├── notifications/
│   └── feedback/
│
├── hooks/
│
├── services/
│   ├── api/
│   │   ├── axiosInstance.ts
│   │   └── interceptors/
│   ├── printer/
│   └── scanner/
│
├── stores/
│   ├── authStore.ts
│   └── locationStore.ts
│
├── router/
│   ├── index.tsx
│   ├── ProtectedRoute.tsx
│   └── RoleGuard.tsx
│
├── config/
├── assets/
├── App.tsx
└── main.tsx
```

Esta estructura establece las ubicaciones funcionales de los componentes de la Fase 0. La organización interna de archivos podrá ampliarse sin contradecir la Constitución. Los directorios `database/` y `services/synchronization/` definidos en la Constitución como arquitectura de referencia **no forman parte de la Fase 0**: se incorporarán en la fase Offline-First posterior.

### 5.3. Responsibilities

| Element | Responsibility |
|---|---|
| `authStore.ts` | Estado de autenticación, usuario y sesión. |
| `locationStore.ts` | Ubicación operativa seleccionada. |
| `axiosInstance.ts` | Cliente HTTP centralizado. |
| `interceptors/` | Adjuntar JWT y procesar respuestas y errores HTTP. |
| `ProtectedRoute.tsx` | Comprobar autenticación antes de mostrar rutas protegidas. |
| `RoleGuard.tsx` | Controlar el acceso a rutas según los roles. |
| `components/guards/` | Componente único y reutilizable de visibilidad condicional por rol para elementos de interfaz. No participa en la protección de rutas. |
| `auth/services/` | Comunicación con endpoints de autenticación. |
| `users/services/` | Comunicación con endpoints de usuarios. |
| `locations/services/` | Comunicación con endpoints de ubicaciones. |
| `audit-logs/services/` | Comunicación con endpoints de bitácora. |
| `notifications/` | Notificaciones reutilizables. |
| `feedback/` | Estados de carga, vacío, error y acceso denegado. |

Los servicios específicos de cada módulo deberán utilizar el cliente Axios centralizado y no crear instancias independientes sin justificación arquitectónica.

---

## 6. Backend Integration

### 6.1. Source of Truth

La fuente de verdad de los contratos de integración será:

`backend-api/specs/API_CONTRACTS.md`

Rama de referencia: `origin/develop`.

La documentación Swagger/OpenAPI estará disponible en `/api`, según lo establecido para el backend.

La autenticación de las solicitudes protegidas utilizará Bearer Auth mediante JWT.

El frontend no deberá redefinir contratos, inventar campos de respuesta ni modificar la estructura de los endpoints.

### 6.2. Authentication Endpoints

| Method | Endpoint | Frontend Responsibility |
|---|---|---|
| POST | `/auth/login` | Enviar credenciales e iniciar sesión. |
| GET | `/auth/profile` | Consultar el perfil autenticado. |

**Nota sobre expiración del JWT:** la duración deseada del token es de una hora. Su configuración corresponde al backend y no debe asumirse como ya establecida; deberá verificarse y ajustarse posteriormente en `backend-api` sin modificar el contrato actual. El frontend debe manejar correctamente las respuestas `401` de token expirado con independencia de la duración configurada.

### 6.3. User Endpoints

| Method | Endpoint | Frontend Responsibility |
|---|---|---|
| GET | `/users` | Consultar usuarios. |
| POST | `/users` | Registrar usuarios. |
| PATCH | `/users/:id` | Editar usuarios; la baja (desactivación) se realiza mediante `active: false`. |
| PATCH | `/users/me` | Editar el nombre, correo o contraseña de la identidad autenticada, para los tres roles. |

Las operaciones deberán ejecutarse conforme a los permisos definidos por el backend.

### 6.4. Location Endpoints

| Method | Endpoint | Frontend Responsibility |
|---|---|---|
| GET | `/locations` | Consultar ubicaciones. |
| GET | `/locations?active=true` | Consultar ubicaciones activas. |
| POST | `/locations` | Registrar ubicaciones. |
| PATCH | `/locations/:id` | Editar ubicaciones; incluye desactivación mediante `active: false`. |

### 6.5. Audit Log Endpoints

| Method | Endpoint | Frontend Responsibility |
|---|---|---|
| GET | `/audit-logs` | Consultar registros de auditoría. |

Los parámetros de filtrado, paginación y ordenamiento deberán corresponder con los definidos en el contrato del backend.

### 6.6. Contract Compatibility

Antes de implementar los servicios de integración, se deberá comprobar:

- Estructura de los DTO de solicitud.
- Estructura de las respuestas.
- Campos obligatorios y opcionales.
- Parámetros de consulta.
- Identificadores de recursos.
- Estructura de errores.
- Códigos HTTP.
- Permisos requeridos por endpoint.

No se deberán utilizar estructuras provisionales como si fueran contratos oficiales.

---

## 7. Alcance de conectividad de la Fase 0

**Decisión aprobada:** la arquitectura Offline-First queda **aplazada completamente a una fase posterior**. Durante la Fase 0 la aplicación funciona exclusivamente con conexión a Internet.

En consecuencia, durante la Fase 0:

- Todas las operaciones son **Online-required**: requieren comunicación con el backend para ejecutarse.
- No se implementa persistencia offline de sesión ni del JWT.
- No se implementa caché offline del perfil del usuario.
- No se implementa caché offline de ubicaciones.
- No se implementa persistencia de la ubicación seleccionada para funcionamiento offline.
- No se implementan colas de sincronización ni recuperación de operaciones pendientes.
- No se incorpora Dexie.js ni IndexedDB.
- No se configura Service Worker para caché de datos operativos.

Los principios Offline-First de la Constitución (sección 9) permanecen vigentes como arquitectura de referencia y se aplicarán en la fase posterior dedicada, cuando se definan sus requisitos, clasificación de operaciones y mecanismos de sincronización mediante las Specs y ADR correspondientes.

### 7.1. Comportamiento ante ausencia de conectividad

Aunque no exista funcionalidad offline, la Fase 0 debe comportarse correctamente cuando no haya conexión:

- Las operaciones que requieren el backend no deberán presentarse como exitosas si no pueden ejecutarse.
- La interfaz deberá informar claramente que no se pudo establecer comunicación con el servidor.
- Deberá permitirse reintentar la operación cuando la conectividad se restablezca.
- No se presentará información inventada ni simulada como si proviniera del backend.

---

## 8. UI States

Todas las vistas de esta fase deberán contemplar estados de interfaz consistentes.

### 8.1. Loading State

El frontend deberá mostrar un estado de carga cuando:

- Se esté enviando una solicitud.
- Se esté consultando información.
- Se esté inicializando la sesión.
- Se esté recuperando el perfil.
- Se esté procesando una operación administrativa.

Se deberá evitar que el usuario interprete una operación en curso como una operación completada.

### 8.2. Empty State

Las vistas de consulta deberán mostrar un estado vacío cuando no existan resultados.

Ejemplos:

- No hay usuarios registrados.
- No hay ubicaciones disponibles.
- No existen registros de auditoría para los filtros aplicados.

### 8.3. Network Error State

Cuando no exista conectividad con el backend, la interfaz deberá:

- Informar que no se pudo establecer comunicación.
- Evitar presentar una operación como exitosa.
- Permitir reintentar cuando corresponda.
- No presentar información simulada o inventada como si proviniera del backend.

### 8.4. Server Error State

Cuando el backend responda con un error de servidor, la interfaz deberá mostrar un mensaje comprensible sin exponer detalles internos.

### 8.5. Unauthorized State

Cuando el usuario no tenga autorización para acceder a una ruta o ejecutar una acción, la interfaz deberá mostrar el estado de acceso denegado correspondiente.

### 8.6. Success State

Las operaciones exitosas deberán proporcionar retroalimentación visual mediante notificaciones o mensajes adecuados.

### 8.7. UI State Matrix

| View | Loading | Empty | Error | Unauthorized | Success |
|---|---|---|---|---|---|
| Login | Sí | No aplica | Sí | No aplica | Sí |
| Users | Sí | Sí | Sí | Sí | Sí |
| Locations | Sí | Sí | Sí | Sí | Sí |
| Audit Logs | Sí | Sí | Sí | Sí | Sí |
| Active Location Selector | Sí | Sí | Sí | Sí | Sí |

---

## 9. Business Rules

**BR-001 — Backend Authorization**

El frontend no sustituirá los mecanismos de autorización del backend.

**BR-002 — Session Requirement**

Las rutas administrativas y operativas protegidas requerirán una sesión autenticada.

**BR-003 — Role-Based Visibility**

La visibilidad de las rutas y acciones deberá corresponder con los roles y permisos disponibles para el usuario.

**BR-004 — Session Expiration**

Una respuesta `401` deberá activar el tratamiento de sesión expirada o inválida.

**BR-005 — Access Denied**

Una respuesta `403` deberá comunicar que el usuario no tiene autorización para realizar la operación.

**BR-006 — Active Location Context**

Los módulos que requieran ubicación operativa deberán consumir el contexto global de ubicación.

**BR-007 — Location Availability**

El frontend no deberá permitir utilizar una ubicación que haya sido identificada como inactiva o no disponible.

**BR-008 — Administrative Operations**

La creación y edición de usuarios y ubicaciones requerirá conexión con el backend.

**BR-009 — Audit Log Read-Only**

La interfaz de consulta de bitácora no permitirá modificar ni eliminar registros.

**BR-010 — API Contract Compliance**

Toda solicitud y respuesta deberá respetar los contratos publicados por el backend.

**BR-011 — Spanish UI**

Los textos visibles y mensajes dirigidos al usuario deberán estar redactados en español.

**BR-012 — English Identifiers**

Los nombres de carpetas, archivos, componentes, variables y rutas URL deberán utilizar inglés.

**BR-013 — Local Data Restrictions**

La información de sesión restaurada desde `sessionStorage` no sustituirá las validaciones actuales del backend. La persistencia local de datos operativos queda aplazada a la fase Offline-First.

**BR-014 — Centralized HTTP Communication**

Los servicios de los módulos deberán utilizar la instancia centralizada de Axios.

---

## 10. Acceptance Criteria

### 10.1. Authentication

**AC-001**

El usuario puede acceder a la pantalla `/login`.

**AC-002**

El formulario envía las credenciales mediante `POST /auth/login`.

**AC-003**

Una autenticación exitosa inicializa el estado de sesión en Zustand.

**AC-004**

El frontend puede consultar el perfil mediante `GET /auth/profile`.

**AC-005**

Las solicitudes protegidas incluyen el encabezado Bearer correspondiente.

**AC-006**

Una respuesta `401` activa el flujo de expiración o invalidez de sesión.

**AC-007**

El cierre de sesión limpia el contexto local de autenticación.

### 10.2. Authorization

**AC-008**

Las rutas protegidas impiden el acceso a usuarios no autenticados.

**AC-009**

Las rutas y acciones se muestran según los roles y permisos disponibles.

**AC-010**

Los usuarios sin autorización reciben una pantalla o mensaje de acceso denegado.

**AC-011**

Una respuesta `403` se maneja correctamente sin provocar un cierre de sesión innecesario.

### 10.3. User Management

**AC-012**

Un administrador autorizado puede consultar usuarios.

**AC-013**

Un administrador autorizado puede registrar usuarios.

**AC-014**

Un administrador autorizado puede editar y desactivar (dar de baja) usuarios.

**AC-015**

Los errores de validación del backend se muestran adecuadamente en los formularios.

### 10.4. Location Management

**AC-016**

Un administrador autorizado puede consultar las ubicaciones.

**AC-017**

El frontend puede consultar las ubicaciones activas.

**AC-018**

Un administrador autorizado puede registrar ubicaciones.

**AC-019**

Un administrador autorizado puede editar ubicaciones.

**AC-020**

El selector global permite elegir una ubicación disponible.

**AC-021**

La ubicación seleccionada puede ser consultada por otros módulos mediante Zustand.

### 10.5. Audit Log

**AC-022**

Un administrador autorizado puede acceder a `/audit-logs`.

**AC-023**

La interfaz consulta los registros mediante `GET /audit-logs`.

**AC-024**

Los filtros disponibles corresponden con el contrato del backend.

**AC-025**

La interfaz permite consultar los registros sin proporcionar operaciones de modificación o eliminación.

### 10.6. Error Handling

**AC-026**

Los errores HTTP se procesan mediante el mecanismo centralizado de Axios.

**AC-027**

Los errores de conectividad muestran mensajes adecuados.

**AC-028**

Los errores de servidor no exponen información interna.

**AC-029**

Los mensajes visibles para el usuario están redactados en español.

### 10.7. Conectividad e integridad de datos

**AC-030**

Las operaciones que requieren el backend no se presentan como exitosas cuando no existe conectividad; la interfaz informa el problema y permite reintentar.

**AC-031 (aplazado)**

La recuperación de información previamente almacenada en almacenamiento local se evaluará en la fase Offline-First posterior. No forma parte de los criterios de aceptación de la Fase 0.

**AC-032 (aplazado)**

La distinción en la interfaz entre información cacheada e información obtenida del backend se evaluará en la fase Offline-First posterior. No forma parte de los criterios de aceptación de la Fase 0.

**AC-033**

La información de sesión restaurada desde `sessionStorage` no sustituye la autorización del servidor: el frontend valida el contexto mediante `GET /auth/profile` y respeta las respuestas `401` y `403` del backend.

### 10.8. Quality

**AC-034**

Las vistas contemplan los estados de carga, vacío y error correspondientes.

**AC-035**

Los componentes transversales son reutilizables por los módulos posteriores.

**AC-036**

La implementación respeta la estructura de carpetas, tecnologías y estándares definidos en `constitution.md`.

---

## 11. Open Business and Contract Decisions

Esta sección contiene únicamente decisiones que todavía necesitan definición o confirmación.

| ID | Open Decision | Impact | Estado |
|---|---|---|---|
| OD-001 | Determinar si un usuario puede tener uno o varios roles. | Gestión de sesión, autorización visual y administración de usuarios. | **Resuelta:** el contrato define un rol único por usuario (enum `Role`: `ADMIN`, `VENDEDOR`, `TECNICO`). |
| OD-002 | Determinar si la ubicación del usuario es fija o puede cambiar dinámicamente por turno. | Selector de ubicación y contexto operativo. | Pendiente: el contrato no vincula usuarios a ubicaciones. |
| OD-003 | Definir la matriz granular de permisos por acción para ADMIN, VENDEDOR y TECNICO. | Guards, rutas y visibilidad condicional. | Parcialmente resuelta: los roles por endpoint están definidos en el contrato; las acciones visuales granulares quedan definidas en esta Spec. |
| OD-004 | Confirmar si el backend permite a cada usuario operar desde múltiples ubicaciones. | Selector y persistencia de ubicación. | Pendiente: el contrato no vincula usuarios a ubicaciones. |
| OD-005 | Confirmar los campos exactos de los DTO de usuarios y ubicaciones. | Formularios y validaciones. | **Resuelta:** definidos en el contrato (usuarios: `email`, `name`, `role`, `active`, `password`; ubicaciones: `name`, `type`, `active`). |
| OD-006 | Confirmar los parámetros de filtrado y paginación de `/audit-logs`. | Interfaz de consulta de bitácora. | **Resuelta:** el contrato define `module`, `userId`, `page` (default 1) y `limit` (default 20, máx. 100). |
| OD-007 | Confirmar la estructura exacta del error estandarizado del backend. | Interceptores Axios y mensajes de usuario. | **Resuelta:** el contrato define la estructura `{ message, error, statusCode }`; `message` puede ser string o arreglo de strings. |
| OD-008 | Definir el comportamiento de persistencia y recuperación offline de la sesión y la ubicación activa, respetando la Constitución. | Zustand y Dexie.js. | **Resuelta — aplazada:** la arquitectura Offline-First no forma parte de la Fase 0. La aplicación opera exclusivamente en línea; sin Dexie.js, caché ni sincronización. Se abordará en una fase posterior con sus propios requisitos y ADR. |
| OD-009 | Confirmar la estrategia de persistencia y seguridad del token en el frontend conforme a la Constitución. | Gestión de sesión e interceptores Axios. | **Resuelta:** JWT Bearer almacenado en `sessionStorage` (Constitución, sección 8.1). Sin `localStorage`, sin cookies, sin refresh tokens ni control de inactividad en la Fase 0. La expiración deseada del JWT (una hora) debe verificarse y ajustarse posteriormente en el backend sin modificar el contrato. |

Las decisiones marcadas como resueltas quedaron definidas en `backend-api/specs/API_CONTRACTS.md` (rama `origin/develop`, actualizado hasta Fase 0 — Core y Auth) y no deberán volver a tratarse como pendientes.

---

## 12. Dependencies and Constraints

### 12.1. Dependencies

- `constitution.md` del repositorio `frontend-web`.
- `backend-api/specs/API_CONTRACTS.md` desde `origin/develop`.
- Swagger/OpenAPI del backend disponible en `/api`.
- Servicios de autenticación del backend.
- Endpoints de usuarios.
- Endpoints de ubicaciones.
- Endpoint de consulta de bitácora.

### 12.2. Technical Constraints

La implementación deberá utilizar exclusivamente las tecnologías y mecanismos establecidos en la Constitución:

- React.
- Vite.
- TypeScript.
- Tailwind CSS.
- React Router.
- Zustand.
- Axios.
- Vitest y React Testing Library (verificación de calidad).

No se deberán incorporar dependencias adicionales sin una justificación arquitectónica y la aprobación correspondiente.

**No aplicables en la Fase 0 (aplazados por decisión aprobada):** Dexie.js, IndexedDB, Service Workers y `vite-plugin-pwa`. Se incorporarán en la fase Offline-First posterior.

### 12.3. Development Constraints

- El código, identificadores y rutas URL deberán utilizar inglés.
- Los mensajes visibles para el usuario deberán utilizar español.
- Los servicios HTTP deberán centralizar la comunicación mediante Axios.
- La lógica transversal deberá ser reutilizable.
- No se deberán duplicar mecanismos de autenticación o manejo de errores.
- La implementación deberá respetar GitFlow y las reglas de Pull Request de la Constitución.

---

### 12.4. Gestión del perfil personal — ampliación autorizada

**FR-052 — Acceso al perfil personal:** el área del usuario en el header deberá ser un control accesible que permita abrir la opción «Mi perfil». La vista `/profile` estará disponible para `ADMIN`, `VENDEDOR` y `TECNICO`, en escritorio y móvil, mediante las protecciones de sesión existentes.

**FR-053 — Actualización de datos propios:** el formulario permitirá modificar nombre, correo y contraseña mediante `PATCH /users/me`. Solo enviará propiedades modificadas entre `name`, `email` y `password`; no aceptará ID, rol, permisos ni estado administrativo. La identidad la determina el JWT en el backend.

**FR-054 — Validación y seguridad:** validar correo, nombre y contraseña nueva de al menos seis caracteres conforme al DTO. La contraseña será opcional, nunca se recuperará ni mostrará una contraseña existente, y se limpiará tras guardar. El contrato no requiere contraseña actual; no se enviará un campo adicional. Presentar errores de validación, correo duplicado, sesión inválida y red mediante los mecanismos existentes.

**FR-055 — Sincronización de sesión:** tras guardar, reflejar los datos confirmados en el contexto autenticado y el header sin exigir logout. La restauración al recargar seguirá usando `GET /auth/profile` y el JWT de `sessionStorage`.

**Criterios de aceptación del perfil:** los tres roles pueden editar su propia cuenta; no pueden seleccionar otra identidad ni modificar privilegios; nombre/correo actualizados se reflejan en el header; la recarga restaura los datos del servidor; contraseña opcional y errores funcionan conforme al contrato; se mantienen sesión y permisos. La persistencia real y el cambio efectivo de contraseña requieren comprobación con un backend disponible.

## 13. Definition of Done

La Fase 0 se considerará completada cuando:

1. La pantalla de autenticación esté implementada y consuma los endpoints definidos.
2. La sesión se gestione correctamente mediante Zustand.
3. Axios adjunte el token Bearer a las solicitudes protegidas.
4. Los flujos `401` y `403` estén implementados.
5. Las rutas protegidas funcionen según los roles y permisos.
6. La interfaz de gestión de usuarios esté implementada.
7. La interfaz de gestión de ubicaciones esté implementada.
8. El selector global de ubicación operativa esté disponible.
9. La interfaz de consulta de bitácora esté implementada.
10. El manejo centralizado de errores esté disponible.
11. La aplicación funcione exclusivamente con conexión, conforme al alcance online-only aprobado para esta fase (Offline-First aplazado).
12. Las vistas implementen los estados de interfaz requeridos.
13. Los contratos consumidos coincidan con la versión vigente del backend.
14. La implementación cumpla los criterios de aceptación.
15. El proyecto supere las comprobaciones de TypeScript y compilación establecidas en la Constitución.
16. Las pruebas definidas con Vitest y React Testing Library estén implementadas y superadas.

---

**End of Specification**
