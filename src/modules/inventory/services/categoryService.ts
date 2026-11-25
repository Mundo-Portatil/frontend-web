import { apiClient } from '../../../services/api/axiosInstance';
import type { Category, CategoryQuery, CreateCategoryInput, UpdateCategoryInput } from '../models';

export async function listCategories(query: CategoryQuery = {}, signal?: AbortSignal): Promise<Category[]> {
  const { data } = await apiClient.get<Category[]>('/categories', { params: query, signal });
  return data;
}
export async function createCategory(payload: CreateCategoryInput): Promise<Category> {
  const { data } = await apiClient.post<Category>('/categories', payload);
  return data;
}
export async function updateCategory(id: string, payload: UpdateCategoryInput): Promise<Category> {
  const { data } = await apiClient.patch<Category>(`/categories/${encodeURIComponent(id)}`, payload);
  return data;
}
