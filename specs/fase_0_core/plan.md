# Plan de Implementación: Fase 0 — Cimientos Transversales

**Repositorio:** `frontend-web`  
**Especificación:** `specs/fase_0_core/spec.md`  
**Estado:** Propuesto  
**Fase:** 0 — Cimientos Transversales

## 1. Objetivo

Definir la solución técnica para implementar los cimientos transversales del frontend de Mundo Portátil, estableciendo una infraestructura común de autenticación, gestión de sesiones, autorización, usuarios, ubicaciones, consulta de bitácora y manejo de errores.

La implementación deberá respetar la Constitución Técnica del proyecto y los requisitos funcionales definidos en `spec.md`.

El resultado permitirá que los módulos funcionales M1–M8 reutilicen los servicios y mecanismos transversales sin tener que implementar nuevamente estas capacidades.

## 2. Enfoque arquitectónico

Se utilizará una arquitectura modular por funcionalidades, separando las responsabilidades de presentación, estado global, comunicación con el backend y persistencia local.

La implementación seguirá los siguientes principios:

- Separación de responsabilidades entre módulos.
- Reutilización de componentes y servicios transversales.
- Centralización de la comunicación HTTP.
- Gestión centralizada del estado de autenticación y ubicación.
- Protección de rutas y acciones según los permisos correspondientes.
- Operación exclusivamente en línea durante la Fase 0: la persistencia local y la arquitectura Offline-First quedan aplazadas a una fase posterior (decisión aprobada).
- Integración mediante los contratos definidos por el backend.
- Evitar dependencias adicionales que no sean necesarias.

### 2.1. Tecnologías

Se utilizarán las tecnologías establecidas en la Constitución Técnica:

| Responsabilidad | Tecnología |
|---|---|
| Interfaz de usuario | React |
| Herramienta de construcción | Vite |
| Lenguaje | TypeScript |
| Estilos | Tailwind CSS |
| Navegación | React Router |
| Estado global | Zustand |
| Comunicación HTTP | Axios |
| Pruebas | Vitest + React Testing Library |

**No aplicables en la Fase 0 (aplazados por decisión aprobada):** Dexie.js, IndexedDB, `vite-plugin-pwa` y Service Workers. La aplicación funciona exclusivamente con conexión; la persistencia local se abordará en la fase Offline-First posterior.

No se incorporarán nuevas dependencias sin una justificación técnica.

## 3. Diseño de la solución

### 3.1. Infraestructura de comunicación con el backend

Se implementará una instancia centralizada de Axios para gestionar las solicitudes HTTP hacia el backend.

Esta instancia será responsable de:

- Centralizar la URL base de la API.
- Configurar los encabezados comunes.
- Incorporar automáticamente el token JWT en las solicitudes protegidas.
- Procesar las respuestas del backend.
- Gestionar errores HTTP mediante interceptores.
- Evitar la duplicación de configuraciones en los servicios de cada módulo.

Cada funcionalidad tendrá sus propios servicios para mantener separada la lógica de comunicación.

### 3.2. Autenticación y gestión de sesiones

Se implementará el flujo de autenticación mediante los endpoints establecidos en el contrato del backend:

- `POST /auth/login`
- `GET /auth/profile`

El proceso contemplará:

1. El usuario ingresa sus credenciales desde la pantalla de inicio de sesión.
2. El frontend envía las credenciales al backend.
3. El backend valida las credenciales y devuelve la información de autenticación.
4. El frontend obtiene el perfil del usuario autenticado.
5. La información de sesión se centraliza mediante Zustand.
6. Axios utiliza el JWT en las solicitudes protegidas.
7. Si la sesión deja de ser válida, se ejecuta el flujo de cierre de sesión y redirección correspondiente.

El JWT se almacenará en `sessionStorage`, conforme a la estrategia aprobada en la Constitución (sección 8.1):

- El token recibido del login se guarda en `sessionStorage`.
- Al recargar la página, el frontend recupera el JWT y restaura el estado de autenticación validándolo mediante `GET /auth/profile`.
- Axios adjunta automáticamente `Authorization: Bearer <token>` en las solicitudes protegidas.
- El cierre de sesión elimina el token de `sessionStorage` y limpia el estado global.
- No se implementan refresh tokens ni renovación automática: ante un `401` por token expirado, se cierra la sesión y se solicita nueva autenticación.
- No se utiliza `localStorage` ni cookies para el token.

**Expiración del JWT:** la duración deseada es de una hora. Su configuración corresponde al backend y no debe asumirse como ya establecida; deberá verificarse y ajustarse posteriormente en `backend-api` sin modificar el contrato. El frontend maneja la expiración mediante el tratamiento de respuestas `401`, con independencia de la duración configurada.

### 3.3. Autorización y protección de rutas

Se implementará un mecanismo reutilizable para controlar el acceso a las funcionalidades del frontend.

Se utilizarán componentes de protección de rutas y componentes de autorización por roles.

Los roles contemplados son:

- `ADMIN`
- `VENDEDOR`
- `TECNICO`

La solución deberá:

- Impedir el acceso a rutas protegidas cuando no exista una sesión válida.
- Restringir las funcionalidades según los permisos del usuario.
- Controlar la visibilidad de acciones y elementos de interfaz.
- Redirigir a `/unauthorized` cuando el usuario no tenga autorización.
- Gestionar las respuestas `401` y `403` del backend.

La protección del frontend será complementaria a la autorización del backend, que seguirá siendo la autoridad definitiva.

La visibilidad condicional de elementos de interfaz se implementará mediante un mecanismo único y reutilizable en `src/components/guards/`, separado de la protección de rutas que reside en `src/router/`. Queda prohibido duplicar comprobaciones de rol dispersas en los componentes visuales.

### 3.4. Gestión de usuarios

Se implementará el módulo de usuarios en la ruta `/users`.

Las funcionalidades contempladas son:

- Consultar usuarios.
- Registrar usuarios.
- Visualizar información de usuarios.
- Editar usuarios.
- Desactivar usuarios (baja mediante cambio de estado, conforme al contrato del backend).
- Mostrar los estados de carga, error y resultados.

La comunicación se realizará mediante los endpoints definidos en los contratos del backend.

Las estructuras de datos, campos obligatorios, validaciones y permisos deberán corresponder a los contratos reales.

### 3.5. Gestión de ubicaciones

Se implementará el módulo de ubicaciones en la ruta `/locations`.

Las funcionalidades contempladas son:

- Consultar ubicaciones.
- Registrar ubicaciones.
- Editar ubicaciones.
- Consultar ubicaciones activas.
- Seleccionar la ubicación operativa.

La ubicación seleccionada se centralizará mediante Zustand para que pueda ser utilizada por los demás módulos de la aplicación.

La ubicación seleccionada se mantiene en memoria durante la sesión activa. Su persistencia local queda aplazada a la fase Offline-First posterior y no forma parte de la Fase 0.

### 3.6. Consulta de bitácora

Se implementará la consulta de registros de auditoría en la ruta `/audit-logs`.

El frontend consumirá los servicios disponibles en el backend para:

- Consultar registros de auditoría.
- Aplicar los filtros definidos en el contrato.
- Mostrar información de los registros.
- Gestionar estados de carga y errores.

La funcionalidad será de solo lectura y su acceso estará restringido según las reglas de autorización establecidas.

### 3.7. Manejo centralizado de errores

Se implementará un mecanismo común para gestionar los errores provenientes del backend y de la comunicación HTTP.

Se contemplarán principalmente:

- `400`: solicitud incorrecta.
- `401`: sesión no válida o expirada.
- `403`: acceso no autorizado.
- `404`: recurso no encontrado.
- `500`: error interno del servidor.
- Errores de conexión y ausencia de conectividad.

Los errores deberán transformarse en respuestas comprensibles para la interfaz, evitando que cada módulo implemente mecanismos independientes.

## 4. Estructura del proyecto

La organización del código seguirá una arquitectura modular por funcionalidades.

La estructura propuesta es:

```text
src/
├── modules/
│   └── foundation/
│       ├── auth/
│       │   ├── pages/
│       │   ├── components/
│       │   └── services/
│       ├── users/
│       │   ├── pages/
│       │   ├── components/
│       │   └── services/
│       ├── locations/
│       │   ├── pages/
│       │   ├── components/
│       │   └── services/
│       └── audit-logs/
│           ├── pages/
│           ├── components/
│           └── services/
├── components/
│   ├── guards/
│   ├── notifications/
│   └── feedback/
├── hooks/
├── services/
│   ├── api/
│   │   ├── axiosInstance.ts
│   │   └── interceptors/
│   ├── printer/
│   └── scanner/
├── stores/
│   ├── authStore.ts
│   └── locationStore.ts
├── router/
│   ├── index.tsx
│   ├── ProtectedRoute.tsx
│   └── RoleGuard.tsx
├── config/
├── assets/
├── App.tsx
└── main.tsx
```

Esta estructura podrá ajustarse si la organización existente del repositorio o la Constitución Técnica establecen convenciones diferentes.

## 5. Alcance de conectividad

**Decisión aprobada:** la Fase 0 funciona exclusivamente con conexión a Internet. La arquitectura Offline-First queda aplazada a una fase posterior.

En consecuencia, durante la Fase 0:

- Todas las operaciones requieren comunicación con el backend (Online-required).
- No se implementa persistencia offline de sesión, perfil, ubicaciones ni ubicación seleccionada.
- No se implementan colas de sincronización ni recuperación de operaciones pendientes.
- No se incorpora Dexie.js ni IndexedDB.
- Los directorios `database/` y `services/synchronization/` de la arquitectura de referencia no se crean en esta fase.

El comportamiento ante ausencia de conectividad se limita al manejo de errores de red: informar al usuario, no presentar operaciones como exitosas y permitir reintentar. Los principios Offline-First de la Constitución se aplicarán en la fase posterior dedicada, cuando se definan sus requisitos y arquitectura.

## 6. Integración con los contratos del backend

La comunicación entre frontend y backend se realizará exclusivamente mediante la API REST definida en los contratos compartidos.

Los servicios del frontend se organizarán de la siguiente manera:

| Servicio | Responsabilidad |
|---|---|
| AuthService | Autenticación y consulta del perfil |
| UserService | Operaciones de usuarios |
| LocationService | Operaciones de ubicaciones |
| AuditLogService | Consulta de bitácora |

Se utilizarán los contratos establecidos en `backend-api/specs/API_CONTRACTS.md` como referencia para la integración.

No se deberán inventar:

- Campos de solicitudes.
- Estructuras de respuesta.
- Parámetros de consulta.
- Códigos de estado adicionales.
- Reglas de autorización.
- Operaciones que no estén definidas en los contratos.

Si se detecta una incompatibilidad entre la especificación frontend y el contrato del backend, deberá documentarse y resolverse antes de implementar la integración afectada.

## 7. Consideraciones de seguridad

La implementación deberá cumplir las siguientes consideraciones:

- El token JWT se manejará conforme a la estrategia definida en la Constitución Técnica.
- Las solicitudes protegidas incluirán la autenticación correspondiente.
- Las rutas y acciones estarán protegidas según los permisos del usuario.
- El frontend no sustituirá las validaciones de seguridad del backend.
- Los datos sensibles no deberán exponerse innecesariamente en la interfaz.
- Los errores no deberán mostrar información interna del servidor.
- La sesión deberá invalidarse cuando corresponda.
- Los datos persistidos localmente deberán respetar las restricciones de almacenamiento establecidas.

## 8. Estrategia de pruebas

**Herramientas aprobadas:** Vitest como ejecutor y organizador de pruebas, y React Testing Library para pruebas de componentes y comportamiento de la interfaz.

**Justificación de dependencias (estrictamente necesarias):**

| Dependencia | Tipo | Justificación |
|---|---|---|
| `vitest` | dev | Ejecutor de pruebas nativo del ecosistema Vite; reutiliza la configuración existente del proyecto sin herramientas adicionales de build. |
| `@testing-library/react` | dev | Pruebas de componentes React centradas en el comportamiento visible del usuario; estándar de facto para React 19. |
| `@testing-library/jest-dom` | dev | Matchers de aserción legibles para el DOM (`toBeInTheDocument`, `toHaveTextContent`, etc.). |
| `jsdom` | dev | Entorno DOM simulado requerido por Vitest para ejecutar pruebas de componentes fuera del navegador. |
| `@testing-library/user-event` | dev | Simulación realista de interacciones de usuario (escritura, clics) en formularios y botones. |

No se incorporarán otras librerías de pruebas (mocks de servidor adicionales, herramientas E2E, etc.) sin justificación y aprobación previa.

**Alcance de las pruebas:**

| Tipo de prueba | Alcance |
|---|---|
| Pruebas unitarias | Stores (`authStore`, `locationStore`), servicios (`AuthService`, `UserService`, `LocationService`, `AuditLogService`) e interceptores de Axios |
| Pruebas de componentes | Formularios, listados, estados de carga/vacío/error, guards y notificaciones |
| Pruebas de flujos de autenticación | Login, restauración de sesión desde `sessionStorage`, expiración (`401`), cierre de sesión |
| Pruebas de autorización | Protección de rutas y visibilidad condicional según roles |
| Pruebas de errores | Respuestas HTTP (`400`, `401`, `403`, `404`, `500`) y errores de conectividad |

Las pruebas deberán comprobar tanto los escenarios correctos como los escenarios de error. Los servicios se probarán mockeando la capa HTTP (sin depender de un backend real); la verificación de integración con el backend real se realiza en la etapa de validación final.

## 9. Secuencia de implementación

La implementación se organizará siguiendo las dependencias técnicas entre los componentes.

### Etapa 1. Preparación de la infraestructura

- Revisar la estructura existente del proyecto.
- Verificar las dependencias instaladas.
- Revisar la configuración de Vite y TypeScript.
- Preparar la organización modular de la Fase 0.
- Configurar las variables de entorno necesarias.
- Configurar el entorno de pruebas: Vitest, React Testing Library, entorno DOM simulado y scripts de ejecución.

### Etapa 2. Comunicación con el backend

- Configurar la instancia centralizada de Axios.
- Configurar los encabezados de las solicitudes.
- Implementar los interceptores de solicitudes y respuestas.
- Centralizar el manejo de errores.
- Verificar la conexión con el backend.

### Etapa 3. Autenticación y gestión de sesiones

- Implementar la pantalla de inicio de sesión.
- Integrar el endpoint de autenticación.
- Integrar la consulta del perfil.
- Implementar el estado global de autenticación.
- Implementar el cierre de sesión.
- Gestionar las respuestas de sesión no válida.

### Etapa 4. Autorización y protección de rutas

- Implementar el mecanismo de protección de rutas.
- Implementar la autorización por roles.
- Configurar las rutas protegidas.
- Implementar la página de acceso denegado.
- Verificar los accesos según los roles.

### Etapa 5. Gestión de usuarios

- Implementar la vista de usuarios.
- Implementar la consulta de usuarios.
- Implementar el registro de usuarios.
- Implementar la edición de usuarios.
- Integrar las validaciones y estados de interfaz.

### Etapa 6. Gestión de ubicaciones

- Implementar la vista de ubicaciones.
- Implementar la consulta de ubicaciones.
- Implementar el registro y edición.
- Implementar la selección de ubicación operativa.
- Centralizar el contexto de ubicación mediante Zustand.

### Etapa 7. Ejecución de pruebas

- Implementar pruebas unitarias de servicios e interceptores HTTP.
- Implementar pruebas unitarias de stores (`authStore`, `locationStore`).
- Implementar pruebas de componentes (formularios, listados, estados de interfaz).
- Implementar pruebas de los flujos de autenticación (login, restauración de sesión, expiración, logout).
- Implementar pruebas de autorización (protección de rutas y visibilidad por roles).
- Ejecutar la suite de pruebas y corregir los fallos detectados.

Las pruebas del módulo de bitácora se implementarán junto con su etapa correspondiente (Etapa 8).

### Etapa 8. Consulta de bitácora

- Implementar la vista de auditoría.
- Integrar el servicio de consulta.
- Implementar los filtros definidos en el contrato.
- Aplicar las restricciones de acceso.
- Verificar el funcionamiento de solo lectura.

### Etapa 9. Validación e integración final

- Ejecutar la suite completa de pruebas (unitarias, de componentes y de flujos).
- Verificar la integración con los endpoints reales del backend.
- Verificar los flujos de autenticación y autorización.
- Verificar el comportamiento ante errores de conectividad.
- Corregir errores encontrados.
- Verificar la compilación de TypeScript.
- Validar que la implementación respete la Constitución Técnica.

## 10. Resultado esperado

Al finalizar la Fase 0, el repositorio `frontend-web` deberá contar con una infraestructura transversal que proporcione:

1. Autenticación centralizada mediante JWT.
2. Gestión global de sesiones.
3. Protección de rutas y autorización por roles.
4. Gestión de usuarios.
5. Gestión de ubicaciones.
6. Selección de ubicación operativa.
7. Consulta de bitácora.
8. Comunicación centralizada con el backend.
9. Manejo común de errores.
10. Suite de pruebas con Vitest y React Testing Library para los componentes transversales.

Esta infraestructura deberá quedar preparada para ser reutilizada por los módulos funcionales M1–M8, evitando duplicación de lógica y manteniendo una arquitectura consistente.

## 11. Restricciones y decisiones

La implementación deberá respetar las decisiones ya establecidas en la Constitución Técnica y los contratos del backend.

**Decisiones aprobadas y documentadas:**

- **Almacenamiento del JWT:** `sessionStorage` (Constitución, sección 8.1). Sin `localStorage`, cookies, refresh tokens ni control de inactividad.
- **Offline-First:** aplazado a una fase posterior. La Fase 0 opera exclusivamente en línea, sin Dexie.js ni persistencia local.
- **Testing:** Vitest + React Testing Library, con las dependencias auxiliares justificadas en la sección 8.
- **Multiplicidad de roles:** rol único por usuario (`ADMIN`, `VENDEDOR`, `TECNICO`), definido en el contrato.
- **DTO y errores:** estructuras definidas en `API_CONTRACTS.md`; el campo `message` del error puede ser string o arreglo de strings.

**Pendientes de verificación posterior (no bloquean el frontend):**

- La configuración de expiración del JWT en una hora debe verificarse y ajustarse en el repositorio `backend-api`, sin modificar el contrato actual.
- La vinculación entre usuarios y ubicaciones no está definida en el contrato; el selector de ubicación operativa mostrará las ubicaciones activas disponibles hasta que el negocio defina restricciones de asignación.

Las decisiones que no estén resueltas en dichos documentos deberán identificarse antes de implementar los componentes afectados y no deberán resolverse mediante suposiciones dentro de la implementación.

## 12. Criterios de finalización

La Fase 0 se considerará completada cuando:

- Todos los requisitos funcionales de `spec.md` estén implementados.
- La autenticación funcione correctamente con el backend.
- La gestión de sesiones funcione de manera centralizada.
- Las rutas y acciones respeten los permisos establecidos.
- Las funcionalidades de usuarios y ubicaciones estén integradas.
- La consulta de bitácora funcione según su contrato.
- El manejo de errores esté centralizado.
- La aplicación funcione exclusivamente con conexión, conforme al alcance online-only aprobado (Offline-First aplazado).
- Las pruebas definidas con Vitest y React Testing Library hayan sido ejecutadas satisfactoriamente.
- La compilación del proyecto no presente errores.
- La implementación cumpla la Constitución Técnica.

**Fin del plan de implementación de la Fase 0.**    