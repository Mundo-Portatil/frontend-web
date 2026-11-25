import { beforeEach, expect, it, vi } from 'vitest';
import { scanHardware, validateSerials } from './hardwareItemService';
import { apiClient } from '../../../services/api/axiosInstance';

vi.mock('../../../services/api/axiosInstance', () => ({
  apiClient: { get: vi.fn(), post: vi.fn() },
}));

beforeEach(() => vi.clearAllMocks());

it('validates serial numbers through the contracted endpoint', async () => {
  vi.mocked(apiClient.post).mockResolvedValue({ data: { allValid: true, existingSerials: [] } });
  await expect(validateSerials(['P1'])).resolves.toEqual({ allValid: true, existingSerials: [] });
  expect(apiClient.post).toHaveBeenCalledWith('/hardware-items/validate-serials', { serialNumbers: ['P1'] });
});

it('encodes the scan path and forwards an abort signal', async () => {
  const controller = new AbortController();
  vi.mocked(apiClient.get).mockResolvedValue({ data: { id: 'unit' } });
  await scanHardware('A/B', controller.signal);
  expect(apiClient.get).toHaveBeenCalledWith('/hardware-items/scan/A%2FB', { signal: controller.signal });
});
