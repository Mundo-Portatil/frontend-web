/** POST /inventory/inbound: the server resolves the central warehouse. */
export interface UnifiedInboundItemInput {
  catalogId: string;
  quantity: number;
  hasSerialNumbers: boolean;
  serialNumbers?: string[];
  costPrice?: number;
  salePrice?: number;
}
export interface UnifiedInboundInput {
  items: UnifiedInboundItemInput[];
  notes?: string;
}
export interface UnifiedInboundItemResult {
  catalogId: string;
  catalogSku: string;
  catalogBrand: string;
  catalogModel: string;
  quantity: number;
  hasSerialNumbers: boolean;
  serialsCreated: string[];
  totalStockResulting: number;
}
export interface UnifiedInboundResult {
  batchId: string;
  locationId: string;
  locationName: string;
  totalItems: number;
  totalUnits: number;
  results: UnifiedInboundItemResult[];
  createdAt: string;
}
