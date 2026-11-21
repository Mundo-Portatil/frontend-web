export interface Category {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
  productsCount?: number;
  createdAt: string;
}

export interface CategoryQuery {
  active?: boolean;
}

export interface CreateCategoryInput {
  name: string;
  description?: string;
  active?: boolean;
}

export interface UpdateCategoryInput {
  name?: string;
  description?: string;
  active?: boolean;
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

export interface CreateCatalogInput {
  sku?: string; // Opcional: el backend autogenera MP-CAT-XXXXXX si se omite
  brand: string;
  model: string;
  categoryId: string;
  basePrice: number;
  processor?: string;
  ramCapacity?: string;
  storageCapacity?: string;
  gpu?: string;
  screenSize?: string;
  isSerialized?: boolean;
  minStockThreshold?: number;
  isSecondHand?: boolean;
  active?: boolean;
}

export type CreateCatalogItemPayload = CreateCatalogInput;

/** SKU is immutable; changing the inventory tracking type is outside the frontend scope. */
export type UpdateCatalogInput = Partial<Omit<CreateCatalogInput, 'sku' | 'isSerialized'>>;
export type UpdateCatalogItemPayload = UpdateCatalogInput;

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

/**
 * Generates an automatic coherent tag code (SKU) based on category:
 * <3_LETTERS_CATEGORY_UPPERCASE>-<6_ALPHANUMERIC_CHARS>
 * Example: Laptops -> LAP-8F3A2C, RAM -> RAM-994A1E, SSD -> SSD-2B104F
 */
export function generateCategoryAutoSku(categoryName: string): string {
  const clean = categoryName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip accents
    .replace(/[^A-Za-z0-9]/g, '') // alphanumeric only
    .toUpperCase();

  const prefix = (clean.length >= 3 ? clean.slice(0, 3) : clean.padEnd(3, 'X')).toUpperCase();
  const chars = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let random = '';
  for (let i = 0; i < 6; i++) {
    random += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}-${random}`;
}
