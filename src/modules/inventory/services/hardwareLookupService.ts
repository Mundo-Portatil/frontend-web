import { listLocations } from '../../foundation/locations/services/locationService';
import { getCatalogDetail } from './catalogService';
import { scanHardware } from './hardwareItemService';
import type { HardwareItem } from '../hardwareModels';

/** Scan returns IDs and relationships; resolve human-readable context separately. */
export async function lookupHardware(code: string, signal?: AbortSignal): Promise<HardwareItem> {
  const item = signal ? await scanHardware(code, signal) : await scanHardware(code);
  const [catalog, locations] = await Promise.allSettled([
    item.catalogName ? Promise.resolve(null) : Promise.resolve().then(() => getCatalogDetail(item.catalogId, signal)),
    item.locationName ? Promise.resolve(null) : Promise.resolve().then(() => listLocations(undefined, { signal, timeout: 10_000 })),
  ]);
  return {
    ...item,
    catalogName: item.catalogName ?? (catalog.status === 'fulfilled' ? catalog.value?.item.name : undefined),
    catalogSku: item.catalogSku ?? (catalog.status === 'fulfilled' ? catalog.value?.item.sku : undefined),
    locationName: item.locationName ?? (locations.status === 'fulfilled' ? locations.value?.find((location) => location.id === item.locationId)?.name : undefined),
  };
}
