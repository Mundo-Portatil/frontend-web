import { apiClient } from '../../../services/api/axiosInstance';
import { getCatalogDisplayName } from '../catalogModels';
import type { CatalogDetail, CatalogDetailResponse, CatalogItem, CatalogItemResponse, CatalogPageResult, CatalogPageResponse, CatalogQuery, CreateCatalogInput, UpdateCatalogInput } from '../catalogModels';

const CREATE_FIELDS = ['sku', 'brand', 'model', 'categoryId', 'basePrice', 'processor', 'ramCapacity', 'storageCapacity', 'gpu', 'screenSize', 'isSerialized', 'minStockThreshold', 'isSecondHand', 'active'] as const satisfies readonly (keyof CreateCatalogInput)[];
const UPDATE_FIELDS = ['brand', 'model', 'categoryId', 'basePrice', 'processor', 'ramCapacity', 'storageCapacity', 'gpu', 'screenSize', 'minStockThreshold', 'isSecondHand', 'active'] as const satisfies readonly (keyof UpdateCatalogInput)[];

/** Keep presentation-only or stale caller fields out of strict API DTOs. */
function supportedFields<T extends object, K extends keyof T>(input: T, keys: readonly K[]): Pick<T, K> {
  const body = {} as Pick<T, K>;
  for (const key of keys) if (input[key] !== undefined) body[key] = input[key];
  return body;
}
function presentItem(item: CatalogItemResponse): CatalogItem {
  return { ...item, name: getCatalogDisplayName(item) };
}

export async function listCatalog(query: CatalogQuery = {}, signal?: AbortSignal): Promise<CatalogPageResult> {
  const { data } = await apiClient.get<CatalogPageResponse>('/catalog', { params: query, signal });
  return { ...data, items: data.items.map(presentItem) };
}
export async function getCatalogDetail(id: string, signal?: AbortSignal): Promise<CatalogDetail> {
  const { data } = await apiClient.get<CatalogDetailResponse>(`/catalog/${encodeURIComponent(id)}`, { signal, timeout: 10_000 });
  return { ...data, item: presentItem(data.item) };
}
export async function createCatalogItem(payload: CreateCatalogInput): Promise<CatalogItem> {
  const { data } = await apiClient.post<CatalogItemResponse>('/catalog', supportedFields(payload, CREATE_FIELDS));
  return presentItem(data);
}
export async function updateCatalogItem(id: string, payload: UpdateCatalogInput): Promise<CatalogItem> {
  const { data } = await apiClient.patch<CatalogItemResponse>(`/catalog/${encodeURIComponent(id)}`, supportedFields(payload, UPDATE_FIELDS));
  return presentItem(data);
}
