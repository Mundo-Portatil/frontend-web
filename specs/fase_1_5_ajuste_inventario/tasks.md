# Tareas de Implementación — Fase 1.5: Rediseño UX de Inventario Unificado y Rol Encargado de Almacén

**Repositorio:** `frontend-web`  
**Rama:** `refact/inventario`  
**Fase:** 1.5 — Rediseño UX de Inventario Unificado y Rol Encargado de Almacén  
**Documentos de referencia:**  
- `specs/constitution.md`  
- `specs/fase_1_5_ajuste_inventario/spec.md`  
- `specs/fase_1_5_ajuste_inventario/plan.md`  

---

## Fase 1.5.0: Modelos de Dominio, Tipos y RBAC Base

- [x] **T1.5.0.1: Incorporación del Rol `ENCARGADO_ALMACEN` en Foundation**
  - Actualizar `src/modules/foundation/auth/models.ts` para que `Role` sea `'ADMIN' | 'ENCARGADO_ALMACEN' | 'VENDEDOR' | 'TECNICO'`.
  - Actualizar `src/modules/foundation/auth/roleLabels.ts` para añadir `ENCARGADO_ALMACEN: 'Encargado de almacén'`.
  - Actualizar `ROLE_OPTIONS` en `src/modules/foundation/users/pages/UsersPage.tsx` permitiendo crear y editar usuarios con dicho rol.
  - Verificar que `src/modules/foundation/users/models.ts` propaga el rol correctamente.

- [x] **T1.5.0.2: Refactorización de Modelos de Catálogo (`catalogModels.ts`)**
  - Eliminar la propiedad `name: string;` en `CatalogItem`, `CreateCatalogItemPayload` (o `CreateCatalogInput`) y `UpdateCatalogInput`.
  - Hacer `sku?: string` opcional al crear en `CreateCatalogItemPayload`.
  - Mantener campos técnicos opcionales (`processor`, `ramCapacity`, `storageCapacity`, `gpu`, `screenSize`, `minStockThreshold`, `isSerialized`, `isSecondHand`).
  - Mover la interfaz `Category` y sus filtros a `catalogModels.ts` (o re-exportar desde `models.ts`).

- [x] **T1.5.0.3: Eliminación de Jerarquía Padre-Hijo y Modelos de Hardware (`hardwareModels.ts`)**
  - Eliminar de `HardwareItem`: `parentChassisId`, `components`, `parentChassis`, y `catalogName`.
  - Añadir a `HardwareItem`: `catalogBrand?: string`, `catalogModel?: string`, `catalogSku?: string`.
  - Eliminar `InboundComponent`, `InboundItem` (con `children`) y `BatchInboundInput`.
  - Definir `UnifiedInboundItemPayload`, `UnifiedInboundPayload`, `UnifiedInboundResultItem` y `UnifiedInboundResponse`.
  - Definir `AvailableSerial`, `BarcodeLabelItem`, `SerialValidationResponse` y `HardwareLifecycleResponse`.

- [x] **T1.5.0.4: Actualización de Modelos de Stock por Cantidad (`quantityModels.ts`)**
  - Eliminar `catalogName?: string;` de `QuantityStockItem` (o `QuantityStock`).
  - Asegurar la presencia de `catalogBrand: string; catalogModel: string; catalogSku: string;`.
  - Mantener `AdjustQuantityStockInput` (`catalogId`, `locationId`, `newQuantity`, `reason`).

---

## Fase 1.5.1: Servicios HTTP e Integración de Endpoints Unificados

- [x] **T1.5.1.1: Servicio de Inventario Unificado (`services/inventoryService.ts`)**
  - Crear `src/modules/inventory/services/inventoryService.ts`.
  - Implementar `inboundInventory(payload: UnifiedInboundPayload): Promise<UnifiedInboundResponse>` consumiendo `POST /inventory/inbound`.
  - Implementar `getBarcodeLabelsByModel(payload: { catalogId: string; locationId?: string; copies: number }): Promise<BarcodeLabelItem[]>` consumiendo `POST /inventory/barcode-labels/by-model`.
  - Normalizar errores y utilizar `apiClient` centralizado sin importar Axios en componentes.

- [x] **T1.5.1.2: Refactorización del Servicio de Hardware (`services/hardwareItemService.ts`)**
  - Eliminar `batchInbound`, `attachChildren` y `detachChild`.
  - Implementar `getAvailableSerials(params: { catalogId: string; locationId?: string }, signal?: AbortSignal): Promise<AvailableSerial[]>` (`GET /hardware-items/available-serials`).
  - Implementar `getHardwareLifecycle(id: string, signal?: AbortSignal): Promise<HardwareLifecycleResponse>` (`GET /hardware-items/:id/lifecycle`).
  - Implementar `decommissionHardwareItem(id: string, reason: string): Promise<HardwareItem>` (`PATCH /hardware-items/:id/decommission`).
  - Implementar `updateHardwareItem(id: string, payload: { salePrice?: number; locationId?: string }): Promise<HardwareItem>` (`PATCH /hardware-items/:id`).
  - Implementar `listPendingSecondHand(signal?: AbortSignal): Promise<HardwareItem[]>` (`GET /hardware-items?status=SEGUNDA_MANO_PENDIENTE`).
  - Implementar `approveUsedItem(payload: { itemId: string; locationId: string; salePrice: number }): Promise<HardwareItem>` (`POST /hardware-items/approve-used`).
  - Mantener `scanHardware` (`GET /hardware-items/scan/:code`) y `validateSerials` (`POST /hardware-items/validate-serials`).

- [x] **T1.5.1.3: Servicio de Etiquetas 1D (`services/barcodeLabelService.ts`)**
  - Implementar `getSingleBarcodeLabel(id: string): Promise<BarcodeLabelItem>` (`GET /hardware-items/:id/barcode-label`).
  - Actualizar `getBatchLabels(hardwareItemIds: string[]): Promise<BarcodeLabelItem[]>` (`POST /hardware-items/barcode-labels/batch`).

- [x] **T1.5.1.4: Actualización de Servicios de Catálogo y Stock**
  - Adaptar `catalogService.ts` a los nuevos tipos sin `name` y con `sku` opcional.
  - Verificar `quantityStockService.ts` para `GET /quantity-stock` y `PATCH /quantity-stock/adjust`.

---

## Fase 1.5.2: Validación y Hooks de Dominio

- [x] **T1.5.2.1: Estado y Validación de Lotes (`hardwareDraft.ts` y `hardwareValidation.ts`)**
  - En `hardwareDraft.ts`, sustituir el árbol recursivo de componentes por la estructura plana `DraftBatchItem` (`catalogId`, `quantity`, `hasSerialNumbers`, `serialNumbers`, `costPrice`, `salePrice`).
  - En `hardwareValidation.ts`, implementar funciones puras para:
    - `findDuplicateSerials(serials: string[]): string[]` (insensible a mayúsculas/minúsculas).
    - `validateBatchItem(item: DraftBatchItem): string[]`.
    - Validación de cantidad de series vs cantidad numérica requerida.

- [x] **T1.5.2.2: Hook `useUnifiedStock`**
  - Crear `src/modules/inventory/hooks/useUnifiedStock.ts`.
  - Gestionar filtros (`locationId`, `categoryId`, `lowStock`), búsqueda y paginación sobre `GET /quantity-stock`.
  - Implementar carga bajo demanda de series para filas expandidas (`GET /hardware-items/available-serials`), almacenando las series en memoria por clave `${catalogId}:${locationId}`.
  - Implementar método para actualizar optimistamente o refrescar la fila tras dar de baja una serie o ajustar stock.

- [x] **T1.5.2.3: Hook `useUnifiedInbound`**
  - Crear `src/modules/inventory/hooks/useUnifiedInbound.ts`.
  - Manejar la lista de productos en el lote a ingresar al **Almacén Central**.
  - Proveer soporte para pistola lectora (agregación rápida de series).
  - Coordinar validación en vivo local (`findDuplicateSerials`) y validación remota contra `POST /hardware-items/validate-serials`.
  - Ejecutar el envío a `POST /inventory/inbound` y capturar `UnifiedInboundResponse`.

- [x] **T1.5.2.4: Hook `useBarcodeLabels`**
  - Crear `src/modules/inventory/hooks/useBarcodeLabels.ts`.
  - Administrar Modo A (etiquetas por modelo/SKU con copias) y Modo B (etiquetas por series seleccionadas).
  - Gestionar estado de generación, vista previa e impresión mediante `window.print()`.

- [x] **T1.5.2.5: Refactorización de `useHardwareScan`**
  - Limpiar `src/modules/inventory/hooks/useHardwareScan.ts`, eliminando `attachChildren`, `detachChild` y estados de componentes.
  - Mantener búsqueda por lector HID (`useBarcodeScanner`) y por código manual.

---

## Fase 1.5.3: Componentes Modales y de Soporte UI

- [x] **T1.5.3.1: Barra Superior Scanner-First (`ScannerQuickLookupBar.tsx`)**
  - Crear `src/modules/inventory/components/ScannerQuickLookupBar.tsx`.
  - Capturar lectura del lector HID o Enter sobre el input.
  - Consultar `GET /hardware-items/scan/:code` y mostrar tarjeta flotante o panel con: serie, estado, ubicación, precio de venta, acceso a **Hoja de Vida** y botón **Imprimir Etiqueta**.

- [x] **T1.5.3.2: Desplegable de Series en Stock (`ExpandableSerialsRow.tsx`)**
  - Crear `src/modules/inventory/components/ExpandableSerialsRow.tsx`.
  - Renderizar lista de series disponibles con su precio de venta y botones de acción:
    - Para todos: **Hoja de Vida** e **Imprimir Etiqueta 1D**.
    - Para `ADMIN` y `ENCARGADO_ALMACEN`: **Editar Precio/Ubicación** y **Dar de Baja**.

- [x] **T1.5.3.3: Modales Operativos de Series (`HardwareLifecycleModal` y `DecommissionItemModal`)**
  - Crear `HardwareLifecycleModal.tsx` para visualizar la cronología de eventos y auditoría de la serie (M6).
  - Crear `DecommissionItemModal.tsx` solicitando motivo obligatorio y llamando a `PATCH /hardware-items/:id/decommission`.

- [x] **T1.5.3.4: Modal de Ajuste de Stock por Cantidad (`AdjustStockModal.tsx`)**
  - Crear `AdjustStockModal.tsx` para `PATCH /quantity-stock/adjust`.
  - Campos: nueva cantidad y motivo obligatorio.
  - Mostrar el mensaje de error explícito retornado por el backend si falla por contener series activas (`400 Bad Request`).

- [x] **T1.5.3.5: Grilla Dinámica de Series (`SerialNumbersInputGrid.tsx`)**
  - Crear `src/modules/inventory/components/SerialNumbersInputGrid.tsx`.
  - Renderizar $N$ casillas según `quantity`.
  - Al presionar Enter en la casilla $i$, transferir automáticamente el foco a la casilla $i+1$.
  - Señalizar en vivo errores de formato, duplicados en el lote o series ya existentes en base de datos.

- [x] **T1.5.3.6: Modal Post-Ingreso para Etiquetas (`PostInboundPrintModal.tsx`)**
  - Crear `PostInboundPrintModal.tsx` mostrando el resumen del lote confirmado (`batchId`, total de unidades) y botones para imprimir inmediatamente las etiquetas generadas.

- [x] **T1.5.3.7: Modales de Catálogo y Segunda Mano (`CatalogProductFormModal`, `CategoryFormModal`, `CatalogStockDetailModal`, `ApproveUsedItemModal`)**
  - Crear `CatalogProductFormModal.tsx` sin campo `name`, con `brand` y `model` obligatorios y `sku` opcional.
  - Crear `CategoryFormModal.tsx` para alta y edición de categorías.
  - Crear `CatalogStockDetailModal.tsx` mostrando desglose de stock por ubicación (`GET /catalog/:id`).
  - Crear `ApproveUsedItemModal.tsx` para asignar ubicación y precio de venta a piezas de segunda mano pendientes (`POST /hardware-items/approve-used`).

- [x] **T1.5.3.8: Adaptación de `CatalogProductPicker.tsx`**
  - Eliminar referencias a `name` y mostrar las opciones formateadas como `${item.brand} ${item.model} · ${item.sku}`.

---

## Fase 1.5.4: Implementación de las 5 Sub-Pestañas (Pages)

- [x] **T1.5.4.1: Encabezado de Navegación por Pestañas (`InventoryTabsHeader.tsx`)**
  - Crear `src/modules/inventory/components/InventoryTabsHeader.tsx`.
  - Filtrar visualmente las 5 pestañas según el rol (`ADMIN`, `ENCARGADO_ALMACEN` acceden a las 5; `VENDEDOR`, `TECNICO` solo a Consultar y Etiquetas).

- [x] **T1.5.4.2: Sub-pestaña 1 — `InventoryConsultPage.tsx` (`/inventory/consult`)**
  - Crear `src/modules/inventory/pages/InventoryConsultPage.tsx`.
  - Integrar `ScannerQuickLookupBar` en la parte superior.
  - Integrar `UnifiedStockTable` con filtros de ubicación, categoría y stock bajo.
  - Integrar fila expandible `ExpandableSerialsRow` y modales de ciclo de vida, baja y ajuste de stock.

- [x] **T1.5.4.3: Sub-pestaña 2 — `InventoryLabelsPage.tsx` (`/inventory/labels`)**
  - Crear `src/modules/inventory/pages/InventoryLabelsPage.tsx`.
  - Implementar Modo A (por modelo/SKU y cantidad de copias) y Modo B (por series individuales).
  - Incluir vista previa e impresión de etiquetas 1D.

- [x] **T1.5.4.4: Sub-pestaña 3 — `InventoryInboundPage.tsx` (`/inventory/inbound`)**
  - Crear `src/modules/inventory/pages/InventoryInboundPage.tsx`.
  - Insignia fija: **Destino: Almacén Central**.
  - Formulario de construcción de lote con `CatalogProductPicker`, precios, cantidad y `SerialNumbersInputGrid`.
  - Resumen del lote y confirmación con `inboundInventory`.
  - Apertura de `PostInboundPrintModal` tras creación exitosa.

- [x] **T1.5.4.5: Sub-pestaña 4 — `InventoryCatalogPage.tsx` (`/inventory/catalog`)**
  - Crear `src/modules/inventory/pages/InventoryCatalogPage.tsx`.
  - Panel izquierdo con listado y gestión de categorías (`CategoryFormModal`).
  - Panel derecho con catálogo de productos sin `name`, buscador en tiempo real, `CatalogProductFormModal` y `CatalogStockDetailModal`.

- [x] **T1.5.4.6: Sub-pestaña 5 — `InventorySecondHandPage.tsx` (`/inventory/second-hand`)**
  - Crear `src/modules/inventory/pages/InventorySecondHandPage.tsx`.
  - Listar piezas con estado `SEGUNDA_MANO_PENDIENTE`.
  - Acciones para aprobar (`ApproveUsedItemModal`) o dar de baja (`DecommissionItemModal`).

---

## Fase 1.5.5: Enrutamiento, Layout y Navegación RBAC

- [x] **T1.5.5.1: Actualización de Constantes de Rutas (`routes.ts`)**
  - Definir:
    - `inventory: '/inventory'`
    - `inventoryConsult: '/inventory/consult'`
    - `inventoryLabels: '/inventory/labels'`
    - `inventoryInbound: '/inventory/inbound'`
    - `inventoryCatalog: '/inventory/catalog'`
    - `inventorySecondHand: '/inventory/second-hand'`

- [x] **T1.5.5.2: Soporte de Redirección en `RoleGuard.tsx`**
  - Añadir prop opcional `fallbackUrl?: string` a `RoleGuard`.
  - Si el usuario no tiene el rol permitido, redirigir a `fallbackUrl` (por defecto `ROUTES.unauthorized`).

- [x] **T1.5.5.3: Configuración del Enrutador (`router/index.tsx`)**
  - Configurar `/inventory` con `InventoryLayout`:
    - Redirección index `/inventory` -> `/inventory/consult`.
    - `/inventory/consult` accesible para todos los roles.
    - `/inventory/labels` accesible para todos los roles.
    - `/inventory/inbound` con `RoleGuard` (`ADMIN`, `ENCARGADO_ALMACEN`) y fallback a `/inventory/consult`.
    - `/inventory/catalog` con `RoleGuard` (`ADMIN`, `ENCARGADO_ALMACEN`) y fallback a `/inventory/consult`.
    - `/inventory/second-hand` con `RoleGuard` (`ADMIN`, `ENCARGADO_ALMACEN`) y fallback a `/inventory/consult`.
    - Redirecciones legacy `/inventory/stock` -> `/inventory/consult` y `/inventory/categories` -> `/inventory/catalog`.

- [x] **T1.5.5.4: Actualización de Menú Lateral y Shell (`navigation.ts` y `SidebarNav.tsx`)**
  - Añadir `'ENCARGADO_ALMACEN'` a los roles autorizados en `NAV_ITEMS` para `inventory` y `locations`.
  - Mantener estructura coherente en el menú lateral.

---

## Fase 1.5.6: Actualización de la Suite de Pruebas y Verificación Integral

- [x] **T1.5.6.1: Pruebas de Validación y Servicios**
  - Crear pruebas unitarias para `hardwareValidation.ts` (detección de duplicados, validación de lote).
  - Crear pruebas unitarias para `inventoryService.ts` (`POST /inventory/inbound`, `POST /inventory/barcode-labels/by-model`).
  - Actualizar pruebas de `hardwareItemService.test.ts`, `catalogService.test.ts` y `quantityStockService.test.ts`.

- [x] **T1.5.6.2: Pruebas de Páginas y Componentes de Inventario**
  - Crear pruebas de integración para `InventoryConsultPage.test.tsx` (tabla de stock, alerta stock bajo, expansión de series bajo demanda, búsqueda scanner).
  - Crear pruebas para `InventoryInboundPage.test.tsx` (pistoleo en grilla, validación de series, envío a Almacén Central, modal post-ingreso).
  - Crear pruebas para `InventoryLabelsPage.test.tsx` (generación modo modelo y modo series).
  - Crear pruebas para `InventoryCatalogPage.test.tsx` (formulario sin campo name, autogeneración de SKU).
  - Crear pruebas para `InventorySecondHandPage.test.tsx` (aprobación y baja de usados).

- [x] **T1.5.6.3: Pruebas de Navegación, RBAC y Rutas**
  - Actualizar `router.test.tsx` verificando que `ENCARGADO_ALMACEN` accede a las 5 sub-pestañas y que `VENDEDOR`/`TECNICO` son redirigidos a `/inventory/consult` al intentar acceder a rutas restringidas.
  - Actualizar `SidebarNav.test.tsx` y `UsersPage.test.tsx` validando el nuevo rol.

- [x] **T1.5.6.4: Verificación Integral de Compilación y Calidad**
  - Ejecutar verificación estricta de tipos de TypeScript (`npx tsc --noEmit`) con **0 errores**.
  - Ejecutar `npm test` con **100% de tests pasando** (sin regresiones).
  - Validar ausencia total de llamadas directas a Axios en `components/` y `pages/`.
  - Validar ausencia de referencias a `catalog.name` y Padre-Hijo en el código de producción.
