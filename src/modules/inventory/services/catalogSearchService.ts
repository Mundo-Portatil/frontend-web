import { asAppError } from '../../../services/api/errors';
import type { CatalogDetail, CatalogPageResult, CatalogQuery } from '../catalogModels';
import type { HardwareItem } from '../hardwareModels';
import { listCatalog, getCatalogDetail } from './catalogService';
import { scanHardware } from './hardwareItemService';
import { listLocations } from '../../foundation/locations/services/locationService';

export interface CatalogSearchResult {
  result: CatalogPageResult;
  unit?: HardwareItem;
  detail?: CatalogDetail;
  unitError?: string;
}

/** Resolve a series through its catalogId, never by copying the unit into the catalogue. */
export async function searchCatalog(query: CatalogQuery, searchUnits: boolean, signal: AbortSignal): Promise<CatalogSearchResult> {
  if (!searchUnits || !query.search) return { result: await listCatalog(query, signal) };
  const [catalog, scan] = await Promise.allSettled([
    listCatalog(query, signal), scanHardware(query.search, signal),
  ]);
  if (signal.aborted) throw new DOMException('Search cancelled', 'AbortError');
  if (scan.status === 'fulfilled') {
    const detail = await getCatalogDetail(scan.value.catalogId, signal);
    const model = detail.item;
    const matches = (!query.categoryId || model.categoryId === query.categoryId)
      && (query.active === undefined || model.active === query.active);
    const page = query.page ?? 1;
    const result = { items: matches && page === 1 ? [model] : [], total: matches ? 1 : 0, page, limit: query.limit ?? 50 };
    if (!matches || page !== 1) return { result };
    let locationName = scan.value.locationName ?? detail.stockSummary.find((location) => location.locationId === scan.value.locationId)?.locationName;
    if (!locationName) {
      try { locationName = (await listLocations(undefined, { signal, timeout: 10_000 })).find((location) => location.id === scan.value.locationId)?.name; }
      catch { /* A missing location label must not hide a valid model or unit. */ }
    }
    return { result, detail, unit: { ...scan.value, catalogName: model.name, catalogSku: model.sku, locationName } };
  }
  if (catalog.status === 'rejected') throw catalog.reason;
  const failure = asAppError(scan.reason);
  let result = catalog.value;
  const words = query.search.trim().split(/\s+/);
  // The API searches brand/model separately. For a displayed combined name,
  // enumerate real candidates before filtering and paginating the full set.
  if (result.total === 0 && words.length > 1) {
    const token = [...words].sort((a, b) => b.length - a.length)[0];
    const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase().replace(/\s+/g, ' ').trim();
    const term = normalize(query.search);
    const matches = new Map<string, CatalogDetail['item']>();
    let loaded = 0;
    for (let page = 1; ; page += 1) {
      if (signal.aborted) throw new DOMException('Search cancelled', 'AbortError');
      const candidates = await listCatalog({ ...query, search: token, page, limit: 50 }, signal);
      for (const candidate of candidates.items) {
        if (normalize(candidate.name || `${candidate.brand} ${candidate.model}`).includes(term)) matches.set(candidate.id, candidate);
      }
      loaded += candidates.items.length;
      if (loaded >= candidates.total) break;
      if (!candidates.items.length) throw new Error('No se pudo completar la búsqueda. Intenta nuevamente.');
    }
    const items = [...matches.values()];
    const page = query.page ?? 1; const limit = query.limit ?? 50;
    result = { items: items.slice((page - 1) * limit, page * limit), total: items.length, page, limit };
  }
  return { result, ...(failure.status === 404 ? {} : { unitError: failure.message }) };
}
