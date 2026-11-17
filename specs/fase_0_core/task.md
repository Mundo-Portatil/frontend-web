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

- [ ] **T0.1.1: Verificación de la estructura actual del proyecto**
  - Revisar la estructura existente de `frontend-web`.
  - Verificar la configuración actual de React, Vite y TypeScript.
  - Identificar componentes, servicios, stores y configuraciones existentes que deban reutilizarse.
  - No eliminar ni modificar funcionalidades existentes sin justificación.

- [ ] **T0.1.2: Verificación de dependencias**
  - Verificar que las dependencias requeridas por la Constitución estén instaladas.
  - Confirmar React, Vite, TypeScript, Tailwind CSS, React Router, Zustand y Axios.
  - Instalar las dependencias de pruebas aprobadas (Vitest, React Testing Library y auxiliares, según T0.1.5).
  - Instalar únicamente las dependencias necesarias que no estén presentes.
  - No agregar librerías adicionales sin justificación técnica.
  - No instalar Dexie.js ni `vite-plugin-pwa` en la Fase 0 (aplazados por decisión aprobada).

- [ ] **T0.1.3: Configuración de variables de entorno**
  - Configurar la URL base de la API mediante variables de entorno.
  - Verificar que las variables utilizadas por el frontend sean compatibles con Vite.
  - Evitar colocar secretos o credenciales sensibles en variables expuestas al frontend.

- [ ] **T0.1.4: Organización inicial de la estructura**
  - Crear o adaptar la estructura de carpetas definida en `plan.md`.
  - Mantener separación entre módulos, servicios, stores, router y persistencia.
  - Respetar las convenciones existentes del repositorio cuando no entren en conflicto con la Constitución.
  - No crear los directorios `database/` ni `services/synchronization/` (aplazados a la fase Offline-First).

- [ ] **T0.1.5: Configuración del entorno de pruebas**
  - Instalar y configurar Vitest como ejecutor de pruebas.
  - Instalar y configurar React Testing Library para pruebas de componentes.
  - Instalar las dependencias auxiliares estrictamente necesarias: `jsdom`, `@testing-library/jest-dom` y `@testing-library/user-event` (justificación en `plan.md`, sección 8).
  - Configurar los scripts de ejecución de pruebas en `package.json` (ejecución única y modo watch).
  - Verificar la compatibilidad con las versiones actuales de React, Vite y TypeScript.
  - No instalar librerías de pruebas adicionales sin justificación y aprobación.

---

## Fase 0.2: Infraestructura HTTP y Comunicación con Backend

- [ ] **T0.2.1: Implementación de la instancia centralizada de Axios**
  - Crear `src/services/api/axiosInstance.ts`.
  - Configurar la URL base del backend.
  - Configurar los encabezados comunes requeridos.
  - Centralizar la configuración HTTP para evitar múltiples instancias independientes.

- [ ] **T0.2.2: Implementación del interceptor de autenticación**
  - Implementar el interceptor de solicitudes.
  - Obtener el token desde `sessionStorage`, conforme a la estrategia aprobada (Constitución, sección 8.1).
  - Adjuntar `Authorization: Bearer <token>` a las solicitudes protegidas.
  - Evitar enviar tokens cuando la solicitud no los requiera (por ejemplo, `POST /auth/login`).

- [ ] **T0.2.3: Implementación del interceptor de respuestas**
  - Centralizar el tratamiento de respuestas HTTP.
  - Gestionar específicamente respuestas `401`.
  - Gestionar respuestas `403`.
  - Diferenciar errores de red de errores provenientes del backend.
  - Evitar duplicar la misma lógica en cada servicio.

- [ ] **T0.2.4: Implementación del manejo común de errores**
  - Crear mecanismos reutilizables para transformar errores HTTP en estados utilizables por la interfaz.
  - Mantener mensajes comprensibles para el usuario.
  - No exponer información interna o sensible del backend.

- [ ] **T0.2.5: Verificación de integración HTTP**
  - Verificar que una solicitud autenticada incluya correctamente el JWT.
  - Verificar el comportamiento ante `401`.
  - Verificar el comportamiento ante `403`.
  - Verificar el comportamiento ante pérdida de conexión.

---

## Fase 0.3: Autenticación y Gestión de Sesión

- [ ] **T0.3.1: Implementación del modelo de sesión**
  - Definir las estructuras TypeScript necesarias para representar la sesión y el usuario autenticado.
  - Utilizar únicamente los campos establecidos por los contratos del backend.
  - Evitar duplicar modelos incompatibles con los DTO reales.

- [ ] **T0.3.2: Implementación de `authStore`**
  - Crear `src/stores/authStore.ts`.
  - Centralizar el estado del usuario autenticado.
  - Centralizar el estado de autenticación.
  - Implementar las operaciones necesarias para establecer y limpiar la sesión, incluyendo el almacenamiento y la eliminación del JWT en `sessionStorage`.
  - Mantener la lógica de estado separada de los componentes React.

- [ ] **T0.3.3: Implementación de `AuthService`**
  - Crear el servicio de autenticación.
  - Integrar `POST /auth/login`.
  - Integrar `GET /auth/profile`.
  - Utilizar la instancia centralizada de Axios.
  - Adaptar las respuestas conforme al contrato real del backend.

- [ ] **T0.3.4: Implementación de la pantalla `/login`**
  - Crear `LoginPage.tsx`.
  - Implementar formulario de autenticación.
  - Implementar validación de datos de entrada.
  - Mostrar estado de carga.
  - Mostrar errores de autenticación.
  - Redirigir al usuario autenticado según el flujo definido.

- [ ] **T0.3.5: Implementación del flujo de cierre de sesión**
  - Limpiar el estado global de autenticación.
  - Eliminar el JWT de `sessionStorage`.
  - Restablecer el contexto de ubicación cuando sea necesario.
  - Redirigir al usuario a `/login`.

- [ ] **T0.3.6: Manejo de sesión expirada**
  - Detectar respuestas `401` en solicitudes protegidas (sin activar el flujo cuando el `401` provenga del propio intento de login).
  - Invalidar la sesión local y eliminar el JWT de `sessionStorage`.
  - Evitar que el usuario continúe utilizando rutas protegidas con una sesión inválida.
  - Redirigir al flujo de autenticación correspondiente sin provocar ciclos de redirección.

---

## Fase 0.4: Autorización y Protección de Rutas

- [ ] **T0.4.1: Configuración del router**
  - Crear o adaptar `src/router/index.tsx`.
  - Registrar las rutas de la Fase 0.
  - Mantener separadas las rutas públicas y protegidas.

- [ ] **T0.4.2: Implementación de `ProtectedRoute`**
  - Crear el componente encargado de proteger rutas que requieren autenticación.
  - Verificar el estado de sesión antes de permitir el acceso.
  - Redirigir usuarios no autenticados a `/login`.

- [ ] **T0.4.3: Implementación de `RoleGuard`**
  - Crear el componente para restringir funcionalidades según los roles.
  - Implementar soporte para `ADMIN`, `VENDEDOR` y `TECNICO`.
  - No inventar permisos adicionales que no estén definidos en los contratos o especificaciones.

- [ ] **T0.4.4: Implementación de `/unauthorized`**
  - Crear la pantalla de acceso no autorizado.
  - Mostrar un mensaje claro al usuario.
  - Proporcionar una navegación válida de retorno.

- [ ] **T0.4.5: Control de acciones en la interfaz**
  - Implementar el mecanismo único y reutilizable de visibilidad condicional en `src/components/guards/`, consumiendo los roles del contexto autenticado.
  - Ocultar o deshabilitar acciones que el usuario no tenga permitido ejecutar mediante dicho mecanismo.
  - Evitar comprobaciones de rol dispersas o ad-hoc dentro de los componentes visuales.
  - Mantener la autorización del backend como mecanismo definitivo de seguridad.

---

## Fase 0.5: Gestión de Usuarios

- [ ] **T0.5.1: Implementación de `UserService`**
  - Crear el servicio correspondiente al módulo de usuarios.
  - Integrar los endpoints definidos en el contrato del backend.
  - Mantener los métodos y estructuras alineados con `API_CONTRACTS.md`.

- [ ] **T0.5.2: Implementación de la página `/users`**
  - Crear `UsersPage.tsx`.
  - Implementar listado de usuarios.
  - Implementar estado de carga.
  - Implementar estado vacío.
  - Implementar estado de error.
  - Implementar acciones permitidas según autorización.

- [ ] **T0.5.3: Implementación del formulario de creación**
  - Crear el formulario correspondiente.
  - Implementar validaciones frontend.
  - Integrar la operación de creación definida por el backend.
  - Mostrar estados de procesamiento y resultado.

- [ ] **T0.5.4: Implementación del formulario de edición**
  - Implementar edición de usuarios.
  - Implementar la desactivación (baja) de usuarios mediante cambio de estado (`active: false`).
  - Integrar la operación correspondiente del backend.
  - Validar los datos antes de enviarlos.
  - Actualizar la interfaz después de una operación exitosa.

- [ ] **T0.5.5: Implementación de estados de usuario**
  - Representar correctamente los estados definidos por el contrato.
  - Evitar exponer información sensible.
  - Mantener consistencia entre los datos mostrados y los datos recibidos del backend.

- [ ] **T0.5.6: Validación del módulo de usuarios**
  - Verificar consulta.
  - Verificar creación.
  - Verificar edición.
  - Verificar desactivación (baja).
  - Verificar autorización.
  - Verificar errores del backend.
  - Verificar estados de carga y vacío.

---

## Fase 0.6: Gestión de Ubicaciones

- [ ] **T0.6.1: Implementación de `LocationService`**
  - Crear el servicio correspondiente al módulo de ubicaciones.
  - Integrar los endpoints definidos en el contrato.
  - Implementar consulta de ubicaciones.
  - Implementar consulta de ubicaciones activas.
  - Implementar creación y edición según los métodos definidos en el contrato.

- [ ] **T0.6.2: Implementación de la página `/locations`**
  - Crear `LocationsPage.tsx`.
  - Implementar listado de ubicaciones.
  - Implementar estado de carga.
  - Implementar estado vacío.
  - Implementar estado de error.

- [ ] **T0.6.3: Implementación del formulario de creación de ubicaciones**
  - Crear formulario de creación.
  - Implementar validaciones frontend.
  - Integrar la operación correspondiente con el backend.
  - Mostrar resultado de la operación.

- [ ] **T0.6.4: Implementación del formulario de edición de ubicaciones**
  - Crear formulario de edición.
  - Integrar la operación correspondiente con el backend.
  - Actualizar la información mostrada después de una modificación exitosa.

- [ ] **T0.6.5: Implementación de `locationStore`**
  - Crear `src/stores/locationStore.ts`.
  - Centralizar la ubicación operativa seleccionada.
  - Implementar selección y actualización de ubicación.
  - Mantener la selección en memoria durante la sesión activa, sin mecanismos de persistencia local (aplazados a la fase Offline-First).
  - Permitir que otros módulos consuman el contexto de ubicación.

- [ ] **T0.6.6: Implementación del selector de ubicación operativa**
  - Crear el componente reutilizable de selección.
  - Mostrar las ubicaciones disponibles según el contexto de la aplicación.
  - Mantener sincronizado el valor seleccionado con `locationStore`.

- [ ] **T0.6.7: Validación del módulo de ubicaciones**
  - Verificar consulta.
  - Verificar consulta de ubicaciones activas.
  - Verificar creación.
  - Verificar edición.
  - Verificar selección de ubicación.
  - Verificar autorización.

---

## Fase 0.7: Pruebas Unitarias y de Componentes

> La fase original de Persistencia Local y Offline-First fue retirada del alcance por decisión aprobada (OD-008): la Fase 0 opera exclusivamente en línea. Esta fase se destina a la verificación mediante pruebas, utilizando el entorno configurado en T0.1.5.

- [ ] **T0.7.1: Pruebas unitarias de servicios e interceptores**
  - Probar `AuthService` (login y perfil) con la capa HTTP mockeada.
  - Probar `UserService`, `LocationService` y `AuditLogService` con la capa HTTP mockeada.
  - Probar el interceptor de solicitudes: inclusión del Bearer desde `sessionStorage` y omisión en rutas públicas.
  - Probar el interceptor de respuestas: tratamiento de `401`, `403`, errores de red y estructura de error del backend (`message` como string o arreglo).
  - Comprobar tanto escenarios correctos como de error.

- [ ] **T0.7.2: Pruebas unitarias de stores**
  - Probar `authStore`: establecimiento de sesión, limpieza, restauración desde `sessionStorage` y expiración.
  - Probar `locationStore`: selección, actualización y consumo del contexto por otros módulos.

- [ ] **T0.7.3: Pruebas de componentes**
  - Probar formularios de login, usuarios y ubicaciones: validación, envío y mensajes de error.
  - Probar listados: estados de carga, vacío y error.
  - Probar los guards de ruta y el mecanismo de visibilidad condicional según roles.
  - Probar los componentes de notificación.

- [ ] **T0.7.4: Pruebas de los flujos de autenticación**
  - Probar el flujo completo de login con credenciales válidas e inválidas.
  - Probar la restauración de sesión al recargar la página (JWT en `sessionStorage` + `GET /auth/profile`).
  - Probar la expiración de sesión: `401` en solicitud protegida, limpieza del token y redirección a `/login` sin ciclos.
  - Probar el cierre de sesión: eliminación del JWT y del estado global.

- [ ] **T0.7.5: Validación de los resultados de pruebas**
  - Ejecutar la suite completa de pruebas.
  - Corregir los fallos detectados.
  - Confirmar que las pruebas cubren los escenarios correctos y de error de cada módulo implementado hasta esta fase.

---

## Fase 0.8: Consulta de Bitácora

- [ ] **T0.8.1: Implementación de `AuditLogService`**
  - Crear el servicio de consulta de bitácora.
  - Integrar `GET /audit-logs` según el contrato real.
  - Implementar los parámetros de consulta definidos por el backend.

- [ ] **T0.8.2: Implementación de la página `/audit-logs`**
  - Crear `AuditLogsPage.tsx`.
  - Implementar listado de registros.
  - Implementar estado de carga.
  - Implementar estado vacío.
  - Implementar estado de error.

- [ ] **T0.8.3: Implementación de filtros**
  - Implementar únicamente los filtros definidos por el contrato.
  - Validar los parámetros antes de enviarlos.
  - Mantener los filtros sincronizados con la consulta.

- [ ] **T0.8.4: Aplicación de autorización**
  - Proteger la ruta de bitácora.
  - Aplicar las restricciones de acceso definidas.
  - Evitar mostrar acciones de modificación cuando la funcionalidad es de solo lectura.

- [ ] **T0.8.5: Validación de la consulta de bitácora**
  - Verificar consulta correcta.
  - Verificar filtros.
  - Verificar respuesta vacía.
  - Verificar errores.
  - Verificar acceso no autorizado.

- [ ] **T0.8.6: Pruebas del módulo de bitácora**
  - Probar `AuditLogService` con la capa HTTP mockeada: parámetros de consulta, paginación y filtros.
  - Probar la página de bitácora: estados de carga, vacío, error y solo lectura.
  - Probar la autorización de la ruta.

---

## Fase 0.9: Estados y Experiencia de Interfaz

- [ ] **T0.9.1: Implementación de estados de carga**
  - Crear componentes reutilizables para representar operaciones en proceso.
  - Aplicarlos en login, usuarios, ubicaciones y bitácora.

- [ ] **T0.9.2: Implementación de estados vacíos**
  - Crear estados reutilizables para listas sin información.
  - Mostrar mensajes claros al usuario.

- [ ] **T0.9.3: Implementación de estados de error**
  - Crear componentes reutilizables para errores.
  - Diferenciar errores de red, servidor y autorización cuando corresponda.

- [ ] **T0.9.4: Implementación de estados de éxito**
  - Mostrar confirmaciones después de operaciones exitosas.
  - Evitar mensajes duplicados o innecesarios.

- [ ] **T0.9.5: Consistencia visual**
  - Aplicar Tailwind CSS siguiendo las convenciones del proyecto.
  - Mantener componentes y estados visuales consistentes entre los módulos de la Fase 0.

- [ ] **T0.9.6: Implementación de componentes de notificación (FR-051)**
  - Crear `src/components/notifications/` con componentes reutilizables para notificaciones de éxito, advertencia y error.
  - Integrar las notificaciones con el manejo centralizado de errores de Axios.
  - Aplicarlas en login, usuarios, ubicaciones y bitácora.
  - Evitar duplicar mecanismos de notificación entre módulos.

---

## Fase 0.10: Integración Global y Validación

- [ ] **T0.10.1: Integración del router**
  - Verificar todas las rutas de la Fase 0:
    - `/login`
    - `/users`
    - `/locations`
    - `/audit-logs`
    - `/unauthorized`
  - Verificar rutas protegidas y públicas.

- [ ] **T0.10.2: Verificación del flujo completo de autenticación**
  - Login.
  - Obtención del perfil.
  - Persistencia de sesión.
  - Navegación a rutas protegidas.
  - Expiración de sesión.
  - Logout.

- [ ] **T0.10.3: Verificación del flujo de autorización**
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

- [ ] **T0.10.5: Verificación de conectividad y manejo de errores de red**
  - Verificar que las operaciones que requieren el backend no se presenten como exitosas sin conectividad.
  - Verificar los mensajes de error ante ausencia de comunicación con el servidor.
  - Verificar que no existan mecanismos de caché local ni persistencia offline (fuera de alcance por decisión aprobada).

- [ ] **T0.10.6: Verificación de TypeScript**
  - Ejecutar la compilación TypeScript.
  - Corregir errores de tipos.
  - Verificar que no existan errores de compilación.

- [ ] **T0.10.7: Ejecución de la suite completa de pruebas**
  - Ejecutar todas las pruebas unitarias y de componentes con Vitest.
  - Confirmar que todas las pruebas superan correctamente.
  - Corregir los fallos detectados antes de continuar.

- [ ] **T0.10.8: Verificación de calidad del código**
  - Revisar separación de responsabilidades.
  - Revisar duplicación de código.
  - Revisar imports innecesarios.
  - Revisar consistencia de nombres.
  - Verificar cumplimiento de las convenciones de la Constitución.

- [ ] **T0.10.9: Validación final de la Fase 0**
  - Verificar todos los criterios de aceptación definidos en `spec.md`.
  - Confirmar que las tareas completadas correspondan al alcance de la Fase 0.
  - Confirmar que no se hayan implementado funcionalidades pertenecientes a M1–M8.
  - Confirmar que el frontend quede preparado para las siguientes fases.

---

## Fase 0.11: Criterios de Finalización

- [ ] **T0.11.1: Cumplimiento de la Constitución**
  - Verificar que la implementación respete las reglas y restricciones establecidas en `constitution.md`.

- [ ] **T0.11.2: Cumplimiento de la especificación**
  - Verificar que todos los requisitos funcionales de `spec.md` estén implementados.

- [ ] **T0.11.3: Cumplimiento del plan técnico**
  - Verificar que la implementación siga la arquitectura y estrategia definidas en `plan.md`.

- [ ] **T0.11.4: Compilación final**
  - Ejecutar el proceso de compilación del proyecto.
  - Confirmar que finalice sin errores.

- [ ] **T0.11.5: Validación de integración**
  - Confirmar que el frontend pueda comunicarse correctamente con el backend.
  - Confirmar que los contratos utilizados correspondan a la versión disponible del backend.

- [ ] **T0.11.6: Revisión final**
  - Confirmar que no existan tareas pendientes dentro del alcance de la Fase 0.
  - Confirmar que la infraestructura transversal esté lista para ser reutilizada por M1–M8.

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

## Regla de ejecución

La IA deberá ejecutar las tareas respetando `constitution.md`, `spec.md` y `plan.md` como fuentes de verdad.

Antes de implementar una tarea que dependa de un contrato del backend, deberá verificarse el contrato disponible en `backend-api/specs/API_CONTRACTS.md`.

Si existe una contradicción entre documentos, un endpoint no coincide, falta información necesaria o una decisión técnica no está definida, la IA deberá detener la implementación de esa parte y reportar la inconsistencia en lugar de inventar una solución.

Las tareas deberán marcarse como `[x]` únicamente después de haber sido implementadas y verificadas correctamente.