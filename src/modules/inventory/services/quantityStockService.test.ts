import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '../../../services/api/axiosInstance';
import { listQuantityStock, inboundQuantityStock, adjustQuantityStock } from './quantityStockService';
vi.mock('../../../services/api/axiosInstance', () => ({ apiClient: { get: vi.fn(), post: vi.fn(), patch: vi.fn() } }));
beforeEach(() => vi.resetAllMocks());
describe('quantityStockService', () => {
  it('forwards exact filters and cancellation signal', async () => {
    const result = { items: [], total: 0, page: 2, limit: 10 };
    vi.mocked(apiClient.get).mockResolvedValue({ data: result });
    const query = { page: 2, limit: 10, locationId: 'place', categoryId: 'category', catalogItemId: 'product', lowStock: true };
    const signal = new AbortController().signal;
    expect(await listQuantityStock(query, signal)).toEqual(result);
    expect(apiClient.get).toHaveBeenCalledWith('/quantity-stock', { params: query, signal });
  });
  it('uses inbound increment and absolute adjustment endpoints', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ data: { quantity: 8 } });
    vi.mocked(apiClient.patch).mockResolvedValue({ data: { quantity: 0 } });
    const inbound = { catalogId: 'product', locationId: 'place', quantity: 3, costPrice: 0, salePrice: 25 };
    const adjustment = { catalogId: 'product', locationId: 'place', newQuantity: 0, reason: 'Conteo físico' };
    expect(await inboundQuantityStock(inbound)).toEqual({ quantity: 8 });
    expect(await adjustQuantityStock(adjustment)).toEqual({ quantity: 0 });
    expect(apiClient.post).toHaveBeenCalledWith('/quantity-stock/inbound', inbound);
    expect(apiClient.patch).toHaveBeenCalledWith('/quantity-stock/adjust', adjustment);
  });
  it('propagates API rejection', async () => {
    const failure = new Error('Sin conexión'); vi.mocked(apiClient.get).mockRejectedValue(failure);
    await expect(listQuantityStock()).rejects.toBe(failure);
  });
});
