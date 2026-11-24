import { beforeEach, expect, it, vi } from 'vitest';
import { apiClient } from '../../../services/api/axiosInstance';
import { getHardwareLifecycle, listHardwareUnits } from './hardwareReadService';

vi.mock('../../../services/api/axiosInstance', () => ({ apiClient: { get: vi.fn() } }));
beforeEach(() => vi.resetAllMocks());
it('sends the published hardware list query without changing its response', async () => {
  const result = { items: [], total: 0, page: 2, limit: 50 };
  const query = { catalogItemId: 'product', locationId: 'central', status: 'EN_STOCK' as const, page: 2, limit: 50 };
  const signal = new AbortController().signal;
  vi.mocked(apiClient.get).mockResolvedValue({ data: result });
  expect(await listHardwareUnits(query, signal)).toBe(result);
  expect(apiClient.get).toHaveBeenCalledWith('/hardware-items', { params: query, signal });
});
it('loads the real lifecycle and propagates server errors', async () => {
  vi.mocked(apiClient.get).mockResolvedValueOnce({ data: { hardwareItemId: 'item', serialNumber: 'SN', events: [] } }).mockRejectedValueOnce({ status: 403 });
  expect(await getHardwareLifecycle('item')).toEqual({ hardwareItemId: 'item', serialNumber: 'SN', events: [] });
  expect(apiClient.get).toHaveBeenCalledWith('/hardware-items/item/lifecycle', { signal: undefined });
  await expect(getHardwareLifecycle('item')).rejects.toEqual({ status: 403 });
});
