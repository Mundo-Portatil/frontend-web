import { beforeEach, expect, it, vi } from 'vitest';
import { apiClient } from '../../../services/api/axiosInstance';
import { createCatalogItem, getCatalogDetail, listCatalog, updateCatalogItem } from './catalogService';
vi.mock('../../../services/api/axiosInstance', () => ({ apiClient: { get: vi.fn(), post: vi.fn(), patch: vi.fn() } }));
const wireItem = { id: 'p', sku: 'MP-CAT-ABC123', brand: 'Acer', model: 'Aspire 5', categoryId: 'category', basePrice: 2350, minStockThreshold: 2, isSerialized: true, isSecondHand: false, active: true, processor: null, ramCapacity: null, storageCapacity: null, gpu: null, screenSize: null, createdAt: '' };
beforeEach(() => vi.clearAllMocks());
it('sends the real query and derives a display label without requiring a name field', async () => {
  const result = { items: [wireItem], total: 80, page: 2, limit: 50 };
  vi.mocked(apiClient.get).mockResolvedValue({ data: result });
  const query = { active: false, categoryId: 'id', search: 'acer', page: 2, limit: 50 };
  expect(await listCatalog(query)).toEqual({ ...result, items: [{ ...wireItem, name: 'Acer Aspire 5' }] });
  expect(apiClient.get).toHaveBeenCalledWith('/catalog', { params: query, signal: undefined });
});
it('preserves the official stock summary instead of adding serialized counts again', async () => {
  const signal = new AbortController().signal;
  const detail = { item: wireItem, categoryName: 'Portátiles', stockSummary: [{ locationId: 'central', locationName: 'Almacén', locationType: 'ALMACEN_CENTRAL', serializedCount: 5, quantityCount: 7, totalAvailable: 7 }], totalStockOverall: 7 };
  vi.mocked(apiClient.get).mockResolvedValue({ data: detail });
  expect(await getCatalogDetail('id', signal)).toEqual({ ...detail, item: { ...wireItem, name: 'Acer Aspire 5' } });
  expect(apiClient.get).toHaveBeenCalledWith('/catalog/id', { signal, timeout: 10_000 });
});
it('creates without name or a required SKU and propagates API conflicts', async () => {
  const payload = { name: 'Obsolete client field', sku: undefined, brand: 'Acer', model: 'Aspire 5', categoryId: 'category', basePrice: 2350 };
  vi.mocked(apiClient.post).mockResolvedValueOnce({ data: wireItem }).mockRejectedValueOnce({ status: 409 });
  expect(await createCatalogItem(payload)).toMatchObject({ sku: 'MP-CAT-ABC123', name: 'Acer Aspire 5' });
  expect(apiClient.post).toHaveBeenCalledWith('/catalog', { brand: 'Acer', model: 'Aspire 5', categoryId: 'category', basePrice: 2350 });
  await expect(createCatalogItem(payload)).rejects.toEqual({ status: 409 });
});
it('updates only supported descriptive fields and never sends UI name, SKU or tracking changes', async () => {
  const payload = { brand: 'Acer nuevo', ramCapacity: '32 GB', name: 'Stale display label', sku: 'Other code', isSerialized: false };
  vi.mocked(apiClient.patch).mockResolvedValueOnce({ data: { ...wireItem, brand: 'Acer nuevo', ramCapacity: '32 GB' } }).mockRejectedValueOnce({ status: 403 });
  expect(await updateCatalogItem('item', payload)).toMatchObject({ name: 'Acer nuevo Aspire 5', ramCapacity: '32 GB' });
  expect(apiClient.patch).toHaveBeenCalledWith('/catalog/item', { brand: 'Acer nuevo', ramCapacity: '32 GB' });
  await expect(updateCatalogItem('item', payload)).rejects.toEqual({ status: 403 });
});
