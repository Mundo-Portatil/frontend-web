# Tareas de Implementación — Fase 0: Cimientos Transversales

## Registro de decisiones aprobadas

Las siguientes decisiones fueron aprobadas antes de iniciar la implementación y son de cumplimiento obligatorio:

| ID | Decisión | Implicación en las tareas |
|---|---|---|
| OD-009 | JWT Bearer almacenado en `sessionStorage`. Sin `localStorage`, cookies, refresh tokens ni control de inactividad. La expiración deseada (1 hora) debe verificarse y ajustarse posteriormente en el backend, sin modificar el contrato. | T0.2.2, T0.3.2, T0.3.5, T0.3.6, T0.10.2 |
| OD-008 | Arquitectura Offline-First aplazada a una fase posterior. La Fase 0 opera exclusivamente en línea: sin Dexie.js, IndexedDB, caché local ni sincronización. | Fase 0.7 reemplazada por tareas de pruebas; T0.10.5 ajustada |
| Testing | Vitest + React Testing Library como herramientas oficiales de pruebas, con dependencias auxiliares justificadas en `plan.md`. | T0.1.5, Fase 0.7, T0.8.6, T0.10.6 |
| GitFlow | Los documentos SDD se validan e incorporan a `develop`; la implementación de la Fase 0 se realiza en `feature/phase-0-foundation` creada desde `develop` actualizado. | Procedimiento previo a la Fase 0.1 |

---

## Fase 0.1: Preparación del Proyecto y Configuración Base

- [x] **T0.1.1: Verificación de la estructura actual del proyecto**
  - Revisar la estructura existente de `frontend-web`.
  - Verificar la configuración actual de React, Vite y TypeScript.
  - Identificar componentes, servicios, stores y configuraciones existentes que deban reutilizarse.
  - No eliminar ni modificar funcionalidades existentes sin justificación.

- [x] **T0.1.2: Verificación de dependencias**
  - Verificar que las dependencias requeridas por la Constitución estén instaladas.
  - Confirmar React, Vite, TypeScript, Tailwind CSS, React Router, Zustand y Axios.
  - Instalar las dependencias de pruebas aprobadas (Vitest, React Testing Library y auxiliares, según T0.1.5).
  - Instalar únicamente las dependencias necesarias que no estén presentes.
  - No agregar librerías adicionales sin justificación técnica.
  - No instalar Dexie.js ni `vite-plugin-pwa` en la Fase 0 (aplazados por decisión aprobada).

- [x] **T0.1.3: Configuración de variables de entorno**
  - Configurar la URL base de la API mediante variables de entorno.
  - Verificar que las variables utilizadas por el frontend sean compatibles con Vite.
  - Evitar colocar secretos o credenciales sensibles en variables expuestas al frontend.

- [x] **T0.1.4: Organización inicial de la estructura**
  - Crear o adaptar la estructura de carpetas definida en `plan.md`.
  - Mantener separación entre módulos, servicios, stores, router y persistencia.
  - Respetar las convenciones existentes del repositorio cuando no entren en conflicto con la Constitución.
  - No crear los directorios `database/` ni `services/synchronization/` (aplazados a la fase Offline-First).

- [x] **T0.1.5: Configuración del entorno de pruebas**
  - Instalar y configurar Vitest como ejecutor de pruebas.
  - Instalar y configurar React Testing Library para pruebas de componentes.
  - Instalar las dependencias auxiliares estrictamente necesarias: `jsdom`, `@testing-library/jest-dom` y `@testing-library/user-event` (justificación en `plan.md`, sección 8).
  - Configurar los scripts de ejecución de pruebas en `package.json` (ejecución única y modo watch).
  - Verificar la compatibilidad con las versiones actuales de React, Vite y TypeScript.
  - No instalar librerías de pruebas adicionales sin justificación y aprobación.

---

## Fase 0.2: Infraestructura HTTP y Comunicación con Backend

- [x] **T0.2.1: Implementación de la instancia centralizada de Axios**
  - Crear `src/services/api/axiosInstance.ts`.
  - Configurar la URL base del backend.
  - Configurar los encabezados comunes requeridos.
  - Centralizar la configuración HTTP para evitar múltiples instancias independientes.

- [x] **T0.2.2: Implementación del interceptor de autenticación**
  - Implementar el interceptor de solicitudes.
  - Obtener el token desde `sessionStorage`, conforme a la estrategia aprobada (Constitución, sección 8.1).
  - Adjuntar `Authorization: Bearer <token>` a las solicitudes protegidas.
  - Evitar enviar tokens cuando la solicitud no los requiera (por ejemplo, `POST /auth/login`).

- [x] **T0.2.3: Implementación del interceptor de respuestas**
  - Centralizar el tratamiento de respuestas HTTP.
  - Gestionar específicamente respuestas `401`.
  - Gestionar respuestas `403`.
  - Diferenciar errores de red de errores provenientes del backend.
  - Evitar duplicar la misma lógica en cada servicio.

- [x] **T0.2.4: Implementación del manejo común de errores**
  - Crear mecanismos reutilizables para transformar errores HTTP en estados utilizables por la interfaz.
  - Mantener mensajes comprensibles para el usuario.
  - No exponer información interna o sensible del backend.

- [x] **T0.2.5: Verificación de integración HTTP**
  - Verificar que una solicitud autenticada incluya correctamente el JWT.
  - Verificar el comportamiento ante `401`.
  - Verificar el comportamiento ante `403`.
  - Verificar el comportamiento ante pérdida de conexión.

---

## Fase 0.3: Autenticación y Gestión de Sesión

- [x] **T0.3.1: Implementación del modelo de sesión**
  - Definir las estructuras TypeScript necesarias para representar la sesión y el usuario autenticado.
  - Utilizar únicamente los campos establecidos por los contratos del backend.
  - Evitar duplicar modelos incompatibles con los DTO reales.

- [x] **T0.3.2: Implementación de `authStore`**
  - Crear `src/stores/authStore.ts`.
  - Centralizar el estado del usuario autenticado.
  - Centralizar el estado de autenticación.
  - Implementar las operaciones necesarias para establecer y limpiar la sesión, incluyendo el almacenamiento y la eliminación del JWT en `sessionStorage`.
  - Mantener la lógica de estado separada de los componentes React.

- [x] **T0.3.3: Implementación de `AuthService`**
  - Crear el servicio de autenticación.
  - Integrar `POST /auth/login`.
  - Integrar `GET /auth/profile`.
  - Utilizar la instancia centralizada de Axios.
  - Adaptar las respuestas conforme al contrato real del backend.

- [x] **T0.3.4: Implementación de la pantalla `/login`**
  - Crear `LoginPage.tsx`.
  - Implementar formulario de autenticación.
  - Implementar validación de datos de entrada.
  - Mostrar estado de carga.
  - Mostrar errores de autenticación.
  - Redirigir al usuario autenticado según el flujo definido.

- [x] **T0.3.5: Implementación del flujo de cierre de sesión**
  - Limpiar el estado global de autenticación.
  - Eliminar el JWT de `sessionStorage`.
  - Restablecer el contexto de ubicación cuando sea necesario.
  - Redirigir al usuario a `/login`.

- [x] **T0.3.6: Manejo de sesión expirada**
  - Detectar respuestas `401` en solicitudes protegidas (sin activar el flujo cuando el `401` provenga del propio intento de login).
  - Invalidar la sesión local y eliminar el JWT de `sessionStorage`.
  - Evitar que el usuario continúe utilizando rutas protegidas con una sesión inválida.
  - Redirigir al flujo de autenticación correspondiente sin provocar ciclos de redirección.

---

## Fase 0.4: Autorización y Protección de Rutas

- [x] **T0.4.1: Configuración del router**
  - Crear o adaptar `src/router/index.tsx`.
  - Registrar las rutas de la Fase 0.
  - Mantener separadas las rutas públicas y protegidas.

- [x] **T0.4.2: Implementación de `ProtectedRoute`**
  - Crear el componente encargado de proteger rutas que requieren autenticación.
  - Verificar el estado de sesión antes de permitir el acceso.
  - Redirigir usuarios no autenticados a `/login`.

- [x] **T0.4.3: Implementación de `RoleGuard`**
  - Crear el componente para restringir funcionalidades según los roles.
  - Implementar soporte para `ADMIN`, `VENDEDOR` y `TECNICO`.
  - No inventar permisos adicionales que no estén definidos en los contratos o especificaciones.

- [x] **T0.4.4: Implementación de `/unauthorized`**
  - Crear la pantalla de acceso no autorizado.
  - Mostrar un mensaje claro al usuario.
  - Proporcionar una navegación válida de retorno.

- [x] **T0.4.5: Control de acciones en la interfaz**
  - Implementar el mecanismo único y reutilizable de visibilidad condicional en `src/components/guards/`, consumiendo los roles del contexto autenticado.
  - Ocultar o deshabilitar acciones que el usuario no tenga permitido ejecutar mediante dicho mecanismo.
  - Evitar comprobaciones de rol dispersas o ad-hoc dentro de los componentes visuales.
  - Mantener la autorización del backend como mecanismo definitivo de seguridad.

---

## Fase 0.5: Gestión de Usuarios

- [x] **T0.5.1: Implementación de `UserService`**
  - Crear el servicio correspondiente al módulo de usuarios.
  - Integrar los endpoints definidos en el contrato del backend.
  - Mantener los métodos y estructuras alineados con `API_CONTRACTS.md`.

- [x] **T0.5.2: Implementación de la página `/users`**
  - Crear `UsersPage.tsx`.
  - Implementar listado de usuarios.
  - Implementar estado de carga.
  - Implementar estado vacío.
  - Implementar estado de error.
  - Implementar acciones permitidas según autorización.

- [x] **T0.5.3: Implementación del formulario de creación**
  - Crear el formulario correspondiente.
  - Implementar validaciones frontend.
  - Integrar la operación de creación definida por el backend.
  - Mostrar estados de procesamiento y resultado.

- [x] **T0.5.4: Implementación del formulario de edición**
  - Implementar edición de usuarios.
  - Implementar la desactivación (baja) de usuarios mediante cambio de estado (`active: false`).
  - Integrar la operación correspondiente del backend.
  - Validar los datos antes de enviarlos.
  - Actualizar la interfaz después de una operación exitosa.

- [x] **T0.5.5: Implementación de estados de usuario**
  - Representar correctamente los estados definidos por el contrato.
  - Evitar exponer información sensible.
  - Mantener consistencia entre los datos mostrados y los datos recibidos del backend.

- [x] **T0.5.6: Validación del módulo de usuarios**
  - Verificar consulta.
  - Verificar creación.
  - Verificar edición.
  - Verificar desactivación (baja).
  - Verificar autorización.
  - Verificar errores del backend.
  - Verificar estados de carga y vacío.

---

## Fase 0.6: Gestión de Ubicaciones

- [x] **T0.6.1: Implementación de `LocationService`**
  - Crear el servicio correspondiente al módulo de ubicaciones.
  - Integrar los endpoints definidos en el contrato.
  - Implementar consulta de ubicaciones.
  - Implementar consulta de ubicaciones activas.
  - Implementar creación y edición según los métodos definidos en el contrato.

- [x] **T0.6.2: Implementación de la página `/locations`**
  - Crear `LocationsPage.tsx`.
  - Implementar listado de ubicaciones.
  - Implementar estado de carga.
  - Implementar estado vacío.
  - Implementar estado de error.

- [x] **T0.6.3: Implementación del formulario de creación de ubicaciones**
  - Crear formulario de creación.
  - Implementar validaciones frontend.
  - Integrar la operación correspondiente con el backend.
  - Mostrar resultado de la operación.

- [x] **T0.6.4: Implementación del formulario de edición de ubicaciones**
  - Crear formulario de edición.
  - Integrar la operación correspondiente con el backend.
  - Actualizar la información mostrada después de una modificación exitosa.

- [x] **T0.6.5: Implementación de `locationStore`**
  - Crear `src/stores/locationStore.ts`.
  - Centralizar la ubicación operativa seleccionada.
  - Implementar selección y actualización de ubicación.
  - Mantener la selección en memoria durante la sesión activa, sin mecanismos de persistencia local (aplazados a la fase Offline-First).
  - Permitir que otros módulos consuman el contexto de ubicación.

- [x] **T0.6.6: Implementación del selector de ubicación operativa**
  - Crear el componente reutilizable de selección.
  - Mostrar las ubicaciones disponibles según el contexto de la aplicación.
  - Mantener sincronizado el valor seleccionado con `locationStore`.

- [x] **T0.6.7: Validación del módulo de ubicaciones**
  - Verificar consulta.
  - Verificar consulta de ubicaciones activas.
  - Verificar creación.
  - Verificar edición.
  - Verificar selección de ubicación.
  - Verificar autorización.

---

## Fase 0.7: Pruebas Unitarias y de Componentes

> La fase original de Persistencia Local y Offline-First fue retirada del alcance por decisión aprobada (OD-008): la Fase 0 opera exclusivamente en línea. Esta fase se destina a la verificación mediante pruebas, utilizando el entorno configurado en T0.1.5.

- [x] **T0.7.1: Pruebas unitarias de servicios e interceptores**
  - Probar `AuthService` (login y perfil) con la capa HTTP mockeada.
  - Probar `UserService`, `LocationService` y `AuditLogService` con la capa HTTP mockeada.
  - Probar el interceptor de solicitudes: inclusión del Bearer desde `sessionStorage` y omisión en rutas públicas.
  - Probar el interceptor de respuestas: tratamiento de `401`, `403`, errores de red y estructura de error del backend (`message` como string o arreglo).
  - Comprobar tanto escenarios correctos como de error.

- [x] **T0.7.2: Pruebas unitarias de stores**
  - Probar `authStore`: establecimiento de sesión, limpieza, restauración desde `sessionStorage` y expiración.
  - Probar `locationStore`: selección, actualización y consumo del contexto por otros módulos.

- [x] **T0.7.3: Pruebas de componentes**
  - Probar formularios de login, usuarios y ubicaciones: validación, envío y mensajes de error.
  - Probar listados: estados de carga, vacío y error.
  - Probar los guards de ruta y el mecanismo de visibilidad condicional según roles.
  - Probar los componentes de notificación.

- [x] **T0.7.4: Pruebas de los flujos de autenticación**
  - Probar el flujo completo de login con credenciales válidas e inválidas.
  - Probar la restauración de sesión al recargar la página (JWT en `sessionStorage` + `GET /auth/profile`).
  - Probar la expiración de sesión: `401` en solicitud protegida, limpieza del token y redirección a `/login` sin ciclos.
  - Probar el cierre de sesión: eliminación del JWT y del estado global.

- [x] **T0.7.5: Validación de los resultados de pruebas**
  - Ejecutar la suite completa de pruebas.
  - Corregir los fallos detectados.
  - Confirmar que las pruebas cubren los escenarios correctos y de error de cada módulo implementado hasta esta fase.

---

## Fase 0.8: Consulta de Bitácora

- [x] **T0.8.1: Implementación de `AuditLogService`**
  - Crear el servicio de consulta de bitácora.
  - Integrar `GET /audit-logs` según el contrato real.
  - Implementar los parámetros de consulta definidos por el backend.

- [x] **T0.8.2: Implementación de la página `/audit-logs`**
  - Crear `AuditLogsPage.tsx`.
  - Implementar listado de registros.
  - Implementar estado de carga.
  - Implementar estado vacío.
  - Implementar estado de error.

- [x] **T0.8.3: Implementación de filtros**
  - Implementar únicamente los filtros definidos por el contrato.
  - Validar los parámetros antes de enviarlos.
  - Mantener los filtros sincronizados con la consulta.

- [x] **T0.8.4: Aplicación de autorización**
  - Proteger la ruta de bitácora.
  - Aplicar las restricciones de acceso definidas.
  - Evitar mostrar acciones de modificación cuando la funcionalidad es de solo lectura.

- [x] **T0.8.5: Validación de la consulta de bitácora**
  - Verificar consulta correcta.
  - Verificar filtros.
  - Verificar respuesta vacía.
  - Verificar errores.
  - Verificar acceso no autorizado.

- [x] **T0.8.6: Pruebas del módulo de bitácora**
  - Probar `AuditLogService` con la capa HTTP mockeada: parámetros de consulta, paginación y filtros.
  - Probar la página de bitácora: estados de carga, vacío, error y solo lectura.
  - Probar la autorización de la ruta.

---

## Fase 0.9: Estados y Experiencia de Interfaz

- [x] **T0.9.1: Implementación de estados de carga**
  - Crear componentes reutilizables para representar operaciones en proceso.
  - Aplicarlos en login, usuarios, ubicaciones y bitácora.

- [x] **T0.9.2: Implementación de estados vacíos**
  - Crear estados reutilizables para listas sin información.
  - Mostrar mensajes claros al usuario.

- [x] **T0.9.3: Implementación de estados de error**
  - Crear componentes reutilizables para errores.
  - Diferenciar errores de red, servidor y autorización cuando corresponda.

- [x] **T0.9.4: Implementación de estados de éxito**
  - Mostrar confirmaciones después de operaciones exitosas.
  - Evitar mensajes duplicados o innecesarios.

- [x] **T0.9.5: Consistencia visual**
  - Aplicar Tailwind CSS siguiendo las convenciones del proyecto.
  - Mantener componentes y estados visuales consistentes entre los módulos de la Fase 0.

- [x] **T0.9.6: Implementación de componentes de notificación (FR-051)**
  - Crear `src/components/notifications/` con componentes reutilizables para notificaciones de éxito, advertencia y error.
  - Integrar las notificaciones con el manejo centralizado de errores de Axios.
  - Aplicarlas en login, usuarios, ubicaciones y bitácora.
  - Evitar duplicar mecanismos de notificación entre módulos.

---

## Fase 0.10: Integración Global y Validación

- [x] **T0.10.1: Integración del router**
  - Verificar todas las rutas de la Fase 0:
    - `/login`
    - `/users`
    - `/locations`
    - `/audit-logs`
    - `/unauthorized`
  - Verificar rutas protegidas y públicas.

- [x] **T0.10.2: Verificación del flujo completo de autenticación**
  - Login.
  - Obtención del perfil.
  - Persistencia de sesión.
  - Navegación a rutas protegidas.
  - Expiración de sesión.
  - Logout.

- [x] **T0.10.3: Verificación del flujo de autorización**
  - Probar acceso con `ADMIN`.
  - Probar acceso con `VENDEDOR`.
  - Probar acceso con `TECNICO`.
  - Verificar que las restricciones coincidan con la especificación y contratos.

- [ ] **T0.10.4: Verificación de integración con backend**
  - Validar todos los endpoints utilizados.
  - Verificar métodos HTTP.
  - Verificar parámetros.
  - Verificar payloads.
  - Verificar respuestas.
  - Verificar códigos de error.
  - **Verificación estática:** completada contra `origin/develop` (controladores, DTOs, guards, casos de uso y `API_CONTRACTS.md`). Sin discrepancias en rutas, métodos, autenticación, parámetros, payloads, roles ni códigos de error.
  - **Bloqueo en vivo:** el checkout de `backend-api` está en `main` (sin los módulos de la Fase 0), no dispone de `.env` ni de `node_modules`; no hay PostgreSQL local ni daemon de Docker operativo, y no existen credenciales de Supabase. `http://localhost:3000` no responde. No se modificó el backend.

- [x] **T0.10.5: Verificación de conectividad y manejo de errores de red**
  - Verificar que las operaciones que requieren el backend no se presenten como exitosas sin conectividad.
  - Verificar los mensajes de error ante ausencia de comunicación con el servidor.
  - Verificar que no existan mecanismos de caché local ni persistencia offline (fuera de alcance por decisión aprobada).

- [x] **T0.10.6: Verificación de TypeScript**
  - Ejecutar la compilación TypeScript.
  - Corregir errores de tipos.
  - Verificar que no existan errores de compilación.

- [x] **T0.10.7: Ejecución de la suite completa de pruebas**
  - Ejecutar todas las pruebas unitarias y de componentes con Vitest.
  - Confirmar que todas las pruebas superan correctamente.
  - Corregir los fallos detectados antes de continuar.

- [x] **T0.10.8: Verificación de calidad del código**
  - Revisar separación de responsabilidades.
  - Revisar duplicación de código.
  - Revisar imports innecesarios.
  - Revisar consistencia de nombres.
  - Verificar cumplimiento de las convenciones de la Constitución.

- [x] **T0.10.9: Validación final de la Fase 0**
  - Verificar todos los criterios de aceptación definidos en `spec.md`.
  - Confirmar que las tareas completadas correspondan al alcance de la Fase 0.
  - Confirmar que no se hayan implementado funcionalidades pertenecientes a M1–M8.
  - Confirmar que el frontend quede preparado para las siguientes fases.

---

## Fase 0.11: Criterios de Finalización

- [x] **T0.11.1: Cumplimiento de la Constitución**
  - Verificar que la implementación respete las reglas y restricciones establecidas en `constitution.md`.

- [x] **T0.11.2: Cumplimiento de la especificación**
  - Verificar que todos los requisitos funcionales de `spec.md` estén implementados.

- [x] **T0.11.3: Cumplimiento del plan técnico**
  - Verificar que la implementación siga la arquitectura y estrategia definidas en `plan.md`.

- [x] **T0.11.4: Compilación final**
  - Ejecutar el proceso de compilación del proyecto.
  - Confirmar que finalice sin errores.

- [ ] **T0.11.5: Validación de integración**
  - Confirmar que el frontend pueda comunicarse correctamente con el backend.
  - Confirmar que los contratos utilizados correspondan a la versión disponible del backend.
  - **Verificación estática:** contratos y código de `origin/develop` revisados; los servicios y tipos del frontend coinciden con los DTO y controladores publicados.
  - **Hallazgo registrado:** el `JwtModule` del backend usa `JWT_EXPIRES_IN || '1d'`; la expiración deseada de una hora requiere configuración en `backend-api`. No bloquea al frontend, que gestiona la expiración mediante respuestas `401`.
  - **Bloqueo en vivo:** no es posible levantar el backend con las condiciones actuales del entorno (ver T0.10.4). No se simularon respuestas ni se marcó la tarea como completada.

- [ ] **T0.11.6: Revisión final**
  - Confirmar que no existan tareas pendientes dentro del alcance de la Fase 0.
  - Confirmar que la infraestructura transversal esté lista para ser reutilizada por M1–M8.
  - **Estado:** pendiente de cerrar T0.10.4 y T0.11.5 por el bloqueo externo. Suite de pruebas, TypeScript, ESLint, build y revisión de alcance completados sin errores.

---

## Dependencias de implementación

La ejecución deberá respetar el siguiente orden general:

```text
T0.1 Preparación (incluye entorno de pruebas)
      │
      ▼
T0.2 Infraestructura HTTP
      │
      ▼
T0.3 Autenticación y sesión
      │
      ▼
T0.4 Autorización y rutas
      │
      ├───────────────┐
      ▼               ▼
T0.5 Usuarios     T0.6 Ubicaciones
      │               │
      └───────┬───────┘
              ▼
T0.7 Pruebas (servicios, stores, componentes, auth)
              │
              ▼
T0.8 Bitácora (incluye sus pruebas)
              │
              ▼
T0.9 Estados de interfaz
              │
              ▼
T0.10 Integración y validación (suite completa)
              │
              ▼
T0.11 Finalización
```

Notas sobre dependencias:

- T0.1.5 (entorno de pruebas) debe completarse antes de la primera ejecución de pruebas en T0.7.
- T0.2.2 y T0.3 dependen de la estrategia de almacenamiento del JWT aprobada (OD-009, `sessionStorage`).
- La Fase 0.7 requiere los módulos T0.2–T0.6 completados; las pruebas de bitácora se realizan en T0.8.6.
- No existen tareas de persistencia local ni sincronización: la arquitectura Offline-First fue aplazada por decisión aprobada (OD-008).

## Registro de validación

Validaciones ejecutadas el 2026-11-17:

- `npm test`: 16 archivos de prueba, 88 pruebas superadas.
- `npx tsc -b`: compilación TypeScript sin errores.
- `npm run lint`: ESLint sin errores.
- `npm run build`: compilación de producción correcta.
- `npm run preview` + `GET /`: respuesta HTTP 200 con el HTML de la aplicación.
- Verificación estática de los endpoints del frontend contra los controladores, DTOs, guards y casos de uso de `backend-api` en `origin/develop`, además de `specs/API_CONTRACTS.md`: sin discrepancias de contrato.
- Hallazgo en backend: la expiración por defecto del JWT es `1d` (`JWT_EXPIRES_IN || '1d'`), no una hora. Corresponde ajustarlo en `backend-api`; el frontend no requiere cambios porque maneja `401`.
- Verificación en vivo no ejecutada por bloqueo externo: el checkout de `backend-api` está en `main` sin los módulos de Fase 0, no tiene `.env` ni `node_modules`, no hay PostgreSQL local ni daemon de Docker operativo, no hay credenciales de Supabase y `http://localhost:3000` no responde.
- No se simularon respuestas reales ni se modificó el repositorio backend.

## Ampliación autorizada — Mi perfil (FR-052–FR-055)

- [x] **T0.12.1: Servicio de perfil propio**
  - Integrar `PATCH /users/me` con lista explícita `name`, `email`, `password`, sin identificador ni cambios de privilegios.
  - Verificar contrato y autorización del backend sobre la identidad JWT para los tres roles.
- [x] **T0.12.2: Interfaz y sesión**
  - Añadir acceso «Mi perfil» desde el área del usuario en el header y ruta autenticada `/profile` para los tres roles.
  - Editar nombre, correo y contraseña opcional con validación y feedback existentes.
  - Actualizar el contexto autenticado/header con la respuesta confirmada y limpiar la contraseña tras guardar.
- [x] **T0.12.3: Verificación automatizada**
  - Cubrir formulario, servicio, acceso de los tres roles, sincronización de sesión y ausencia de ID/rol/estado en el payload.
  - Ejecutar pruebas, TypeScript, ESLint y build; registrar los resultados.
- [ ] **T0.12.4: Verificación contra backend real**
  - Confirmar persistencia tras recargar y autenticación con la contraseña nueva, con cuentas de los tres roles.
  - Requiere backend operativo y cuentas de prueba; no considerar completada con mocks.

### Resultado de la ampliación Mi perfil

- `npm test`: 21 archivos, 169 pruebas superadas. Incluye los tres roles, allowlist del payload, errores, acceso desde header/ruta y descarte de respuestas anteriores al guardado o cambio de cuenta.
- `npm run lint`: sin errores.
- `npm run build`: TypeScript y producción correctos.
- Revisión estática de contrato, controller, RolesGuard y JwtStrategy de backend `origin/develop`: la identidad se deriva del JWT y los tres roles pueden actualizar su propio perfil.
- T0.12.4 sigue pendiente: `http://localhost:3000/api` no responde; no se verificaron persistencia ni credenciales nuevas contra servidor real.

## Regla de ejecución

La IA deberá ejecutar las tareas respetando `constitution.md`, `spec.md` y `plan.md` como fuentes de verdad.

Antes de implementar una tarea que dependa de un contrato del backend, deberá verificarse el contrato disponible en `backend-api/specs/API_CONTRACTS.md`.

Si existe una contradicción entre documentos, un endpoint no coincide, falta información necesaria o una decisión técnica no está definida, la IA deberá detener la implementación de esa parte y reportar la inconsistencia en lugar de inventar una solución.

Las tareas deberán marcarse como `[x]` únicamente después de haber sido implementadas y verificadas correctamente.
