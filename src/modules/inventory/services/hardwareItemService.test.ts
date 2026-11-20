import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '../../../services/api/axiosInstance';
import { attachChildren, batchInbound, detachChild, scanHardware, validateSerials } from './hardwareItemService';
import { getBatchLabels } from './barcodeLabelService';
vi.mock('../../../services/api/axiosInstance', () => ({ apiClient: { get: vi.fn(), post: vi.fn(), delete: vi.fn() } }));
beforeEach(() => { vi.resetAllMocks(); vi.mocked(apiClient.get).mockResolvedValue({ data: { id: 'a' } }); vi.mocked(apiClient.post).mockResolvedValue({ data: [] }); vi.mocked(apiClient.delete).mockResolvedValue({ data: {} }); });
describe('hardware HTTP contracts', () => {
  it('preserves nested inbound DTO and validates series separately', async () => { const payload = { locationId: 'location', items: [{ catalogId: 'catalog', children: [{ catalogId: 'part', serialNumber: 'P1' }] }] }; await batchInbound(payload); expect(apiClient.post).toHaveBeenCalledWith('/hardware-items/batch-inbound', payload); await validateSerials(['P1']); expect(apiClient.post).toHaveBeenCalledWith('/hardware-items/validate-serials', { serialNumbers: ['P1'] }); });
  it('encodes scan paths and uses contracted child routes', async () => { await scanHardware('A/B'); expect(apiClient.get).toHaveBeenCalledWith('/hardware-items/scan/A%2FB', { signal: undefined }); await attachChildren('parent', ['child']); expect(apiClient.post).toHaveBeenCalledWith('/hardware-items/parent/children', { childIds: ['child'] }); await detachChild('parent', 'child'); expect(apiClient.delete).toHaveBeenCalledWith('/hardware-items/parent/children/child'); });
  it('requests label data with explicit IDs and propagates rejection', async () => { await getBatchLabels(['a']); expect(apiClient.post).toHaveBeenCalledWith('/hardware-items/barcode-labels/batch', { hardwareItemIds: ['a'] }); vi.mocked(apiClient.post).mockRejectedValue(new Error('offline')); await expect(getBatchLabels(['a'])).rejects.toThrow('offline'); });
});
