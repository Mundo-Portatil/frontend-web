export interface CatalogItem {
  id: string;
  sku: string;
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
  sku: string; name: string; brand: string; model: string; categoryId: string; basePrice: number;
  processor?: string; ramCapacity?: string; storageCapacity?: string; gpu?: string; screenSize?: string;
  isSerialized?: boolean; minStockThreshold?: number; isSecondHand?: boolean; active?: boolean;
}
export interface CatalogQuery { categoryId?: string; active?: boolean; search?: string; page?: number; limit?: number }
export interface CatalogPageResult { items: CatalogItem[]; total: number; page: number; limit: number }
export interface CatalogDetail {
  item: CatalogItem;
  categoryName: string;
  stockSummary: { locationId: string; locationName: string; locationType: string; serializedCount: number; quantityCount: number; totalAvailable: number }[];
  totalStockOverall: number;
}
