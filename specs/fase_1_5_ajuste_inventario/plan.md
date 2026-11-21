# Plan Técnico: Fase 1.5 — Rediseño UX de Inventario Unificado y Rol Encargado de Almacén

**Repositorio:** `frontend-web`  
**Rama:** `refact/inventario`  
**Fase:** 1.5 — Rediseño UX de Inventario Unificado y Rol Encargado de Almacén  
**Documentos de referencia:**  
- `specs/constitution.md` (Constitución Técnica Frontend)  
- `specs/fase_1_5_ajuste_inventario/spec.md` (Especificación Funcional de la Fase 1.5)  
- `specs/fase_0_core/` y `specs/fase_1_core/` (Línea base existente)  
- `backend-api/specs/API_CONTRACTS.md` (Contratos de API del Backend)  

---

## 1. Resumen Ejecutivo y Objetivos

Este plan técnico define la estrategia de refactorización integral del módulo `inventory` y los ajustes transversales en `foundation`, `router` y `components` para alinearse con los contratos unificados del backend y transformar la experiencia operativa del almacén.

### Objetivos principales:
1. **Incorporar el rol `ENCARGADO_ALMACEN`**: Expandir el sistema de roles RBAC en `foundation`, guards, menús y formularios para otorgar permisos operativos completos sobre inventario al encargado de almacén.
2. **Eliminar `catalog.name`**: Desacoplar el catálogo de nombres genéricos, identificando unívocamente cada modelo maestro por `brand` + `model` + `sku` + especificaciones técnicas, y permitiendo la autogeneración del SKU en el backend (`sku` opcional en creación).
3. **Erradicar la jerarquía Padre-Hijo**: Eliminar completamente las interfaces, borradores, endpoints y componentes de acoplamiento chasis-componente (`parentChassisId`, `children`, `/children`, `batch-inbound`), tratando cada equipo o pieza como ítem autónomo en stock.
4. **Migración hacia Endpoints Unificados**: Implementar la arquitectura de 5 sub-pestañas operativas soportadas por:
   - `POST /inventory/inbound` (ingreso unificado mixto al Almacén Central).
   - `POST /inventory/barcode-labels/by-model` (generación de etiquetas 1D por SKU de catálogo).
   - `GET /hardware-items/available-serials` (consulta bajo demanda de números de serie disponibles en stock).

---

## 2. Auditoría y Mapeo de Archivos Afectados

A continuación se detalla el análisis de impacto archivo por archivo en el código existente:

### 2.1. Impacto 1: Rol `ENCARGADO_ALMACEN`
| Archivo | Ubicación | Modificación requerida |
|---|---|---|
| `models.ts` | `src/modules/foundation/auth/` | Actualizar `type Role = 'ADMIN' \| 'ENCARGADO_ALMACEN' \| 'VENDEDOR' \| 'TECNICO'`. |
| `roleLabels.ts` | `src/modules/foundation/auth/` | Añadir `ENCARGADO_ALMACEN: 'Encargado de almacén'`. |
| `models.ts` | `src/modules/foundation/users/` | Adopta el nuevo `Role` para `CreateUserInput` y `UpdateUserInput`. |
| `UsersPage.tsx` | `src/modules/foundation/users/pages/` | Añadir `'ENCARGADO_ALMACEN'` a `ROLE_OPTIONS` para creación/edición de usuarios. |
| `navigation.ts` | `src/components/layout/` | Añadir `'ENCARGADO_ALMACEN'` en roles permitidos de `inventory` y `locations`. |
| `RoleGuard.tsx` | `src/router/` | Soportar `fallbackUrl?: string` para redirigir a `/inventory/consult` en rutas denegadas de inventario en lugar de `/unauthorized`. |
| `routes.ts` | `src/router/` | Registrar constantes de sub-rutas: `inventoryConsult`, `inventoryLabels`, `inventoryInbound`, `inventoryCatalog`, `inventorySecondHand`. |
| `index.tsx` | `src/router/` | Configurar rutas protegidas de inventario con roles correspondientes y redirección por defecto de `/inventory` a `/inventory/consult`. |
| `Can.tsx` / `useHasRole.ts` | `src/components/guards/` | Reutilizar para habilitar acciones mutativas en `ADMIN` y `ENCARGADO_ALMACEN`. |

### 2.2. Impacto 2: Eliminación de `catalog.name`
| Archivo | Ubicación | Modificación requerida |
|---|---|---|
| `catalogModels.ts` | `src/modules/inventory/` | Eliminar `name: string;` de `CatalogItem`, `CreateCatalogInput`, `UpdateCatalogInput`. Hacer `sku?: string` opcional al crear. |
| `hardwareModels.ts` | `src/modules/inventory/` | Eliminar `catalogName?: string;`. Incorporar `catalogBrand`, `catalogModel`, `catalogSku`. |
| `quantityModels.ts` | `src/modules/inventory/` | Eliminar `catalogName?: string;`. Incorporar `catalogBrand`, `catalogModel`, `catalogSku`. |
| `catalogService.ts` | `src/modules/inventory/services/` | Actualizar firmas y payloads que ya no reciben `name`. |
| `CatalogForm.tsx` / `CatalogProductFormModal.tsx` | `src/modules/inventory/components/` | Eliminar input y validación de `name`. Requerir `brand` y `model`. Placeholder de autogeneración para `sku`. |
| `CatalogProductPicker.tsx` | `src/modules/inventory/components/` | Formatear visualización y accesibilidad como `${item.brand} ${item.model} · ${item.sku}`. |
| `CatalogDetailPanel.tsx` / `CatalogStockDetailModal.tsx` | `src/modules/inventory/components/` | Mostrar encabezado de producto como `${brand} ${model}`. |
| `UnifiedStockTable.tsx` | `src/modules/inventory/components/` | Columna principal muestra `${catalogBrand} ${catalogModel}` y `${catalogSku}`. |
| `CatalogPage.tsx` / `InventoryCatalogPage.tsx` | `src/modules/inventory/pages/` | Reemplazar celdas y títulos que usaban `item.name` por `${item.brand} ${item.model}`. |
| `selectCatalogProduct.ts` | `src/test/` | Actualizar selector helper a formato `${brand} ${model} · ${sku}`. |

### 2.3. Impacto 3: Eliminación de Jerarquía Padre-Hijo (Parent-Child)
| Archivo | Ubicación | Modificación requerida |
|---|---|---|
| `hardwareModels.ts` | `src/modules/inventory/` | Eliminar `parentChassisId`, `components`, `parentChassis` de `HardwareItem`. Eliminar `InboundComponent`, `InboundItem`, `BatchInboundInput`. |
| `hardwareDraft.ts` | `src/modules/inventory/` | Eliminar `children: DraftHardware[]`. Reemplazar por estructura plana de borrador de lote de ingreso unificado. |
| `hardwareValidation.ts` | `src/modules/inventory/` | Implementar validaciones puras: duplicados de series en lote, cantidad de series vs cantidad numérica requerida. |
| `hardwareItemService.ts` | `src/modules/inventory/services/` | Eliminar `batchInbound`, `attachChildren` y `detachChild`. |
| `useHardwareScan.ts` | `src/modules/inventory/hooks/` | Eliminar estados de acoplar/desacoplar componentes y llamadas a endpoints `/children`. |
| `InboundItemFields.tsx` | `src/modules/inventory/components/` | Reemplazar por `SerialNumbersInputGrid.tsx` sin árboles anidados de componentes. |
| `InventoryPage.tsx` | `src/modules/inventory/pages/` | Eliminar sección visual de "Componentes asociados", "Acoplar componentes" y "Desacoplar". |

### 2.4. Impacto 4: Migración hacia Endpoints Unificados
| Archivo | Ubicación | Modificación requerida |
|---|---|---|
| `hardwareModels.ts` / `quantityModels.ts` | `src/modules/inventory/` | Definir `UnifiedInboundPayload`, `UnifiedInboundResponse`, `AvailableSerial`, `BarcodeLabelItem`. |
| `hardwareItemService.ts` / `inventoryService.ts` | `src/modules/inventory/services/` | Añadir: `inboundInventory` (`POST /inventory/inbound`), `getAvailableSerials` (`GET /hardware-items/available-serials`), `getHardwareLifecycle` (`GET /hardware-items/:id/lifecycle`), `decommissionHardwareItem` (`PATCH /hardware-items/:id/decommission`), `updateHardwareItem` (`PATCH /hardware-items/:id`), `approveUsedItem` (`POST /hardware-items/approve-used`), `listPendingSecondHand` (`GET /hardware-items?status=SEGUNDA_MANO_PENDIENTE`). |
| `barcodeLabelService.ts` | `src/modules/inventory/services/` | Añadir: `getBarcodeLabelsByModel` (`POST /inventory/barcode-labels/by-model`), `getSingleBarcodeLabel` (`GET /hardware-items/:id/barcode-label`). |
| `quantityStockService.ts` | `src/modules/inventory/services/` | Mantener `listQuantityStock` (`GET /quantity-stock`) y `adjustQuantityStock` (`PATCH /quantity-stock/adjust`). |
| `useUnifiedStock.ts` | `src/modules/inventory/hooks/` | **Nuevo hook**: consulta paginada de stock, filtro stock bajo, carga de series bajo demanda con caché local por fila expandida. |
| `useUnifiedInbound.ts` | `src/modules/inventory/hooks/` | **Nuevo hook**: gestión del carrito/lote de ingreso mixto, validación en vivo local y remota (`POST /hardware-items/validate-serials`), envío a `POST /inventory/inbound`. |
| `useBarcodeLabels.ts` | `src/modules/inventory/hooks/` | **Nuevo hook**: generación de etiquetas 1D Modo A (por modelo) y Modo B (por series). |

---

## 3. Arquitectura y Estructura Modular

Siguiendo la Constitución Técnica (Sección 3 y 5) y la Spec 1.5, el código se organiza estrictamente respetando las capas:

```text
src/
├── modules/
│   ├── foundation/
│   │   ├── auth/models.ts                   # Role: + 'ENCARGADO_ALMACEN'
│   │   ├── auth/roleLabels.ts               # ROLE_LABELS: + 'Encargado de almacén'
│   │   └── users/pages/UsersPage.tsx        # ROLE_OPTIONS: + 'ENCARGADO_ALMACEN'
│   │
│   └── inventory/
│       ├── catalogModels.ts                 # CatalogItem sin name, CreateCatalogInput con sku?
│       ├── hardwareModels.ts                # UnifiedInboundPayload, AvailableSerial, BarcodeLabelItem, sin children
│       ├── hardwareDraft.ts                 # DraftUnifiedItem (lote de ingreso unificado plano)
│       ├── hardwareValidation.ts            # Validaciones puras de series y lotes
│       ├── quantityModels.ts                # QuantityStockItem con catalogBrand/Model/Sku, sin catalogName
│       ├── models.ts                        # Re-exportaciones y Category models
│       │
│       ├── services/
│       │   ├── catalogService.ts            # CRUD catálogo y categorías
│       │   ├── categoryService.ts          # CRUD categorías
│       │   ├── inventoryService.ts          # POST /inventory/inbound, POST /inventory/barcode-labels/by-model
│       │   ├── hardwareItemService.ts       # scan, available-serials, lifecycle, decommission, approve-used
│       │   ├── quantityStockService.ts      # GET /quantity-stock, PATCH /quantity-stock/adjust
│       │   └── barcodeLabelService.ts       # Labels batch y single
│       │
│       ├── hooks/
│       │   ├── useUnifiedStock.ts           # Consulta paginada + carga bajo demanda de series
│       │   ├── useUnifiedInbound.ts         # Construcción y validación de lote mixto
│       │   ├── useBarcodeLabels.ts          # Generación de etiquetas 1D por modelo y series
│       │   ├── useHardwareScan.ts           # Búsqueda scanner-first simple
│       │   ├── useCatalog.ts                # Búsqueda y paginación de catálogo
│       │   └── useCategories.ts             # Listado de categorías
│       │
│       ├── components/
│       │   ├── InventoryTabsHeader.tsx      # Barra de 5 sub-pestañas con control RBAC
│       │   ├── ScannerQuickLookupBar.tsx    # Barra superior rápida scanner-first con tarjeta de resultado
│       │   ├── UnifiedStockTable.tsx        # Tabla maestra con alerta de stock bajo
│       │   ├── ExpandableSerialsRow.tsx     # Desplegable de series en stock bajo demanda
│       │   ├── HardwareLifecycleModal.tsx   # Modal de hoja de vida (M6)
│       │   ├── DecommissionItemModal.tsx    # Modal de baja lógica con motivo
│       │   ├── AdjustStockModal.tsx         # Modal de ajuste de stock por cantidad
│       │   ├── SerialNumbersInputGrid.tsx   # Grilla dinámica de N inputs con foco automático (pistola)
│       │   ├── PostInboundPrintModal.tsx    # Modal post-ingreso para impresión de etiquetas del lote
│       │   ├── CategoryFormModal.tsx        # Modal crear/editar categoría
│       │   ├── CatalogProductFormModal.tsx  # Modal crear/editar producto maestro sin name
│       │   ├── CatalogStockDetailModal.tsx  # Modal detalle de stock por ubicación
│       │   ├── ApproveUsedItemModal.tsx     # Modal aprobar pieza de segunda mano
│       │   └── CatalogProductPicker.tsx     # Selector autocompletable (brand + model + sku)
│       │
│       └── pages/
│           ├── InventoryConsultPage.tsx     # Sub-pestaña 1: Consultar Inventario + Scanner Bar
│           ├── InventoryLabelsPage.tsx      # Sub-pestaña 2: Centro de Etiquetas 1D (Modelo y Series)
│           ├── InventoryInboundPage.tsx     # Sub-pestaña 3: Ingreso Unificado al Almacén Central
│           ├── InventoryCatalogPage.tsx     # Sub-pestaña 4: Catálogo Maestro y Categorías
│           └── InventorySecondHandPage.tsx  # Sub-pestaña 5: Piezas de Segunda Mano Pendientes
│
├── router/
│   ├── routes.ts                            # Constantes ROUTES con sub-rutas de inventario
│   ├── RoleGuard.tsx                        # Guard con soporte fallbackUrl
│   └── index.tsx                            # Rutas hijas de /inventory y redirecciones
│
└── components/
    └── layout/
        └── navigation.ts                    # Menú lateral con rol ENCARGADO_ALMACEN
```

### 3.1. Conectividad y Persistencia (Constitución 9 y 9.5)
- **Modo:** `Online-required`. Todas las peticiones van directamente a `backend-api` mediante Axios.
- **Persistencia local:** Ninguna en esta fase (Dexie.js e IndexedDB aplazados para Fase Offline-First).
- **Sesión:** JWT Bearer se gestiona exclusivamente en `sessionStorage`.

---

## 4. Modelos de Dominio y Contratos TypeScript (`*Models.ts`)

### 4.1. `src/modules/inventory/catalogModels.ts`
```typescript
export interface Category {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
  productsCount?: number;
  createdAt: string;
}

export interface CatalogItem {
  id: string;
  sku: string;
  brand: string;
  model: string;
  categoryId: string;
  processor: string | null;
  ramCapacity: string | null;
  storageCapacity: string | null;
  gpu: string | null;
  screenSize: string | null;
  isSerialized: boolean;
  minStockThreshold: number;
  basePrice: number;
  isSecondHand: boolean;
  active: boolean;
  createdAt: string;
}

export interface CreateCatalogItemPayload {
  sku?: string; // Opcional: el backend autogenera MP-CAT-XXXXXX si se omite
  brand: string;
  model: string;
  categoryId: string;
  processor?: string;
  ramCapacity?: string;
  storageCapacity?: string;
  gpu?: string;
  screenSize?: string;
  isSerialized?: boolean;
  minStockThreshold?: number;
  basePrice: number;
  isSecondHand?: boolean;
  active?: boolean;
}

export type UpdateCatalogItemPayload = Partial<Omit<CreateCatalogItemPayload, 'sku' | 'isSerialized'>>;

export interface CatalogQuery {
  categoryId?: string;
  active?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CatalogPageResult {
  items: CatalogItem[];
  total: number;
  page: number;
  limit: number;
}

export interface CatalogDetail {
  item: CatalogItem;
  categoryName: string;
  stockSummary: {
    locationId: string;
    locationName: string;
    locationType: string;
    serializedCount: number;
    quantityCount: number;
    totalAvailable: number;
  }[];
  totalStockOverall: number;
}
```

### 4.2. `src/modules/inventory/hardwareModels.ts`
```typescript
export type ItemStatus =
  | 'EN_STOCK'
  | 'VENDIDO'
  | 'SEGUNDA_MANO_PENDIENTE'
  | 'EN_GARANTIA'
  | 'DE_BAJA';

export interface HardwareItem {
  id: string;
  serialNumber: string;
  catalogId: string;
  catalogBrand?: string;
  catalogModel?: string;
  catalogSku?: string;
  locationId: string;
  locationName?: string;
  status: ItemStatus;
  costPrice: number | null;
  salePrice: number | null;
  isSecondHand?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UnifiedInboundItemPayload {
  catalogId: string;
  quantity: number;
  hasSerialNumbers: boolean;
  serialNumbers?: string[];
  costPrice?: number;
  salePrice?: number;
}

export interface UnifiedInboundPayload {
  items: UnifiedInboundItemPayload[];
  notes?: string;
}

export interface UnifiedInboundResultItem {
  catalogId: string;
  catalogSku: string;
  catalogBrand: string;
  catalogModel: string;
  quantity: number;
  hasSerialNumbers: boolean;
  serialsCreated: string[];
  totalStockResulting: number;
}

export interface UnifiedInboundResponse {
  batchId: string;
  locationId: string;
  locationName: string;
  totalItems: number;
  totalUnits: number;
  results: UnifiedInboundResultItem[];
  createdAt: string;
}

export interface AvailableSerial {
  id: string;
  serialNumber: string;
  catalogId: string;
  locationId: string;
  salePrice: number | null;
  createdAt: string;
}

export interface BarcodeLabelItem {
  hardwareItemId?: string;
  catalogId?: string;
  barcodeValue: string;
  title: string;
  specsSummary: string;
  locationName: string;
  price: number;
  copyNumber?: number;
  totalCopies?: number;
}

export interface SerialValidationResponse {
  existingSerials: string[];
  allValid: boolean;
}

export interface HardwareLifecycleEntry {
  id: string;
  action: string;
  description: string;
  userName: string;
  locationName?: string;
  timestamp: string;
}

export interface HardwareLifecycleResponse {
  hardwareItem: HardwareItem;
  lifecycle: HardwareLifecycleEntry[];
}
```

### 4.3. `src/modules/inventory/quantityModels.ts`
```typescript
export interface QuantityStockItem {
  id: string;
  catalogId: string;
  catalogBrand: string;
  catalogModel: string;
  catalogSku: string;
  locationId: string;
  locationName: string;
  quantity: number;
  costPrice: number | null;
  salePrice: number | null;
  minStockThreshold: number;
  isLowStock: boolean;
  updatedAt: string;
}

export interface QuantityStockPageResult {
  items: QuantityStockItem[];
  total: number;
  page: number;
  limit: number;
}

export interface QuantityStockQuery {
  locationId?: string;
  categoryId?: string;
  catalogItemId?: string;
  lowStock?: boolean;
  page?: number;
  limit?: number;
}

export interface AdjustQuantityStockInput {
  catalogId: string;
  locationId: string;
  newQuantity: number;
  reason: string;
}
```

### 4.4. `src/modules/inventory/hardwareDraft.ts` & `hardwareValidation.ts`
```typescript
// hardwareDraft.ts
export interface DraftBatchItem {
  id: string; // id temporal para React keys
  catalogId: string;
  catalog?: CatalogItem | null;
  quantity: number;
  hasSerialNumbers: boolean;
  serialNumbers: string[];
  costPrice: string;
  salePrice: string;
}

// hardwareValidation.ts
export function findDuplicateSerials(serials: string[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const raw of serials) {
    const s = raw.trim();
    if (!s) continue;
    if (seen.has(s.toUpperCase())) {
      duplicates.add(s);
    } else {
      seen.add(s.toUpperCase());
    }
  }
  return [...duplicates];
}

export function validateBatchItem(item: DraftBatchItem): string[] {
  const errors: string[] = [];
  if (!item.catalogId) errors.push('Debes seleccionar un producto.');
  if (item.quantity <= 0) errors.push('La cantidad debe ser mayor a 0.');
  if (item.hasSerialNumbers) {
    const filledSerials = item.serialNumbers.map(s => s.trim()).filter(Boolean);
    if (filledSerials.length !== item.quantity) {
      errors.push(`Se requieren exactamente ${item.quantity} números de serie (${filledSerials.length} ingresados).`);
    }
    const dups = findDuplicateSerials(filledSerials);
    if (dups.length > 0) {
      errors.push(`Series duplicadas en este producto: ${dups.join(', ')}`);
    }
  }
  return errors;
}
```

---

## 5. Servicios HTTP e Infraestructura (`services/`)

Todos los servicios consumen `apiClient` desde `src/services/api/axiosInstance.ts`:

1. **`src/modules/inventory/services/inventoryService.ts`**:
   - `inboundInventory(payload: UnifiedInboundPayload): Promise<UnifiedInboundResponse>`  
     `POST /inventory/inbound`
   - `getBarcodeLabelsByModel(payload: { catalogId: string; locationId?: string; copies: number }): Promise<BarcodeLabelItem[]>`  
     `POST /inventory/barcode-labels/by-model`

2. **`src/modules/inventory/services/hardwareItemService.ts`**:
   - `getAvailableSerials(params: { catalogId: string; locationId: string }, signal?: AbortSignal): Promise<AvailableSerial[]>`  
     `GET /hardware-items/available-serials`
   - `scanHardware(code: string, signal?: AbortSignal): Promise<HardwareItem>`  
     `GET /hardware-items/scan/:code`
   - `validateSerials(serialNumbers: string[]): Promise<SerialValidationResponse>`  
     `POST /hardware-items/validate-serials`
   - `getHardwareLifecycle(id: string, signal?: AbortSignal): Promise<HardwareLifecycleResponse>`  
     `GET /hardware-items/:id/lifecycle`
   - `decommissionHardwareItem(id: string, reason: string): Promise<HardwareItem>`  
     `PATCH /hardware-items/:id/decommission`
   - `updateHardwareItem(id: string, payload: { salePrice?: number; locationId?: string }): Promise<HardwareItem>`  
     `PATCH /hardware-items/:id`
   - `listPendingSecondHand(signal?: AbortSignal): Promise<HardwareItem[]>`  
     `GET /hardware-items?status=SEGUNDA_MANO_PENDIENTE`
   - `approveUsedItem(payload: { hardwareItemId: string; locationId: string; salePrice: number }): Promise<HardwareItem>`  
     `POST /hardware-items/approve-used`

3. **`src/modules/inventory/services/barcodeLabelService.ts`**:
   - `getBatchLabels(hardwareItemIds: string[]): Promise<BarcodeLabelItem[]>`  
     `POST /hardware-items/barcode-labels/batch`
   - `getSingleBarcodeLabel(id: string): Promise<BarcodeLabelItem>`  
     `GET /hardware-items/:id/barcode-label`

4. **`src/modules/inventory/services/quantityStockService.ts`**:
   - `listQuantityStock(query: QuantityStockQuery, signal?: AbortSignal): Promise<QuantityStockPageResult>`  
     `GET /quantity-stock`
   - `adjustQuantityStock(payload: AdjustQuantityStockInput): Promise<QuantityStockItem>`  
     `PATCH /quantity-stock/adjust`

5. **`src/modules/inventory/services/catalogService.ts`**:
   - `listCatalog`, `getCatalogDetail`, `createCatalogItem`, `updateCatalogItem`, `setCatalogActive`.

6. **`src/modules/inventory/services/categoryService.ts`**:
   - `listCategories`, `createCategory`, `updateCategory`.

---

## 6. Hooks de Aplicación y Dominio (`hooks/`)

### 6.1. `useUnifiedStock.ts`
- **Responsabilidad:** Administrar la consulta de `GET /quantity-stock` con debounce en búsqueda, filtros (`locationId`, `categoryId`, `lowStock`) y paginación.
- **Carga bajo demanda de series:** Mantiene un registro en memoria `record<string, { loading: boolean; error: string | null; serials: AvailableSerial[] }>` indexado por `${catalogId}:${locationId}`. Al invocar `toggleExpand(catalogId, locationId)`, si no se han cargado las series, invoca `getAvailableSerials`. Al dar de baja un ítem, actualiza la lista local y decrementa la cantidad en la fila principal sin recargar toda la tabla.

### 6.2. `useUnifiedInbound.ts`
- **Responsabilidad:** Manejar la construcción del lote mixto (`items: DraftBatchItem[]`), notas del lote, validaciones locales en vivo y consulta a `POST /hardware-items/validate-serials`.
- **Flujo:**
  1. Selección de producto desde catálogo. Pre-rellena `salePrice` con `basePrice` y setea `hasSerialNumbers` según `isSerialized`.
  2. Al agregar series, `SerialNumbersInputGrid` avanza el foco con Enter al escanear.
  3. `addItemToBatch` valida que no existan duplicados internos con ítems previos.
  4. `submitBatch` envía `{ items, notes }` a `POST /inventory/inbound`.
  5. Al recibir respuesta exitosa, resetea el borrador y entrega `response: UnifiedInboundResponse` para abrir inmediatamente `PostInboundPrintModal`.

### 6.3. `useBarcodeLabels.ts`
- **Responsabilidad:** Controlar la generación de etiquetas en ambos modos:
  - **Modo A (Por Modelo):** Selección de producto, cantidad de copias (`copies`), ubicación opcional. Invoca `getBarcodeLabelsByModel`.
  - **Modo B (Por Series):** Cola de ítems escaneados o seleccionados (`hardwareItemIds`). Invoca `getBatchLabels`.
  - Permite invocar el diálogo de impresión con vista previa CSS optimizada para impresoras de etiquetas 1D.

---

## 7. Componentes y Sub-Pestañas (`components/` y `pages/`)

### 7.1. Navegación por Sub-Pestañas: `InventoryTabsHeader.tsx`
Renderiza la barra superior de 5 pestañas:
1. **Consultar Inventario** (`/inventory/consult`) — Roles: Todos.
2. **Etiquetas 1D (Barras)** (`/inventory/labels`) — Roles: Todos.
3. **Ingreso al Almacén** (`/inventory/inbound`) — Roles: `ADMIN`, `ENCARGADO_ALMACEN`.
4. **Catálogo y Categorías** (`/inventory/catalog`) — Roles: `ADMIN`, `ENCARGADO_ALMACEN`.
5. **Segunda Mano Pendiente** (`/inventory/second-hand`) — Roles: `ADMIN`, `ENCARGADO_ALMACEN`.

### 7.2. Sub-pestaña 1: `InventoryConsultPage.tsx`
- **`ScannerQuickLookupBar.tsx`**: Barra superior para pistoleo inmediato (`useBarcodeScanner` o Enter) invocando `GET /hardware-items/scan/:code`. Despliega tarjeta rápida con Hoja de Vida e Imprimir Etiqueta.
- **`UnifiedStockTable.tsx`**: Tabla con filtros de ubicación, categoría y switch `Solo stock bajo`. Muestra `${catalogBrand} ${catalogModel}`, SKU, ubicación, cantidad con badge de advertencia si `isLowStock`, precio de venta y botón expandir series.
- **`ExpandableSerialsRow.tsx`**: Fila desplegable que renderiza la lista de series cargadas bajo demanda.
- **Modales integrados:**
  - `HardwareLifecycleModal.tsx` (consultable por todos los roles).
  - `DecommissionItemModal.tsx` (exclusivo `ADMIN` y `ENCARGADO_ALMACEN`).
  - `AdjustStockModal.tsx` (exclusivo `ADMIN` y `ENCARGADO_ALMACEN`, maneja errores `400 Bad Request` si el producto tiene series activas).

### 7.3. Sub-pestaña 2: `InventoryLabelsPage.tsx`
- Tab interactivo:
  - **Modo A (Por Modelo / Cantidad):** Selector de producto (`CatalogProductPicker`), número de copias ($\ge 1$), ubicación opcional. Botón "Generar Etiquetas" llama a `POST /inventory/barcode-labels/by-model`.
  - **Modo B (Por Series):** Buscador o pistola lectora para agregar equipos en stock a una lista de impresión. Botón "Generar Etiquetas" llama a `POST /hardware-items/barcode-labels/batch`.
- Panel de vista previa de etiquetas generadas con botón `Imprimir` (`window.print()`).

### 7.4. Sub-pestaña 3: `InventoryInboundPage.tsx`
- Destino fijo: insignia visual **"Destino: Almacén Central"**.
- Formulario de armado de ítem:
  - Producto (`CatalogProductPicker`).
  - Cantidad, Costo Unitario, Precio de Venta.
  - Checkbox "Ingresar números de serie individuales".
  - **`SerialNumbersInputGrid.tsx`**: renderiza $N$ inputs. Al presionar Enter en el input $i$, traslada el foco automáticamente al input $i+1$. Validación en vivo de duplicados en el lote y consulta asíncrona a `validateSerials`.
- Lista resumen del lote antes de confirmar.
- Botón "Confirmar Ingreso al Almacén" -> `inboundInventory`.
- **`PostInboundPrintModal.tsx`**: se abre al recibir `201 Created`, mostrando total de unidades ingresadas, series creadas y botón directo para imprimir sus etiquetas 1D.

### 7.5. Sub-pestaña 4: `InventoryCatalogPage.tsx`
- Diseño dividido en dos paneles:
  - **Izquierdo (Categorías):** Lista categorías con estado y `productsCount`. Botón "Nueva Categoría" abre `CategoryFormModal.tsx`.
  - **Derecho (Catálogo Maestro):** Buscador, filtro por categoría y tabla de modelos.
- **`CatalogProductFormModal.tsx`**:
  - **Sin campo `name`**.
  - Obligatorios: `brand`, `model`, `categoryId`, `basePrice`.
  - Opcional: `sku` con placeholder *"Dejar vacío para autogenerar MP-CAT-XXXXXX"*, especificaciones técnicas (`processor`, `ramCapacity`, etc.), `isSerialized`, `minStockThreshold`.
- **`CatalogStockDetailModal.tsx`**: desglose de stock por almacén y puestos (`GET /catalog/:id`).

### 7.6. Sub-pestaña 5: `InventorySecondHandPage.tsx`
- Consulta `GET /hardware-items?status=SEGUNDA_MANO_PENDIENTE`.
- Lista piezas usadas pendientes de aprobación técnica/almacén.
- **`ApproveUsedItemModal.tsx`**: Solicita ubicación (`locationId`) y precio de venta (`salePrice`). Envía `POST /hardware-items/approve-used`.
- **`DecommissionItemModal.tsx`**: Permite descartar la pieza con motivo obligatorio (`PATCH /hardware-items/:id/decommission`).

---

## 8. Enrutamiento y Control de Acceso (RBAC)

### 8.1. Matriz de Acceso
| Ruta | Componente | Roles Autorizados | Fallback / Redirección |
|---|---|---|---|
| `/inventory` | Redirección | Todos | Redirige a `/inventory/consult` |
| `/inventory/consult` | `InventoryConsultPage` | `ADMIN`, `ENCARGADO_ALMACEN`, `VENDEDOR`, `TECNICO` | `/login` si no autenticado |
| `/inventory/labels` | `InventoryLabelsPage` | `ADMIN`, `ENCARGADO_ALMACEN`, `VENDEDOR`, `TECNICO` | `/login` si no autenticado |
| `/inventory/inbound` | `InventoryInboundPage` | `ADMIN`, `ENCARGADO_ALMACEN` | Redirige a `/inventory/consult` |
| `/inventory/catalog` | `InventoryCatalogPage` | `ADMIN`, `ENCARGADO_ALMACEN` | Redirige a `/inventory/consult` |
| `/inventory/second-hand` | `InventorySecondHandPage` | `ADMIN`, `ENCARGADO_ALMACEN` | Redirige a `/inventory/consult` |
| `/inventory/stock` | Redirección legacy | Todos | Redirige a `/inventory/consult` |
| `/inventory/categories` | Redirección legacy | Todos | Redirige a `/inventory/catalog` |

---

## 9. Estrategia de Pruebas y Validación

1. **Pruebas Unitarias de Modelos y Validación:**
   - Validar que `hardwareValidation.ts` detecta duplicados case-insensitive, valida longitud exacta de series y maneja strings vacíos.
2. **Pruebas Unitarias de Servicios:**
   - Verificar payloads exactos a `/inventory/inbound`, `/inventory/barcode-labels/by-model`, `/hardware-items/available-serials`.
   - Verificar codificación de URIs y parámetros opcionales.
3. **Pruebas de Componentes y Páginas:**
   - `InventoryConsultPage.test.tsx`: renderizado de tabla, expansión bajo demanda de series, badges de stock bajo y llamada al modal de ajuste.
   - `InventoryInboundPage.test.tsx`: validación de inputs de series, avance de foco con Enter, agregación al lote y post-modal de impresión.
   - `InventoryLabelsPage.test.tsx`: generación de etiquetas por modelo y por series.
   - `InventoryCatalogPage.test.tsx`: formulario de producto sin campo `name` y autogeneración de SKU.
   - `InventorySecondHandPage.test.tsx`: aprobación de piezas usadas y baja con motivo.
4. **Pruebas de Navegación y RBAC:**
   - `SidebarNav.test.tsx` y `router.test.tsx`: verificar que `ENCARGADO_ALMACEN` tiene acceso completo a las 5 sub-pestañas y que `VENDEDOR`/`TECNICO` son redirigidos a `/inventory/consult` si intentan acceder a las sub-pestañas restringidas.
5. **Compilación y Linteo:**
   - `npx tsc --noEmit` con **0 errores**.
   - `npm test` con **100% de tests pasando**.
