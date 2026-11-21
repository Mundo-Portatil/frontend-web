import { apiClient } from '../../../services/api/axiosInstance';
import type {
  AdjustQuantityStockInput,
  QuantityStockItem,
  QuantityStockPageResult,
  QuantityStockQuery,
} from '../quantityModels';

export async function listQuantityStock(
  query: QuantityStockQuery = {},
  signal?: AbortSignal,
): Promise<QuantityStockPageResult> {
  const { data } = await apiClient.get<QuantityStockPageResult>('/quantity-stock', { params: query, signal });
  return data;
}

export async function adjustQuantityStock(payload: AdjustQuantityStockInput): Promise<QuantityStockItem> {
  const { data } = await apiClient.patch<QuantityStockItem>('/quantity-stock/adjust', payload);
  return data;
}

/**
 * @deprecated Legacy inbound for quantity stock. Use `inboundInventory` from `inventoryService` instead.
 */
export async function inboundQuantityStock(payload: {
  catalogId: string;
  locationId: string;
  quantity: number;
  costPrice?: number;
  salePrice?: number;
}): Promise<QuantityStockItem> {
  const { data } = await apiClient.post<QuantityStockItem>('/quantity-stock/inbound', payload);
  return data;
}
