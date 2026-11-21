# Especificación Frontend — Fase Intermedia (1.5): Rediseño UX de Inventario Unificado y Rol Encargado de Almacén

## 1. Objetivo y Alcance
Refactorizar los módulos `foundation` (Fase 0) e `inventory` (Fase 1) en `frontend-web/` para alinearlos con los contratos actualizados del backend (`API_CONTRACTS.md` Fase 1.5) y simplificar la operación diaria del almacén:
1. Incorporar el nuevo rol `ENCARGADO_ALMACEN` en `src/modules/foundation/`, guards de rutas, menú lateral y gestión de usuarios.
2. Eliminar el campo `name` del catálogo maestro en `catalogModels.ts` y vistas asociadas (identificando cada modelo por `brand` + `model` + `sku` + especificaciones técnicas) y remover toda interfaz o borrador de jerarquía Padre-Hijo (`parentChassisId` / `children`) en `hardwareDraft.ts`, `hardwareModels.ts` y `hardwareValidation.ts`.
3. Reemplazar los formularios dispersos de ingreso por una interfaz clara dividida en **5 sub-pestañas por flujo de trabajo**, conectada a los endpoints unificados (`POST /inventory/inbound`, `POST /inventory/barcode-labels/by-model`, `GET /hardware-items/available-serials`).

### Alcance de Conectividad (Constitución Secciones 9 y 9.5)
- **Clasificación de operaciones:** Todas las operaciones de esta Fase 1.5 son **`Online-required`** (requieren conexión activa con `backend-api`).
- **Persistencia local:** No se utiliza Dexie.js, IndexedDB ni colas offline en esta fase (aplazado para la fase Offline-First). El token JWT se mantiene exclusivamente en `sessionStorage`.

---

## 2. Arquitectura y Estructura del Proyecto (`frontend-web/src/`)

Respetando la estructura existente del proyecto y la separación entre **Presentación (`pages/`, `components/`)**, **Aplicación/Dominio (`hooks/`, `*Models.ts`, `*Draft.ts`, `*Validation.ts`)** e **Infraestructura (`services/`)**:

```text
frontend-web/src/
├── modules/
│   ├── foundation/                          # Fase 0: Auth, Users, Locations, AuditLogs
│   │   └── ...                              # Agregar rol 'ENCARGADO_ALMACEN' en tipos, selector de usuarios y guards
│   └── inventory/                           # Fase 1 & 1.5: Inventario Unificado
│       ├── pages/
│       │   ├── InventoryConsultPage.tsx     # Sub-pestaña 1: Consultar Inventario + Scanner-First
│       │   ├── InventoryLabelsPage.tsx      # Sub-pestaña 2: Centro de Etiquetas 1D (Por Modelo y Por Series)
│       │   ├── InventoryInboundPage.tsx     # Sub-pestaña 3: Ingreso Unificado a Almacén Central
│       │   ├── InventoryCatalogPage.tsx     # Sub-pestaña 4: Catálogo Maestro y Categorías
│       │   └── InventorySecondHandPage.tsx  # Sub-pestaña 5: Segunda Mano Pendiente
│       ├── components/
│       │   ├── InventoryTabsHeader.tsx      # Sub-navegación de pestañas filtrada por rol
│       │   ├── ScannerQuickLookupBar.tsx    # Barra superior Scanner-First (GET /hardware-items/scan/:code)
│       │   ├── UnifiedStockTable.tsx        # Tabla maestra de stock + alerta stock bajo
│       │   ├── ExpandableSerialsRow.tsx     # Desplegable de series disponibles por producto/ubicación
│       │   ├── HardwareLifecycleModal.tsx   # Modal Hoja de Vida M6 (GET /hardware-items/:id/lifecycle)
│       │   ├── DecommissionItemModal.tsx    # Modal baja lógica (PATCH /hardware-items/:id/decommission)
│       │   ├── AdjustStockModal.tsx         # Modal ajuste manual (PATCH /quantity-stock/adjust)
│       │   ├── SerialNumbersInputGrid.tsx   # Grilla dinámica de N inputs para pistoleo con validación en vivo
│       │   ├── PostInboundPrintModal.tsx    # Modal inmediato post-ingreso para imprimir etiquetas del lote
│       │   ├── CategoryFormModal.tsx        # Modal crear / editar categoría
│       │   ├── CatalogProductFormModal.tsx  # Modal crear / editar producto maestro (sin campo name)
│       │   ├── CatalogStockDetailModal.tsx  # Modal desglose de stock por ubicación (GET /catalog/:id)
│       │   └── ApproveUsedItemModal.tsx     # Modal aprobar pieza usada (POST /hardware-items/approve-used)
│       ├── hooks/
│       │   ├── useUnifiedStock.ts           # Consulta paginada, filtro stock bajo y carga de series bajo demanda
│       │   ├── useUnifiedInbound.ts         # Construcción de lote mixto y validación de series en vivo
│       │   └── useBarcodeLabels.ts          # Generación de etiquetas por modelo (SKU) y por series
│       ├── services/
│       │   └── ...                          # Actualizar servicios HTTP existentes (sin axios en .tsx)
│       ├── catalogModels.ts                 # Modelos de Catálogo y Categorías (sin campo name, sku opcional)
│       ├── hardwareModels.ts                # Modelos de HardwareItem, AvailableSerial y BarcodeLabel
│       ├── hardwareDraft.ts                 # Estado/borrador de ingreso unificado (sin jerarquía Padre-Hijo)
│       ├── hardwareValidation.ts            # Reglas de validación pura de series y lotes en frontend
│       ├── quantityModels.ts                # Modelos de QuantityStock (catalogBrand, catalogModel, catalogSku)
│       ├── models.ts                        # Tipos transversales y re-exportaciones del módulo
│       └── index.ts
├── router/                                  # Configuración de rutas protegidas por rol
└── components/                              # Layout global y menú lateral (Sidebar)
```

> **Regla Obligatoria (Constitución 5.1 y 13.3):** Ningún archivo dentro de `pages/` o `components/` puede importar `axios` ni ejecutar peticiones HTTP directamente; toda comunicación pasa por `src/modules/inventory/services/` usando la instancia centralizada de `src/services/api/`.

---

## 3. Control de Acceso y Navegación (RBAC)

### 3.1 Actualización Global de Roles (`src/modules/foundation/`)
Actualizar el tipo de rol en `foundation` y en la navegación global:
```typescript
export type UserRole = 'ADMIN' | 'ENCARGADO_ALMACEN' | 'VENDEDOR' | 'TECNICO';
```
- Habilitar la opción **Encargado de Almacén (`ENCARGADO_ALMACEN`)** en el formulario de creación y edición de personal (`POST /users`, `PATCH /users/:id`) disponible para `ADMIN`.

### 3.2 Menú Lateral y Sub-rutas de Inventario
Dentro del módulo **Inventario** (`/inventory`), mostrar únicamente las pestañas autorizadas según el rol del usuario autenticado:

| Sub-pestaña (Texto UI en Español) | Ruta URL (Inglés) | Roles Permitidos | Acceso por Defecto |
| :--- | :--- | :--- | :---: |
| **Consultar Inventario** | `/inventory/consult` | `ADMIN`, `ENCARGADO_ALMACEN`, `VENDEDOR`, `TECNICO` | Sí (`/inventory` redirige aquí) |
| **Etiquetas 1D (Barras)** | `/inventory/labels` | `ADMIN`, `ENCARGADO_ALMACEN`, `VENDEDOR`, `TECNICO` | No |
| **Ingreso al Almacén** | `/inventory/inbound` | `ADMIN`, `ENCARGADO_ALMACEN` | No |
| **Catálogo y Categorías** | `/inventory/catalog` | `ADMIN`, `ENCARGADO_ALMACEN` | No |
| **Segunda Mano Pendiente** | `/inventory/second-hand` | `ADMIN`, `ENCARGADO_ALMACEN` | No |

- Si un `VENDEDOR` o `TECNICO` intenta acceder manualmente por URL a `/inventory/inbound`, `/inventory/catalog` o `/inventory/second-hand`, debe ser redirigido automáticamente a `/inventory/consult`.

---

## 4. Diseño Detallado y Comportamiento por Pantalla (`pages/`)

### 4.1 `InventoryConsultPage.tsx` (`/inventory/consult`)
**Roles:** Todos (`ADMIN`, `ENCARGADO_ALMACEN`, `VENDEDOR`, `TECNICO`).

#### Diseño Visual:
```text
+---------------------------------------------------------------------------------------------------+
| 🔍 CONSULTAR INVENTARIO                                                                           |
|                                                                                                   |
| [ 🔫 Pistolear o escribir N/S o código MP-... (Enter) ]  [ Buscar ]                               |
|                                                                                                   |
| Ubicación: [ Todas v ]   Categoría: [ Todas v ]   [x] Solo stock bajo   [ Limpiar ]               |
+---------------------------------------------------------------------------------------------------+
| PRODUCTO (MARCA / MODELO)     | SKU              | UBICACIÓN   | STOCK | P. VENTA | ACCIONES      |
|-------------------------------|------------------|-------------|-------|----------|---------------|
| ▶ Acer A515-56                | NB-ACER-A515-001 | Almacén     |   5   | S/ 2,350 | [Series] [⚖️] |
|   └─ SERIES EN STOCK (5):                                                                         |
|      • SN-NXA515-001  |  S/ 2,350  |  [📄 Hoja de Vida]  [🏷️ Etiqueta 1D]  [🚫 Dar de Baja]       |
|      • SN-NXA515-002  |  S/ 2,350  |  [📄 Hoja de Vida]  [🏷️ Etiqueta 1D]  [🚫 Dar de Baja]       |
|---------------------------------------------------------------------------------------------------|
|   Logitech M170               | LOG-M170-GR      | Puesto 102  | 2 ⚠️  | S/ 25.00 | [🏷️] [⚖️]     |
+---------------------------------------------------------------------------------------------------+
```

#### Reglas de Interacción y Endpoints:
1. **Barra Superior *Scanner-First* (`ScannerQuickLookupBar.tsx`):**
   - Captura lectura del lector HID (`useBarcodeScanner`) o tecla `Enter`.
   - Llama a `GET /hardware-items/scan/:code` y muestra una tarjeta con `serialNumber`, `status`, `locationId`, `salePrice`, acceso directo a **Hoja de Vida** (`GET /hardware-items/:id/lifecycle`) e **Imprimir Etiqueta** (`GET /hardware-items/:id/barcode-label`).
2. **Tabla Principal Unificada (`UnifiedStockTable.tsx`):**
   - Consulta `GET /quantity-stock` con filtros `locationId`, `categoryId`, `lowStock` y paginación (`page`, `limit`).
   - Muestra `catalogBrand` + `catalogModel` (nunca `name`), `catalogSku`, `locationName`, `quantity` (con insignia de alerta `⚠️ Stock bajo` cuando `isLowStock === true`) y `salePrice`.
3. **Desplegable de Series por Producto (`ExpandableSerialsRow.tsx`):**
   - Al expandir una fila, consulta `GET /hardware-items/available-serials?catalogId={catalogId}&locationId={locationId}`.
   - Si retorna series (`EN_STOCK`), permite:
     - **Todos los roles:** Ver **Hoja de Vida** (`GET /hardware-items/:id/lifecycle`) e imprimir **Etiqueta Individual** (`GET /hardware-items/:id/barcode-label`).
     - **Solo `ADMIN` y `ENCARGADO_ALMACEN`:** Editar precio/ubicación (`PATCH /hardware-items/:id`) y **Dar de Baja Lógica** (`PATCH /hardware-items/:id/decommission` con `reason` obligatorio, refrescando luego el saldo de la fila).
4. **Ajuste Manual / Merma (`AdjustStockModal.tsx` — Solo `ADMIN` y `ENCARGADO_ALMACEN`):**
   - Invoca `PATCH /quantity-stock/adjust` con `{ catalogId, locationId, newQuantity, reason }`.
   - Si el backend responde `400 Bad Request` (porque el producto tiene series activas), muestra el mensaje explicativo retornado por el servidor.

---

### 4.2 `InventoryInboundPage.tsx` (`/inventory/inbound`)
**Roles:** Solo `ADMIN` y `ENCARGADO_ALMACEN`.

#### Diseño Visual:
```text
+---------------------------------------------------------------------------------------------------+
| 📥 INGRESO DE MERCADERÍA                                      [ 📍 Destino: Almacén Central ]    |
|---------------------------------------------------------------------------------------------------|
| 1. AGREGAR PRODUCTO AL LOTE                                                                       |
|    Modelo: [ Acer A515-56 (i5-1135G7 | 16GB | 512GB) - NB-ACER-A515-001 v ]                       |
|    Cantidad: [ 3 ]     Costo Unit. (S/): [ 1800.00 ]     Precio Venta (S/): [ 2350.00 ]           |
|                                                                                                   |
|    [x] Ingresar números de serie individuales (3 series requeridas)                               |
|    +-------------------------------------------------------------------------------------------+  |
|    | Serie #1: [ SN-NXA515-001      ] ✅ Válida                                                |  |
|    | Serie #2: [ SN-NXA515-002      ] ✅ Válida                                                |  |
|    | Serie #3: [ (Pistolee aquí...) ] ⏳ Pendiente                                             |  |
|    +-------------------------------------------------------------------------------------------+  |
|                                                                     [ + Agregar al Lote ]         |
|---------------------------------------------------------------------------------------------------|
| 2. RESUMEN DEL LOTE A REGISTRAR (2 modelos | 23 unidades totales)                                 |
|    • Acer A515-56             | Cant: 3  | Con Series (3) | Costo: S/ 1,800 | Venta: S/ 2,350 [X] |
|    • Logitech M170            | Cant: 20 | Sin Series     | Costo: S/ 15    | Venta: S/ 30    [X] |
|                                                                                                   |
|    Observaciones: [ Ingreso importación Lote Noviembre 2026                                   ]   |
|                                                         [ 💾 CONFIRMAR INGRESO AL ALMACÉN ]       |
+---------------------------------------------------------------------------------------------------+
```

#### Reglas de Interacción y Endpoints:
1. **Ubicación Fija Informativa:** No muestra selector de ubicación; muestra la insignia **"Destino: Almacén Central"** (el backend resuelve `ALMACEN_CENTRAL` automáticamente).
2. **Selector de Modelo:** Carga `GET /catalog?active=true&limit=100` mostrando `${brand} ${model}` + especificaciones + `sku`. Pre-rellena `salePrice` con `basePrice` y activa `hasSerialNumbers` según `catalog.isSerialized` (editable por el usuario).
3. **Grilla Dinámica de Series (`SerialNumbersInputGrid.tsx` + `hardwareValidation.ts`):**
   - Visible solo cuando `hasSerialNumbers === true`. Renderiza exactamente `quantity` inputs.
   - **UX Pistola Lectora:** Al presionar `Enter` en el input `i`, avanza el foco automáticamente al input `i + 1`.
   - **Validación en Vivo:** Detecta duplicados dentro del mismo lote (`hardwareValidation.ts`) y consulta `POST /hardware-items/validate-serials` para marcar en rojo las series que ya existen en base de datos (`existingSerials`).
4. **Confirmación y Post-Impresión:**
   - Envía `{ items, notes }` a `POST /inventory/inbound` (reemplazando definitivamente al antiguo `/hardware-items/batch-inbound`).
   - Tras recibir `201 Created`, abre `PostInboundPrintModal.tsx` con el resumen (`batchId`, `totalUnits`) y botones para imprimir inmediatamente las etiquetas 1D del lote recién ingresado.

---

### 4.3 `InventoryLabelsPage.tsx` (`/inventory/labels`)
**Roles:** Todos (`ADMIN`, `ENCARGADO_ALMACEN`, `VENDEDOR`, `TECNICO`).

#### Reglas de Interacción y Endpoints:
1. **Modo A — Por Modelo / Cantidad (Código SKU):**
   - Selecciona `catalogId` (`GET /catalog?active=true`), `locationId` opcional (`GET /locations?active=true`) y `copies` ($\ge 1$).
   - Invoca `POST /inventory/barcode-labels/by-model` y envía las etiquetas generadas (`barcodeValue: sku`, `title: "${brand} ${model}"`, `specsSummary`, `price`) a la vista previa / servicio de impresión (`src/services/printer/`).
2. **Modo B — Por Números de Serie Individuales:**
   - Permite buscar o escanear equipos en stock (`GET /hardware-items?search=...&status=EN_STOCK` o `GET /hardware-items/scan/:code`) y armar una cola de impresión.
   - Invoca `POST /hardware-items/barcode-labels/batch` con `{ hardwareItemIds }`.

---

### 4.4 `InventoryCatalogPage.tsx` (`/inventory/catalog`)
**Roles:** Solo `ADMIN` y `ENCARGADO_ALMACEN`.

#### Reglas de Interacción y Endpoints:
1. **Panel Izquierdo (Categorías):** Lista `GET /categories`, crea con `POST /categories` y edita/desactiva con `PATCH /categories/:id`.
2. **Panel Derecho (Catálogo Maestro sin `name`):**
   - Busca en tiempo real con `GET /catalog?search=...&categoryId=...&page=...`.
   - **Modal Crear / Editar (`CatalogProductFormModal.tsx`):**
     - **NO contiene campo `name`**.
     - Campos obligatorios: `brand`, `model`, `categoryId`, `basePrice`.
     - Campo `sku`: **Opcional** al crear (placeholder: *"Dejar vacío para autogenerar MP-CAT-XXXXXX"*).
     - Campos opcionales: `processor`, `ramCapacity`, `storageCapacity`, `gpu`, `screenSize`, `minStockThreshold` (default `2`), `isSerialized`.
     - Llama a `POST /catalog` o `PATCH /catalog/:id`.
   - **Modal Stock por Ubicación (`CatalogStockDetailModal.tsx`):** Llama a `GET /catalog/:id` para mostrar `stockSummary` por almacén y puestos.

---

### 4.5 `InventorySecondHandPage.tsx` (`/inventory/second-hand`)
**Roles:** Solo `ADMIN` y `ENCARGADO_ALMACEN`.

#### Reglas de Interacción y Endpoints:
1. Lista piezas pendientes mediante `GET /hardware-items?status=SEGUNDA_MANO_PENDIENTE`.
2. **Aprobar (`ApproveUsedItemModal.tsx`):** Solicita `locationId` (`GET /locations?active=true`) y `salePrice`, y envía `POST /hardware-items/approve-used`.
3. **Dar de Baja (`DecommissionItemModal.tsx`):** Solicita `reason` y envía `PATCH /hardware-items/:id/decommission`.

---

## 5. Contratos de Modelos TypeScript (`*Models.ts`)

### `catalogModels.ts`
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
```

### `hardwareModels.ts` & `quantityModels.ts`
```typescript
export type ItemStatus =
  | 'EN_STOCK'
  | 'VENDIDO'
  | 'SEGUNDA_MANO_PENDIENTE'
  | 'EN_GARANTIA'
  | 'DE_BAJA';

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

export interface UnifiedInboundResponse {
  batchId: string;
  locationId: string;
  locationName: string;
  totalItems: number;
  totalUnits: number;
  results: Array<{
    catalogId: string;
    catalogSku: string;
    catalogBrand: string;
    catalogModel: string;
    quantity: number;
    hasSerialNumbers: boolean;
    serialsCreated: string[];
    totalStockResulting: number;
  }>;
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
```

---

## 6. Criterios de Aceptación
1. **Cero referencias a `catalog.name` ni Padre-Hijo:** Ningún modelo (`catalogModels.ts`, `hardwareModels.ts`, `hardwareDraft.ts`), servicio ni componente del frontend envía o espera `name` en `ProductCatalog` ni consume `/hardware-items/batch-inbound` o `/children`.
2. **RBAC Funcional:** Usuarios con rol `ENCARGADO_ALMACEN` tienen acceso completo a las 5 sub-pestañas de Inventario; `VENDEDOR` y `TECNICO` solo visualizan **Consultar Inventario** y **Etiquetas 1D**.
3. **Flujo de Ingreso Unificado:** Permite registrar lotes mixtos (modelos con series y modelos por cantidad) directo al **Almacén Central**, validando series en vivo y permitiendo imprimir etiquetas 1D inmediatamente tras confirmar.
4. **Calidad y Compilación:**
   - Cero llamadas `axios` directas dentro de `pages/` o `components/`.
   - `npm run build` (`tsc && vite build`) finaliza con **0 errores** de TypeScript.
   - Pruebas unitarias/integración con Vitest y React Testing Library pasando al 100%.