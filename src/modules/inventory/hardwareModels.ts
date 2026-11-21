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
  locationName?: string;
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
  locationName?: string;
  price: number | null;
  copyNumber?: number;
  totalCopies?: number;
}

export type BarcodeLabel = BarcodeLabelItem;

export interface SerialValidationResponse {
  existingSerials: string[];
  allValid: boolean;
}

export type SerialValidation = SerialValidationResponse;

export interface HardwareLifecycleEntry {
  id: string;
  action: string;
  description?: string;
  details?: Record<string, unknown>;
  userName?: string;
  locationName?: string;
  createdAt?: string;
  timestamp?: string;
}

export interface HardwareLifecycleResponse {
  hardwareItem: HardwareItem;
  lifecycle: HardwareLifecycleEntry[];
}

/** Payload for POST /hardware-items/approve-used (contract requires itemId, NOT hardwareItemId) */
export interface ApproveUsedPayload {
  itemId: string;
  locationId: string;
  salePrice: number;
}
