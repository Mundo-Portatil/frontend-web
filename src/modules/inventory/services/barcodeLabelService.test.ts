import { beforeEach, expect, it, vi } from 'vitest';
import { apiClient } from '../../../services/api/axiosInstance';
import { getBatchLabels, getModelLabels } from './barcodeLabelService';
vi.mock('../../../services/api/axiosInstance', () => ({ apiClient: { post: vi.fn() } }));
beforeEach(() => vi.clearAllMocks());
it('requests model labels through the confirmed endpoint without changing server values', async () => {
  const payload = { catalogId: 'model', copies: 3, locationId: 'central' };
  const labels = [{ catalogId: 'model', barcodeValue: 'SKU-ORIGINAL', copyNumber: 1, totalCopies: 3 }];
  vi.mocked(apiClient.post).mockResolvedValue({ data: labels });
  expect(await getModelLabels(payload)).toBe(labels);
  expect(apiClient.post).toHaveBeenCalledWith('/inventory/barcode-labels/by-model', payload);
});
it('preserves the unit-label endpoint and propagates rejected model requests', async () => {
  vi.mocked(apiClient.post).mockResolvedValueOnce({ data: [] }).mockRejectedValueOnce({ status: 403 });
  expect(await getBatchLabels(['unit'])).toEqual([]);
  expect(apiClient.post).toHaveBeenCalledWith('/hardware-items/barcode-labels/batch', { hardwareItemIds: ['unit'] });
  await expect(getModelLabels({ catalogId: 'model', copies: 1 })).rejects.toEqual({ status: 403 });
});
