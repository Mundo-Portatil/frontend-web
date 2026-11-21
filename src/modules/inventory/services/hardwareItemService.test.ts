import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '../../../services/api/axiosInstance';
import {
  approveUsedItem,
  decommissionHardwareItem,
  getAvailableSerials,
  getHardwareLifecycle,
  listPendingSecondHand,
  scanHardware,
  updateHardwareItem,
  validateSerials,
} from './hardwareItemService';

vi.mock('../../../services/api/axiosInstance', () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(apiClient.get).mockResolvedValue({ data: [] });
  vi.mocked(apiClient.post).mockResolvedValue({ data: {} });
  vi.mocked(apiClient.patch).mockResolvedValue({ data: {} });
});

describe('hardwareItemService contracts', () => {
  it('scans hardware encoding the code parameter', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: { id: 'item-1', serialNumber: 'A/B' } });
    const res = await scanHardware('A/B');
    expect(apiClient.get).toHaveBeenCalledWith('/hardware-items/scan/A%2FB', { signal: undefined });
    expect(res.serialNumber).toBe('A/B');
  });

  it('validates series through POST /hardware-items/validate-serials', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ data: { existingSerials: [], allValid: true } });
    const res = await validateSerials(['SN-1', 'SN-2']);
    expect(apiClient.post).toHaveBeenCalledWith('/hardware-items/validate-serials', {
      serialNumbers: ['SN-1', 'SN-2'],
    });
    expect(res.allValid).toBe(true);
  });

  it('queries available serials with optional locationId', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: [{ id: 's1', serialNumber: 'SN-01' }] });
    const withLocation = await getAvailableSerials({ catalogId: 'cat-1', locationId: 'loc-1' });
    expect(apiClient.get).toHaveBeenCalledWith('/hardware-items/available-serials', {
      params: { catalogId: 'cat-1', locationId: 'loc-1' },
      signal: undefined,
    });
    expect(withLocation).toHaveLength(1);

    const withoutLocation = await getAvailableSerials({ catalogId: 'cat-1' });
    expect(apiClient.get).toHaveBeenCalledWith('/hardware-items/available-serials', {
      params: { catalogId: 'cat-1' },
      signal: undefined,
    });
    expect(withoutLocation).toHaveLength(1);
  });

  it('queries hardware lifecycle and extracts entries', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: {
        hardwareItem: { id: 'hw-1', status: 'EN_STOCK' },
        lifecycle: [{ id: 'log-1', action: 'BATCH_INBOUND_HARDWARE', description: 'Ingreso inicial' }],
      },
    });
    const res = await getHardwareLifecycle('hw-1');
    expect(apiClient.get).toHaveBeenCalledWith('/hardware-items/hw-1/lifecycle', { signal: undefined });
    expect(res.lifecycle).toHaveLength(1);
    expect(res.lifecycle[0].action).toBe('BATCH_INBOUND_HARDWARE');
  });

  it('decommissions hardware item with reason', async () => {
    vi.mocked(apiClient.patch).mockResolvedValue({ data: { id: 'hw-1', status: 'DE_BAJA' } });
    await decommissionHardwareItem('hw-1', 'Pieza rota');
    expect(apiClient.patch).toHaveBeenCalledWith('/hardware-items/hw-1/decommission', {
      reason: 'Pieza rota',
    });
  });

  it('updates hardware item salePrice and locationId', async () => {
    vi.mocked(apiClient.patch).mockResolvedValue({ data: { id: 'hw-1', salePrice: 1500 } });
    await updateHardwareItem('hw-1', { salePrice: 1500 });
    expect(apiClient.patch).toHaveBeenCalledWith('/hardware-items/hw-1', { salePrice: 1500 });
  });

  it('lists pending second hand items', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: [{ id: 'hw-used', status: 'SEGUNDA_MANO_PENDIENTE' }] });
    const res = await listPendingSecondHand();
    expect(apiClient.get).toHaveBeenCalledWith('/hardware-items', {
      params: { status: 'SEGUNDA_MANO_PENDIENTE' },
      signal: undefined,
    });
    expect(res).toHaveLength(1);
  });

  it('approves used item with exact itemId contract', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ data: { id: 'hw-used', status: 'EN_STOCK' } });
    await approveUsedItem({ itemId: 'hw-used', locationId: 'loc-central', salePrice: 120 });
    // Contract requirement: itemId, NOT hardwareItemId
    expect(apiClient.post).toHaveBeenCalledWith('/hardware-items/approve-used', {
      itemId: 'hw-used',
      locationId: 'loc-central',
      salePrice: 120,
    });
  });
});
