import { beforeEach, expect, it, vi } from 'vitest';
import { apiClient } from '../../../services/api/axiosInstance';
import { receiveInventory } from './inventoryInboundService';
vi.mock('../../../services/api/axiosInstance', () => ({ apiClient: { post: vi.fn() } }));
beforeEach(() => vi.clearAllMocks());

it('uses only the unified inbound endpoint and returns the official stock result unchanged', async () => {
  const payload = { items: [{ catalogId: 'model', quantity: 2, hasSerialNumbers: true, serialNumbers: ['S1', 'S2'] }] };
  const response = { batchId: 'batch', locationId: 'server-central', locationName: 'Central', totalItems: 1, totalUnits: 2, results: [], createdAt: '2026-11-21T10:00:00Z' };
  vi.mocked(apiClient.post).mockResolvedValue({ data: response });
  expect(await receiveInventory(payload)).toBe(response);
  expect(apiClient.post).toHaveBeenCalledWith('/inventory/inbound', payload);
  expect(apiClient.post).toHaveBeenCalledTimes(1);
});
