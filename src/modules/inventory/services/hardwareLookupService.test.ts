import { beforeEach, expect, it, vi } from 'vitest';
import { lookupHardware } from './hardwareLookupService';
import { scanHardware } from './hardwareItemService';
import { getCatalogDetail } from './catalogService';
import { listLocations } from '../../foundation/locations/services/locationService';
import type { HardwareItem } from '../hardwareModels';
import type { CatalogDetail } from '../catalogModels';
vi.mock('./hardwareItemService', () => ({ scanHardware: vi.fn() }));
vi.mock('./catalogService', () => ({ getCatalogDetail: vi.fn() }));
vi.mock('../../foundation/locations/services/locationService', () => ({ listLocations: vi.fn() }));
const item = { id: 'unit', catalogId: 'model', locationId: 'warehouse', serialNumber: 'SN', components: [{ id: 'child' }] } as HardwareItem;
beforeEach(() => vi.resetAllMocks());
it('resolves model and location names without changing the serial or relationships', async () => {
  vi.mocked(scanHardware).mockResolvedValue(item);
  vi.mocked(getCatalogDetail).mockResolvedValue({ item: { name: 'Acer A5', sku: 'NB' } } as CatalogDetail);
  vi.mocked(listLocations).mockResolvedValue([{ id: 'warehouse', name: 'Central' }] as Awaited<ReturnType<typeof listLocations>>);
  const result = await lookupHardware('SN');
  expect(listLocations).toHaveBeenCalledWith(undefined, { signal: undefined, timeout: 10_000 });
  expect(result).toMatchObject({ catalogName: 'Acer A5', catalogSku: 'NB', locationName: 'Central', serialNumber: 'SN', components: item.components });
});
it('keeps a valid unit visible when supplementary lookups fail and propagates scan failures', async () => {
  vi.mocked(scanHardware).mockResolvedValueOnce(item).mockRejectedValueOnce({ status: 404 });
  vi.mocked(getCatalogDetail).mockRejectedValue(new Error('Offline'));
  vi.mocked(listLocations).mockRejectedValue(new Error('Offline'));
  expect(await lookupHardware('SN')).toMatchObject(item);
  await expect(lookupHardware('missing')).rejects.toEqual({ status: 404 });
});
