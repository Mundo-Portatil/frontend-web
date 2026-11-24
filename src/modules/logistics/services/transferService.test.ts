import { beforeEach, expect, it, vi } from 'vitest';
import { apiClient } from '../../../services/api/axiosInstance';
import { createDirectTransfer, getTransferDetail, listTransfers } from './transferService';
vi.mock('../../../services/api/axiosInstance', () => ({ apiClient: { get: vi.fn(), post: vi.fn() } }));
beforeEach(() => vi.resetAllMocks());
it('sends only the supported list filters and preserves the array response', async () => {
  const items = [{ id: 'guide', code: 'TR-ABC123' }];
  vi.mocked(apiClient.get).mockResolvedValue({ data: items });
  const signal = new AbortController().signal;
  const query = { locationId: 'shop', startDate: '2026-11-01', endDate: '2026-11-24' };
  expect(await listTransfers(query, signal)).toBe(items);
  expect(apiClient.get).toHaveBeenCalledWith('/transfers', { params: query, signal, timeout: 15_000 });
});
it('encodes detail identifiers and uses the server code without generating one', async () => {
  vi.mocked(apiClient.get).mockResolvedValue({ data: { code: 'TR-ABC123', items: [] } });
  expect(await getTransferDetail('TR-ABC123')).toMatchObject({ code: 'TR-ABC123' });
  await getTransferDetail('A/B');
  expect(apiClient.get).toHaveBeenLastCalledWith('/transfers/A%2FB', { signal: undefined, timeout: 15_000 });
});
it('performs one atomic request with the verified payload and no retry', async () => {
  const input = { fromLocationId: 'central', toLocationId: 'shop', quantities: [{ catalogId: 'mouse', quantity: 2 }], notes: 'Entrega' };
  const response = { code: 'TR-ABC123', status: 'COMPLETED', items: [{ catalogId: 'mouse', quantity: 2 }] };
  vi.mocked(apiClient.post).mockResolvedValueOnce({ data: response }).mockRejectedValueOnce({ kind: 'network' });
  expect(await createDirectTransfer(input)).toBe(response);
  expect(apiClient.post).toHaveBeenCalledWith('/transfers/direct', input, { timeout: 30_000 });
  await expect(createDirectTransfer(input)).rejects.toEqual({ kind: 'network' });
  expect(apiClient.post).toHaveBeenCalledTimes(2);
});
