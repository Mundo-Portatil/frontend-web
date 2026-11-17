# CONSTITUCIÓN TÉCNICA — FRONTEND MUNDO PORTÁTIL

## 1. Propósito

Este documento establece los principios arquitectónicos, tecnologías oficiales, estándares y restricciones que gobiernan exclusivamente el desarrollo del frontend de Mundo Portátil.

Su finalidad es garantizar una aplicación modular, mantenible, segura y preparada para trabajar tanto con conexión como sin conexión.

Esta Constitución es de cumplimiento obligatorio para todos los desarrolladores del frontend.

No sustituye las especificaciones funcionales, los contratos de integración ni la documentación de gestión del equipo.

---

## 2. Stack tecnológico oficial

El frontend utilizará las siguientes tecnologías:

| Tecnología | Responsabilidad |
|---|---|
| React | Construcción de interfaces |
| Vite | Herramienta de desarrollo y construcción |
| TypeScript | Lenguaje de programación |
| Tailwind CSS | Estilos e interfaz |
| React Router | Navegación y enrutamiento |
| Zustand | Gestión del estado global |
| Axios | Comunicación HTTP con el backend |
| Dexie.js | Persistencia local mediante IndexedDB |
| vite-plugin-pwa | Implementación de capacidades PWA |

### 2.1. APIs y tecnologías nativas

Se utilizarán las siguientes capacidades del navegador:

- IndexedDB.
- Service Workers.
- WebSerial API.
- WebSocket.
- Eventos de teclado y dispositivos HID.

La incorporación de nuevas dependencias debe estar técnicamente justificada y no debe duplicar funcionalidades existentes sin una razón documentada.

> **Nota de alcance (Fase 0):** por decisión aprobada, Dexie.js, IndexedDB y `vite-plugin-pwa` no se utilizan durante la Fase 0. La aplicación funciona exclusivamente con conexión y la persistencia local se abordará en la fase Offline-First posterior. El resto del stack aplica íntegramente desde la Fase 0.

---

## 3. Principios arquitectónicos

### 3.1. Arquitectura modular

El frontend debe organizarse por dominios funcionales independientes.

Cada módulo debe mantener sus propias responsabilidades, componentes, servicios, hooks y lógica de presentación.

La comunicación entre módulos debe realizarse mediante interfaces y contratos explícitos.

### 3.2. Separación de responsabilidades

El código debe mantener una separación clara entre:

- **Presentación:** componentes visuales e interfaces.
- **Aplicación:** coordinación de operaciones y casos de uso.
- **Dominio:** reglas y lógica propias del módulo en el frontend.
- **Infraestructura:** comunicación HTTP, almacenamiento local e integración con dispositivos.

Los componentes visuales no deben contener lógica de negocio compleja ni realizar directamente operaciones de infraestructura.

### 3.3. Bajo acoplamiento

Los módulos no deben depender directamente de las estructuras internas de otros módulos.

Se deben evitar dependencias circulares y duplicación de lógica.

### 3.4. Reutilización

Los componentes, hooks y servicios compartidos deben implementarse en ubicaciones comunes cuando realmente sean reutilizables.

No se deben crear abstracciones innecesarias ni componentes genéricos que dificulten el mantenimiento.

### 3.5. Fuente de verdad

El backend es la fuente de verdad de los datos del sistema.

El frontend puede mantener información local para mejorar la disponibilidad y continuidad operativa, pero debe respetar los mecanismos de sincronización y validación establecidos.

---

## 4. Organización de dominios funcionales

El frontend se organiza en ocho dominios:

| Identificador | Dominio |
|---|---|
| M1 | Inventario |
| M2 | Ventas y Garantías |
| M3 | Logística Interna y Movimientos |
| M4 | Auditoría Express |
| M5 | Administración, Alertas y Aprobaciones |
| M6 | Ubicaciones, Trazabilidad y Bitácora |
| M7 | Servicio Técnico |
| M8 | Historial y Cierre de Caja |

Cada dominio debe implementarse dentro de su propio directorio en `src/modules/`.

Reglas obligatorias:

- Cada módulo mantiene sus componentes y lógica específicos.
- Los módulos no deben modificar directamente el estado interno de otros módulos.
- Las funcionalidades compartidas deben exponerse mediante mecanismos reutilizables.
- Las dependencias entre módulos deben ser explícitas.
- No se permiten dependencias circulares.
- Las funcionalidades y relaciones específicas se definen en las Specs correspondientes.

Esta sección establece únicamente la organización arquitectónica, no el comportamiento funcional de los módulos.

---

## 5. Estructura del proyecto

La organización inicial del frontend será la siguiente:

```text
frontend-web/
├── public/
├── src/
│   ├── modules/
│   │   ├── inventory/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── services/
│   │   │   ├── stores/
│   │   │   └── index.ts
│   │   ├── sales/
│   │   ├── logistics/
│   │   ├── auditing/
│   │   ├── administration/
│   │   ├── traceability/
│   │   ├── technical-service/
│   │   └── cash-management/
│   ├── components/
│   ├── hooks/
│   ├── services/
│   │   ├── api/
│   │   ├── scanner/
│   │   ├── printer/
│   │   └── synchronization/
│   ├── stores/
│   ├── database/
│   ├── router/
│   ├── config/
│   ├── assets/
│   ├── App.tsx
│   └── main.tsx
└── package.json
```

Esta estructura es una referencia arquitectónica obligatoria en cuanto a la separación de responsabilidades. Los directorios internos de cada módulo pueden ampliarse según sus necesidades, sin romper los límites establecidos.

### 5.1. Organización de servicios HTTP

Se establece una única convención:

- Los servicios HTTP específicos de cada dominio viven en `src/modules/<modulo>/services/`.
- La infraestructura HTTP compartida vive en `src/services/api/`.
- La instancia de Axios y sus configuraciones comunes se centralizan en `src/services/api/`.
- Los componentes visuales no deben realizar peticiones HTTP directamente.
- Los módulos deben consumir sus propios servicios para comunicarse con el backend.

No se deben duplicar instancias ni configuraciones HTTP en diferentes módulos.

### 5.2. Organización de hooks

Los hooks reutilizables y transversales deben ubicarse en `src/hooks/`.

Los hooks específicos de un dominio deben permanecer dentro de su módulo.

El hook global de captura del lector de códigos se ubicará en:

`src/hooks/useBarcodeScanner.ts`

Su responsabilidad será gestionar la captura y el procesamiento de eventos HID desde React.

### 5.3. Integración del lector de códigos

La infraestructura relacionada con el lector se ubicará en:

`src/services/scanner/`

Se establece la siguiente separación:

- `useBarcodeScanner.ts`: integración con el ciclo de vida de React y captura de eventos.
- `services/scanner/`: lógica reutilizable y mecanismos de infraestructura del lector.

El hook no debe contener reglas de negocio ni duplicar las responsabilidades del servicio.

---

## 6. Gestión del estado

Zustand es la tecnología oficial para la gestión del estado global.

Se establecen las siguientes reglas:

- El estado global debe utilizarse cuando la información sea compartida entre diferentes componentes o módulos.
- El estado local de interfaz debe permanecer dentro del componente cuando corresponda.
- Los stores deben mantener responsabilidades claramente delimitadas.
- No se deben duplicar innecesariamente datos entre Zustand y Dexie.
- Los datos derivados deben calcularse a partir de sus fuentes originales cuando sea posible.
- La persistencia de información debe gestionarse mediante la capa de almacenamiento correspondiente.

Los stores específicos de cada dominio deben ubicarse dentro de su módulo.

Los stores transversales deben ubicarse en `src/stores/`.

La estructura y responsabilidad de cada store se detallará en las Specs correspondientes.

---

## 7. Comunicación con el backend

Axios es el cliente HTTP oficial del frontend.

Se utilizará una instancia centralizada para gestionar:

- URL base del backend.
- Encabezados comunes.
- Transmisión de tokens JWT.
- Interceptores de solicitudes y respuestas.
- Tratamiento centralizado de errores.
- Configuración común de peticiones.

Los módulos no deben crear instancias independientes de Axios sin justificación arquitectónica aprobada.

Las rutas exactas de la API, métodos HTTP, parámetros, payloads, respuestas y códigos de error deben respetar los contratos oficiales del backend.

### 7.1. Fuente de verdad de los contratos

La fuente oficial de los contratos de integración que consume el frontend es:

`backend-api/specs/API_CONTRACTS.md`

Este archivo debe consultarse desde la rama `origin/develop` del repositorio `backend-api`.

Adicionalmente, la documentación Swagger/OpenAPI publicada por el backend y montada en `/api` constituye la referencia de los endpoints disponibles, sus parámetros, esquemas y mecanismos de autenticación.

La autenticación de los endpoints protegidos utiliza `Bearer Auth` mediante tokens JWT.

En caso de discrepancias entre el contrato, Swagger/OpenAPI y la implementación disponible, se debe solicitar la aclaración correspondiente antes de desarrollar una integración incompatible.

El frontend no debe inventar endpoints, modificar unilateralmente payloads ni asumir estructuras de respuesta que no estén documentadas.

---

## 8. Autenticación y autorización desde el frontend

El frontend utilizará Axios para comunicarse con los endpoints de autenticación del backend.

No se utilizará Supabase Auth directamente desde el frontend; toda autenticación se gestionará mediante los endpoints del backend (`POST /auth/login`, `GET /auth/profile`) con tokens JWT Bearer.

El flujo general será:

1. El usuario introduce sus credenciales en la interfaz.
2. El frontend envía la solicitud de autenticación mediante `POST /auth/login`.
3. El backend gestiona la autenticación y devuelve el resultado correspondiente según el contrato establecido.
4. El frontend administra el estado de sesión y transmite el JWT mediante el encabezado `Authorization: Bearer <token>` en las solicitudes protegidas.
5. El frontend puede consultar el perfil autenticado mediante `GET /auth/profile`.
6. El backend valida la identidad y los permisos de cada operación.

El frontend debe contemplar:

- Estado de sesión.
- Expiración de sesión.
- Tratamiento de errores de autenticación.
- Renovación de tokens cuando esté contemplada en el contrato.
- Cierre de sesión.
- Protección de rutas según los permisos recibidos.

El almacenamiento, renovación y revocación de tokens deben respetar el contrato de autenticación aprobado.

Los roles, permisos y reglas RBAC se definirán en los contratos de autorización y Specs correspondientes.

La protección de rutas en el frontend no sustituye la autorización obligatoria del backend.

### 8.1. Almacenamiento del token (decisión aprobada)

Se aprueba la siguiente estrategia de almacenamiento del JWT Bearer:

- El token recibido de `POST /auth/login` se almacena en `sessionStorage`.
- Al inicializar o recargar la aplicación, el frontend recupera el JWT de `sessionStorage` y restaura el estado de autenticación consultando `GET /auth/profile`.
- El cliente Axios adjunta automáticamente `Authorization: Bearer <token>` en las solicitudes protegidas.
- Al cerrar sesión, el token se elimina de `sessionStorage` junto con el estado de autenticación.
- Queda prohibido utilizar `localStorage` o cookies para almacenar el token.
- No se implementan refresh tokens ni renovación automática en la Fase 0. Cuando el token expire, el backend responderá `401` y el frontend ejecutará el flujo de cierre de sesión y nueva autenticación.
- No se implementa control de inactividad.
- El mecanismo de autenticación Bearer del backend no se modifica desde el frontend.

**Limitación conocida:** `sessionStorage` mantiene la sesión al recargar la página y mientras la pestaña permanezca abierta, pero no protege el token frente a ataques XSS. Esta limitación se acepta de forma explícita para la Fase 0 y deberá reevaluarse en fases posteriores.

**Expiración del JWT:** la duración deseada del token es de una hora. Su configuración corresponde al backend y **no debe asumirse como ya establecida**: debe verificarse y ajustarse posteriormente en el repositorio `backend-api`, sin modificar el contrato actual. El frontend debe manejar correctamente las respuestas de token expirado (`401`) con independencia de la duración configurada.

---

## 9. Persistencia local y arquitectura Offline-First

Dexie.js será la capa oficial de acceso a IndexedDB.

Su finalidad es permitir la persistencia local de información y la continuidad operativa del frontend cuando las condiciones funcionales lo permitan.

> **Aplazamiento aprobado:** la arquitectura Offline-First (persistencia local, caché de lectura, colas de sincronización y recuperación de operaciones pendientes) **no forma parte de la Fase 0**. Durante la Fase 0 la aplicación funciona exclusivamente con conexión a Internet y todas las operaciones se ejecutan en línea. Los principios de esta sección rigen para la fase Offline-First posterior, cuando se definan sus requisitos y arquitectura mediante las Specs y ADR correspondientes.

### 9.1. Clasificación de operaciones

Cada operación debe clasificarse explícitamente en su Spec como:

- **Offline-capable:** puede ejecutarse sin conexión y registrarse localmente para sincronización posterior.
- **Online-required:** necesita conexión con el backend para ejecutarse.
- **Read-cacheable:** permite consultar información previamente almacenada en caché local.

El frontend no debe decidir arbitrariamente qué operaciones pueden funcionar sin conexión.

### 9.2. Persistencia de operaciones

Las operaciones autorizadas para ejecutarse offline deben utilizar Dexie para gestionar su persistencia local.

Cuando una operación requiera sincronización posterior, debe registrarse en una cola persistente.

La implementación debe evitar que una operación pendiente desaparezca al cerrar o reiniciar la aplicación.

### 9.3. Sincronización

La infraestructura transversal de sincronización se ubicará en:

`src/services/synchronization/`

El frontend debe disponer de un mecanismo centralizado de sincronización que permita:

- Detectar la disponibilidad de conexión.
- Identificar operaciones pendientes.
- Procesar la cola de sincronización.
- Gestionar errores y reintentos.
- Actualizar el estado de las operaciones.
- Evitar la pérdida de información pendiente.

### 9.4. Integridad y conflictos

No se debe considerar una operación local como confirmada por el backend hasta recibir la respuesta correspondiente.

La estrategia de prevención de duplicados, idempotencia, concurrencia, resolución de conflictos y reintentos debe documentarse mediante contratos y decisiones arquitectónicas aprobadas.

### 9.5. Definición por módulo

Cada Spec debe especificar:

- Qué operaciones funcionan offline.
- Qué operaciones requieren conexión.
- Qué información se almacena localmente.
- Qué información puede consultarse desde caché.
- Qué operaciones necesitan sincronización.
- Cómo se gestionan los errores y conflictos.

---

## 10. PWA y Service Worker

El frontend debe implementar capacidades PWA mediante `vite-plugin-pwa`.

El Service Worker será responsable de gestionar las estrategias de caché y disponibilidad de los recursos de la aplicación.

Reglas obligatorias:

- Los recursos estáticos deben gestionarse mediante las estrategias de caché correspondientes.
- La persistencia de datos operativos debe realizarse mediante IndexedDB.
- La caché de recursos no debe confundirse con la persistencia transaccional.
- Las actualizaciones de la aplicación deben gestionarse sin comprometer la integridad de los datos locales.
- La aplicación debe comunicar claramente su estado de conexión y sincronización.

---

## 11. Integración con hardware

La integración con dispositivos físicos debe realizarse mediante servicios desacoplados de los componentes visuales y de la lógica de negocio.

### 11.1. Lectores de códigos

La aplicación debe permitir la captura de códigos mediante lectores compatibles con dispositivos HID.

La captura debe ser reutilizable y no depender de una pantalla o módulo específico.

El procesamiento de códigos y su interpretación funcional deben permanecer separados.

### 11.2. Impresoras térmicas

La infraestructura de impresión se ubicará en:

`src/services/printer/`

La impresión debe implementarse mediante una capa de servicio independiente.

La selección entre WebSerial API y un servicio local mediante WebSocket requiere un ADR aprobado antes de su implementación.

Los formatos, comandos y contratos de impresión deben documentarse por separado.

---

## 12. Navegación y rutas

React Router es la tecnología oficial para la navegación del frontend.

La configuración de rutas debe centralizarse en `src/router/`.

Se establecen las siguientes reglas:

- Las rutas deben estar centralizadas y organizadas.
- La navegación debe respetar los límites de los módulos.
- Las rutas protegidas deben contemplar el estado de autenticación y autorización.
- Los componentes de navegación no deben contener reglas de negocio.
- Las rutas no deben duplicarse ni definirse de forma dispersa.

Las rutas exactas, nombres, parámetros y permisos de acceso se definirán en las Specs correspondientes.

---

## 13. Estándares de desarrollo

### 13.1. Convención de idiomas

Se establece una convención uniforme para todo el frontend:

| Elemento | Idioma |
|---|---|
| Código fuente | Inglés |
| Nombres de archivos y carpetas | Inglés |
| Variables y funciones | Inglés |
| Clases e interfaces | Inglés |
| Nombres de componentes | Inglés |
| Rutas URL del frontend (React Router) | Inglés |
| Endpoints de API | Inglés |
| Textos visibles en la interfaz | Español |
| Mensajes de validación para usuarios | Español |
| Documentación técnica | Español |
| Mensajes de commit | Inglés |

Ejemplos de rutas del frontend:

- `/inventory`
- `/sales`
- `/locations`
- `/audit-logs`

Los textos visibles, etiquetas, formularios y mensajes dirigidos al usuario deben permanecer en español.

### 13.2. Calidad del código

Todo el código debe respetar los siguientes principios:

- Responsabilidad única.
- Bajo acoplamiento.
- Alta cohesión.
- Tipado explícito mediante TypeScript.
- Reutilización razonable.
- Manejo controlado de errores.
- Ausencia de duplicación innecesaria.
- Separación entre interfaz, lógica e infraestructura.

### 13.3. Componentes

Los componentes deben mantener responsabilidades específicas.

Se debe evitar:

- Componentes excesivamente grandes.
- Lógica de negocio dentro de componentes visuales.
- Peticiones HTTP directas desde componentes.
- Duplicación de componentes con la misma responsabilidad.
- Dependencias innecesarias entre módulos.

### 13.4. Convenciones de commits

Los mensajes de commit deben utilizar Conventional Commits.

Ejemplos:

- `feat: add inventory interface`
- `fix: correct scanner input handling`
- `refactor: simplify sales components`
- `docs: update frontend architecture`

### 13.5. Control de versiones y Pull Requests

El frontend utilizará un flujo de trabajo basado en GitFlow simplificado.

Ramas principales:

| Rama | Responsabilidad |
|---|---|
| `main` | Código estable y listo para producción |
| `develop` | Integración de funcionalidades desarrolladas |
| `feature/*` | Desarrollo individual de funcionalidades |

Reglas obligatorias:

- No se permiten commits directos a `main` ni a `develop`.
- Toda funcionalidad debe desarrollarse en una rama `feature/*`.
- La integración hacia `develop` debe realizarse mediante Pull Request.
- La integración hacia `main` también requiere Pull Request.
- Todo Pull Request debe recibir la revisión y aprobación de al menos un compañero.
- Antes de integrar cambios, debe verificarse que la compilación de TypeScript finalice correctamente y sin errores.
- No se deben integrar cambios que introduzcan errores de compilación.
- Las ramas deben mantenerse actualizadas respecto a la rama de destino antes de completar la integración.

Ejemplos de ramas:

- `feature/inventory-interface`
- `feature/offline-synchronization`
- `feature/barcode-scanner`
- `feature/thermal-printer`

---

## 14. Seguridad del frontend

El frontend debe aplicar buenas prácticas de seguridad en todas sus capas.

Son obligatorias las siguientes reglas:

- No exponer credenciales ni secretos del backend.
- No almacenar información sensible innecesariamente.
- No confiar en validaciones realizadas exclusivamente en el cliente.
- Gestionar correctamente los errores de autenticación.
- Evitar la exposición de información interna en mensajes visibles.
- Respetar los permisos recibidos para controlar la presentación y navegación.
- No considerar las restricciones visuales como sustituto de la autorización del servidor.
- Proteger la información persistida localmente según su sensibilidad.

El frontend debe asumir que cualquier operación puede ser manipulada por el cliente y que la validación definitiva corresponde al backend.

---

## 15. Testing y calidad

El frontend debe incorporar pruebas proporcionales a la criticidad de sus componentes.

Se establecen tres niveles:

- **Pruebas unitarias:** validación de funciones, hooks, stores y lógica de interfaz.
- **Pruebas de integración:** validación de la interacción entre componentes, servicios y módulos.
- **Pruebas end-to-end:** validación de flujos completos de usuario.

Las herramientas de testing, cobertura mínima y criterios de aceptación deben establecerse en los estándares de calidad y Specs correspondientes.

**Herramientas de testing aprobadas:** Vitest (ejecución y organización de pruebas) y React Testing Library (pruebas de componentes y comportamiento de la interfaz), junto con las dependencias auxiliares estrictamente necesarias para su funcionamiento (entorno DOM simulado y matchers de aserción). Cualquier herramienta adicional de pruebas requiere justificación y aprobación previa.

Ninguna funcionalidad debe considerarse lista sin las verificaciones de calidad que le correspondan.

---

## 16. Contratos y especificaciones

Esta Constitución establece las reglas generales del frontend.

Los detalles de implementación funcional e integración deben documentarse por separado.

### 16.1. Especificaciones funcionales

Cada módulo debe contar con sus propias Specs, que definan:

- Objetivo y alcance.
- Casos de uso.
- Comportamiento de la interfaz.
- Reglas de interacción.
- Criterios de aceptación.
- Estados de carga y error.
- Comportamiento offline.
- Dependencias funcionales.

### 16.2. Contratos de integración

Los contratos ubicados en `contracts/` o en las Specs correspondientes deben definir:

- Endpoints consumidos por el frontend.
- Métodos HTTP.
- Parámetros, payloads y respuestas.
- Estructuras y códigos de error.
- Contratos de autenticación.
- Roles y permisos RBAC.
- Estructuras de eventos.
- Esquemas y versiones de IndexedDB.
- Contratos de sincronización.
- Interfaces de integración con hardware.

La fuente de verdad de los contratos de integración que consume el frontend es:

`backend-api/specs/API_CONTRACTS.md`

Este documento debe consultarse desde `origin/develop` del repositorio `backend-api`.

La documentación Swagger/OpenAPI publicada por el backend en `/api` constituye la referencia complementaria de endpoints, parámetros, esquemas y mecanismos de autenticación.

Los endpoints protegidos utilizan autenticación `Bearer Auth` mediante tokens JWT.

En caso de discrepancias entre el archivo de contratos, Swagger/OpenAPI y la implementación disponible, se debe solicitar una aclaración antes de desarrollar una integración incompatible.

El frontend debe respetar estos contratos y no implementar estructuras incompatibles por decisión unilateral.

### 16.3. Decisiones arquitectónicas

Las decisiones que afecten la arquitectura del frontend deben documentarse mediante ADR (Architecture Decision Records).

---

## 17. Gobernanza arquitectónica

Toda implementación del frontend debe respetar esta Constitución.

Las siguientes decisiones requieren documentación y aprobación previa:

1. Incorporación de nuevas tecnologías o dependencias estructurales.
2. Modificaciones de la arquitectura modular.
3. Cambios en la gestión de autenticación y tokens.
4. Selección del mecanismo de impresión térmica.
5. Selección del mecanismo de comunicación en tiempo real desde el frontend.
6. Definición de estrategias de sincronización offline.
7. Resolución de conflictos y prevención de operaciones duplicadas.
8. Cambios en los esquemas de persistencia local que afecten operaciones existentes.
9. Modificaciones de contratos que afecten a varios módulos.

Las decisiones anteriores deben registrarse mediante ADR o contratos aprobados, según corresponda.

No se deben implementar decisiones arquitectónicas críticas basándose únicamente en acuerdos informales o suposiciones individuales.

---

## 18. Principio rector

La Constitución define cómo debe construirse y organizarse el frontend de Mundo Portátil.

Las Specs definen qué debe hacer cada módulo y cómo debe comportarse la interfaz.

Los contratos definen cómo se comunica el frontend con el backend y con los mecanismos de infraestructura.

Los ADR documentan por qué se toman determinadas decisiones técnicas.

La documentación de gestión define quién realiza cada tarea y cuándo.

Cada documento debe mantener su propia responsabilidad.

**El frontend de Mundo Portátil debe permanecer modular, coherente, seguro y preparado para evolucionar sin comprometer la integridad de la información ni la continuidad operativa.**   