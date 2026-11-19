import { apiClient } from '../../../services/api/axiosInstance';
import type { CatalogDetail, CatalogItem, CatalogPageResult, CatalogQuery, CreateCatalogInput } from '../catalogModels';
export async function listCatalog(query: CatalogQuery = {}, signal?: AbortSignal): Promise<CatalogPageResult> {
  const { data } = await apiClient.get<CatalogPageResult>('/catalog', { params: query, signal });
  return data;
}
export async function getCatalogDetail(id: string, signal?: AbortSignal): Promise<CatalogDetail> {
  const { data } = await apiClient.get<CatalogDetail>(`/catalog/${encodeURIComponent(id)}`, { signal });
  return data;
}
export async function createCatalogItem(payload: CreateCatalogInput): Promise<CatalogItem> {
  const { data } = await apiClient.post<CatalogItem>('/catalog', payload);
  return data;
}
