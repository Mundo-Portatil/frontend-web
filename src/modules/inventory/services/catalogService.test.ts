import { beforeEach, expect, it, vi } from 'vitest';
import { apiClient } from '../../../services/api/axiosInstance';
import { createCatalogItem, getCatalogDetail, listCatalog, setCatalogActive } from './catalogService';
vi.mock('../../../services/api/axiosInstance', () => ({ apiClient: { get: vi.fn(), post: vi.fn(), patch: vi.fn() } }));
beforeEach(() => vi.clearAllMocks());
it('sends catalog query including false and pagination without altering the envelope', async () => {
  const result = { items: [], total: 80, page: 2, limit: 50 };
  vi.mocked(apiClient.get).mockResolvedValue({ data: result });
  const query = { active: false, categoryId: 'id', search: 'acer', page: 2, limit: 50 };
  expect(await listCatalog(query)).toEqual(result);
  expect(apiClient.get).toHaveBeenCalledWith('/catalog', { params: query, signal: undefined });
});
it('loads detail and forwards optional cancellation signal', async () => {
  const signal = new AbortController().signal;
  vi.mocked(apiClient.get).mockResolvedValue({ data: { totalStockOverall: 7 } });
  expect(await getCatalogDetail('id', signal)).toEqual({ totalStockOverall: 7 });
  expect(apiClient.get).toHaveBeenCalledWith('/catalog/id', { signal });
});
it('creates product with POST /catalog and propagates API errors', async () => {
  const payload = { name: 'Laptop', sku: 'NB', brand: 'Acer', model: 'A5', categoryId: 'id', basePrice: 2350 };
  vi.mocked(apiClient.post).mockResolvedValueOnce({ data: { ...payload, id: 'p' } }).mockRejectedValueOnce({ status: 409 });
  expect(await createCatalogItem(payload)).toMatchObject({ id: 'p' });
  expect(apiClient.post).toHaveBeenCalledWith('/catalog', payload);
  await expect(createCatalogItem(payload)).rejects.toEqual({ status: 409 });
});

it('reactivates or deactivates only with the contracted active field', async () => {
  vi.mocked(apiClient.patch).mockResolvedValueOnce({ data: { id: 'p', active: true } }).mockResolvedValueOnce({ data: { id: 'p', active: false } });
  expect(await setCatalogActive('p', true)).toEqual({ id: 'p', active: true });
  expect(apiClient.patch).toHaveBeenLastCalledWith('/catalog/p', { active: true });
  expect(await setCatalogActive('p', false)).toEqual({ id: 'p', active: false });
  expect(apiClient.patch).toHaveBeenLastCalledWith('/catalog/p', { active: false });
});

it('updates only the supplied catalogue fields and propagates failures', async () => {
  const { updateCatalogItem } = await import('./catalogService');
  const payload = { name: 'Nuevo nombre', ramCapacity: '32 GB' };
  vi.mocked(apiClient.patch).mockResolvedValueOnce({ data: { id: 'item', ...payload } }).mockRejectedValueOnce({ status: 403 });
  expect(await updateCatalogItem('item', payload)).toEqual({ id: 'item', ...payload });
  expect(apiClient.patch).toHaveBeenCalledWith('/catalog/item', payload);
  await expect(updateCatalogItem('item', payload)).rejects.toEqual({ status: 403 });
});
