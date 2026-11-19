# AGENTS.md — Instrucciones del Proyecto Frontend

## 1. Propósito del proyecto

Este repositorio contiene el frontend web de Mundo Portátil.

El proyecto utiliza React, Vite y TypeScript. Su desarrollo sigue la metodología Spec-Driven Development (SDD).

El objetivo es implementar funcionalidades respetando la arquitectura, las especificaciones y los contratos definidos para el sistema.

## 2. Fuentes de verdad

Antes de realizar cualquier implementación, consulta los documentos correspondientes.

La documentación se organiza de la siguiente manera:

- `constitution.md`: establece los principios, arquitectura, tecnologías, estándares y restricciones técnicas del proyecto.
- `specs/<id>/spec.md`: define los requisitos funcionales, reglas de negocio y criterios de aceptación de cada fase.
- `specs/<id>/plan.md`: define la solución técnica y la estrategia de implementación.
- `specs/<id>/task.md`: contiene las tareas concretas que deben ejecutarse.

Todos estos documentos deben respetarse.

Si existe una contradicción entre ellos, no debes resolverla mediante suposiciones. Debes identificar el conflicto y solicitar una aclaración.

## 3. Flujo obligatorio SDD

Toda implementación debe seguir este procedimiento:

1. Identificar la fase y funcionalidad solicitada.
2. Consultar `constitution.md`.
3. Leer el `spec.md` correspondiente.
4. Revisar su `plan.md`.
5. Consultar `task.md` e identificar las tareas pendientes.
6. Analizar el estado actual del repositorio antes de modificar archivos.
7. Implementar respetando las tareas y dependencias.
8. Ejecutar las validaciones correspondientes.
9. Solicitar una revisión cuando la complejidad o el riesgo lo justifiquen.
10. Actualizar `task.md` únicamente después de verificar la implementación.

No debes saltarte la especificación para implementar directamente una solución.

### 3.1. Flujo de ramas obligatorio

El trabajo se organiza en dos niveles:

1. **Documentación SDD:** los documentos (`constitution.md`, `spec.md`, `plan.md`, `task.md`, `AGENTS.md`) se validan, actualizan e incorporan a la rama `develop` antes de comenzar la implementación.
2. **Implementación:** cada fase se desarrolla en una rama `feature/*` creada a partir de `develop` actualizado (por ejemplo, `feature/phase-0-foundation`).

No comiences la implementación de una fase antes de que sus documentos estén aprobados e incorporados a `develop`, y de que la rama `feature/*` correspondiente exista.

## 4. Uso de agentes

El agente principal `frontend` es responsable de analizar las solicitudes, organizar el trabajo y decidir qué subagentes utilizar.

Los subagentes disponibles son:

- `frontend-builder`: implementación de funcionalidades y componentes React.
- `frontend-ui`: diseño, presentación, experiencia de usuario y componentes visuales.
- `frontend-reviewer`: revisión de código, accesibilidad, calidad y cumplimiento de las especificaciones.

El agente principal debe delegar según la naturaleza de cada tarea.

No es obligatorio utilizar todos los subagentes en cada implementación.

El agente que coordina el trabajo debe comprobar que los resultados de los subagentes respeten los documentos SDD.

### 4.1. Configuración de agentes y skills en GitHub Copilot (compatibilidad OpenCode)

Las definiciones de agentes para Copilot se ubican en `.github/agents/`:

- **Agentes Copilot (`.github/agents/`):**
  - `frontend.agent.md`: agente principal y orquestador.
  - `frontend-builder.agent.md`: subagente especialista en construcción e implementación.
  - `frontend-reviewer.agent.md`: subagente especialista en revisión (solo lectura, sin edición).
  - `frontend-ui.agent.md`: subagente especialista en interfaz y experiencia de usuario.

Las skills del proyecto se mantienen en `.agents/skills/` para evitar duplicación y preservar la fuente original:

- `vercel-react-best-practices`: optimización y mejores prácticas de React/Next.js. Autorizada para `frontend`, `frontend-builder` y `frontend-reviewer`.
- `vercel-composition-patterns`: patrones de composición y escalabilidad de componentes. Autorizada para `frontend`, `frontend-builder` y `frontend-ui`.
- `vercel-react-view-transitions`: animaciones y transiciones de navegación con View Transition API. Autorizada para `frontend`, `frontend-builder` y `frontend-ui`.
- `web-design-guidelines`: directrices de diseño web, accesibilidad y UX. Autorizada para `frontend`, `frontend-reviewer` y `frontend-ui`.

El agente principal coordina y delega tareas a los subagentes con `runSubagent` en Copilot, respetando responsabilidades, herramientas y skills autorizadas.

## 5. Tecnologías y arquitectura

Respetar el stack tecnológico establecido en `constitution.md`.

No introducir tecnologías, librerías, dependencias o patrones arquitectónicos que contradigan la Constitución.

Antes de incorporar una nueva dependencia:

- Comprobar si el proyecto ya dispone de una solución.
- Justificar por qué es necesaria.
- Verificar que no contradiga las restricciones del proyecto.

Mantener la separación por módulos y responsabilidades definida en el plan técnico.

## 6. Integración con el backend

El frontend debe respetar los contratos publicados por el backend.

Antes de implementar una integración HTTP, consultar:

`../backend-api/specs/API_CONTRACTS.md`

Este archivo debe consultarse desde la rama `origin/develop` del repositorio `backend-api`. Si el checkout local de `backend-api` no se encuentra en esa rama o el archivo no existe en el directorio de trabajo, obtenerlo mediante `git show origin/develop:specs/API_CONTRACTS.md` o cambiar el checkout a `develop`, sin modificar el repositorio backend.

Verificar los endpoints, métodos HTTP, parámetros, DTO, respuestas y requisitos de autenticación.

Reglas obligatorias:

- No inventar endpoints.
- No inventar estructuras de solicitudes o respuestas.
- No asumir permisos que no estén documentados.
- No modificar el repositorio del backend desde este proyecto.
- Informar cuando un contrato sea inexistente, incompleto o contradictorio.

Si no es posible acceder al contrato, detener la implementación de la integración afectada y comunicar el bloqueo.

## 7. Calidad y validación

Después de implementar, ejecutar las comprobaciones disponibles y pertinentes:

- Verificación de TypeScript.
- Compilación del proyecto.
- Linter, si está configurado.
- Pruebas con Vitest y React Testing Library, según la estrategia definida en el `plan.md` de la fase.
- Validación de los criterios de aceptación de la especificación.

No afirmar que una funcionalidad está terminada si no se ha verificado.

No ocultar errores de compilación, pruebas fallidas ni advertencias relevantes.

## 8. Gestión de tareas

`task.md` es el registro del progreso de implementación de cada fase.

- `[ ]`: tarea pendiente.
- `[x]`: tarea implementada y verificada.

Actualizar las tareas cuando se haya completado y comprobado su resultado.

No marcar tareas como completadas únicamente porque se hayan creado archivos o escrito código.

Si una tarea no puede completarse por falta de información o dependencias, dejarla pendiente y documentar el motivo.

## 9. Restricciones generales

- Mantener el alcance de la fase solicitada.
- No implementar funcionalidades que no estén contempladas en la especificación.
- No modificar documentos SDD para justificar una implementación que se desvíe de los requisitos.
- No eliminar código existente sin analizar sus dependencias.
- No duplicar lógica o servicios existentes.
- No realizar cambios en el backend desde este repositorio.
- Priorizar soluciones simples, mantenibles y coherentes con la arquitectura.
- Comunicar las decisiones importantes y los bloqueos antes de realizar cambios que alteren el alcance.

## 10. Informe de finalización

Al finalizar una tarea o conjunto de tareas, informar:

1. Tareas completadas.
2. Archivos creados o modificados.
3. Subagentes utilizados y sus responsabilidades.
4. Validaciones ejecutadas y sus resultados.
5. Tareas que continúan pendientes.
6. Problemas, decisiones pendientes o bloqueos.

El trabajo solo puede considerarse finalizado cuando cumple la especificación y supera las validaciones correspondientes.