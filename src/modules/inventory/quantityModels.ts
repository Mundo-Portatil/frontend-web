export interface QuantityStock {
  id: string;
  catalogId: string;
  /** Legacy presentation field; current API provides brand/model separately. */
  catalogName?: string;
  catalogBrand?: string;
  catalogModel?: string;
  catalogSku?: string;
  locationId: string;
  locationName?: string;
  quantity: number;
  costPrice: number | null;
  salePrice: number | null;
  minStockThreshold?: number;
  isLowStock?: boolean;
  updatedAt: string;
}
export interface QuantityStockPageResult { items: QuantityStock[]; total: number; page: number; limit: number }
export interface QuantityStockQuery { locationId?: string; categoryId?: string; catalogItemId?: string; lowStock?: boolean; page?: number; limit?: number }
export interface InboundQuantityStockInput { catalogId: string; locationId: string; quantity: number; costPrice?: number; salePrice?: number }
export interface AdjustQuantityStockInput { catalogId: string; locationId: string; newQuantity: number; reason: string }
