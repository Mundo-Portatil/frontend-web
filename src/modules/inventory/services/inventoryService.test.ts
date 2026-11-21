import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '../../../services/api/axiosInstance';
import { getBarcodeLabelsByModel, inboundInventory } from './inventoryService';

vi.mock('../../../services/api/axiosInstance', () => ({
  apiClient: { post: vi.fn() },
}));

beforeEach(() => {
  vi.resetAllMocks();
});

describe('inventoryService contracts', () => {
  it('posts inbound inventory payload to /inventory/inbound', async () => {
    const responseData = {
      batchId: 'batch-123',
      locationId: 'loc-central',
      locationName: 'Almacén Central',
      totalItems: 1,
      totalUnits: 5,
      results: [],
      createdAt: '2026-11-21T00:00:00Z',
    };
    vi.mocked(apiClient.post).mockResolvedValue({ data: responseData });

    const payload = {
      items: [
        {
          catalogId: 'cat-1',
          quantity: 5,
          hasSerialNumbers: true,
          serialNumbers: ['SN-1', 'SN-2', 'SN-3', 'SN-4', 'SN-5'],
        },
      ],
      notes: 'Factura 1024',
    };

    const res = await inboundInventory(payload);
    expect(apiClient.post).toHaveBeenCalledWith('/inventory/inbound', payload);
    expect(res.batchId).toBe('batch-123');
  });

  it('generates barcode labels by model through POST /inventory/barcode-labels/by-model', async () => {
    const labelsData = [
      {
        barcodeValue: 'NB-ACER-001',
        title: 'Acer Aspire 5',
        specsSummary: '16GB RAM',
        locationName: 'Almacén Central',
        price: 2500,
      },
    ];
    vi.mocked(apiClient.post).mockResolvedValue({ data: labelsData });

    const res = await getBarcodeLabelsByModel({
      catalogId: 'cat-1',
      locationId: 'loc-1',
      copies: 3,
    });
    expect(apiClient.post).toHaveBeenCalledWith('/inventory/barcode-labels/by-model', {
      catalogId: 'cat-1',
      locationId: 'loc-1',
      copies: 3,
    });
    expect(res).toHaveLength(1);
    expect(res[0].barcodeValue).toBe('NB-ACER-001');
  });
});
