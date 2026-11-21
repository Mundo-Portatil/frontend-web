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

export type QuantityStock = QuantityStockItem;

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
