import { apiClient } from '../../../services/api/axiosInstance';
import type { AdjustQuantityStockInput, InboundQuantityStockInput, QuantityStock, QuantityStockPageResult, QuantityStockQuery } from '../quantityModels';
export async function listQuantityStock(query: QuantityStockQuery = {}, signal?: AbortSignal): Promise<QuantityStockPageResult> {
  const { data } = await apiClient.get<QuantityStockPageResult>('/quantity-stock', { params: query, signal });
  return data;
}
export async function inboundQuantityStock(payload: InboundQuantityStockInput): Promise<QuantityStock> {
  const { data } = await apiClient.post<QuantityStock>('/quantity-stock/inbound', payload);
  return data;
}
export async function adjustQuantityStock(payload: AdjustQuantityStockInput): Promise<QuantityStock> {
  const { data } = await apiClient.patch<QuantityStock>('/quantity-stock/adjust', payload);
  return data;
}
