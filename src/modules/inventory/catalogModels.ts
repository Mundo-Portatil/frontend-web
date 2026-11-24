export interface CatalogItem {
  id: string;
  sku: string;
  /** Display-only label derived from brand/model; never sent to the backend. */
  name: string;
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
export interface CreateCatalogInput {
  sku?: string; brand: string; model: string; categoryId: string; basePrice: number;
  processor?: string; ramCapacity?: string; storageCapacity?: string; gpu?: string; screenSize?: string;
  isSerialized?: boolean; minStockThreshold?: number; isSecondHand?: boolean; active?: boolean;
}
/** SKU is immutable; changing the inventory tracking type is outside the frontend scope. */
export type UpdateCatalogInput = Partial<Omit<CreateCatalogInput, 'sku' | 'isSerialized'>>;
export interface CatalogQuery { categoryId?: string; active?: boolean; search?: string; page?: number; limit?: number }
export interface CatalogPageResult { items: CatalogItem[]; total: number; page: number; limit: number }
export interface CatalogDetail {
  item: CatalogItem;
  categoryName: string;
  stockSummary: { locationId: string; locationName: string; locationType: string; serializedCount: number; quantityCount: number; totalAvailable: number }[];
  totalStockOverall: number;
}

/** Wire DTO in backend refact/inventario deliberately has no name property. */
export type CatalogItemResponse = Omit<CatalogItem, 'name'>;
export type CatalogDetailResponse = Omit<CatalogDetail, 'item'> & { item: CatalogItemResponse };
export type CatalogPageResponse = Omit<CatalogPageResult, 'items'> & { items: CatalogItemResponse[] };

export function getCatalogDisplayName(product: { brand: string; model: string; sku?: string }): string {
  return [product.brand?.trim(), product.model?.trim()].filter(Boolean).join(' ') || product.sku?.trim() || 'Producto';
}
