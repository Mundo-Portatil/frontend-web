import { useEffect, useRef, useState } from 'react';
import { EmptyState } from '../../../components/feedback/EmptyState';
import { ErrorState } from '../../../components/feedback/ErrorState';
import { LoadingState } from '../../../components/feedback/LoadingState';
import { Notification } from '../../../components/notifications/Notification';
import { asAppError, type AppError } from '../../../services/api/errors';
import {
  LABEL_CLASS,
  SECONDARY_BUTTON_CLASS,
  TEXT_INPUT_CLASS,
} from '../../../utils/formStyles';
import { listLocations } from '../../foundation/locations/services/locationService';
import type { Location } from '../../foundation/locations/models';
import { listCategories } from '../services/categoryService';
import type { Category } from '../models';
import type { QuantityStock, QuantityStockQuery } from '../quantityModels';
import { useQuantityStock } from '../hooks/useQuantityStock';
import { CatalogProductPicker } from '../components/CatalogProductPicker';
import { listHardwareUnits } from '../services/hardwareReadService';
import { getCatalogDetail } from '../services/catalogService';
import type { HardwareItem } from '../hardwareModels';
import type { CatalogItem } from '../catalogModels';

interface UnifiedStockRow {
  id: string;
  catalogId: string;
  catalogBrand?: string;
  catalogModel?: string;
  catalogName?: string;
  catalogSku?: string;
  locationId: string;
  locationName?: string;
  controlType: 'serial' | 'quantity';
  quantity: number;
  costPrice: number | null;
  salePrice: number | null;
  minStockThreshold?: number;
  isLowStock?: boolean;
  updatedAt: string;
  matchingUnits?: HardwareItem[];
}

export function QuantityStockPage() {
  const { query, setQuery, data, loading: quantityLoading, error: quantityError, reload: reloadQuantity } = useQuantityStock();
  const [locations, setLocations] = useState<Location[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [referenceError, setReferenceError] = useState<AppError | null>(null);
  const [referenceRevision, setReferenceRevision] = useState(0);
  const [referenceLoading, setReferenceLoading] = useState(true);
  const [limit, setLimit] = useState('50');
  const [filterError, setFilterError] = useState<string | null>(null);
  const [filterKey, setFilterKey] = useState(0);

  // Additional filters for unified stock
  const [controlType, setControlType] = useState<'ALL' | 'SERIAL' | 'QUANTITY'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [hardwareItems, setHardwareItems] = useState<HardwareItem[]>([]);
  const [hardwareLoading, setHardwareLoading] = useState(false);
  const [hardwareError, setHardwareError] = useState<AppError | null>(null);
  const [hardwareRevision, setHardwareRevision] = useState(0);

  // Serial units modal state
  const [activeUnitsRow, setActiveUnitsRow] = useState<UnifiedStockRow | null>(null);
  const unitsCloseButtonRef = useRef<HTMLButtonElement>(null);

  // Catalog item lookup cache for serialized products to resolve brand/model/sku/price
  const [catalogCache, setCatalogCache] = useState<Record<string, CatalogItem>>({});

  useEffect(() => {
    let ignore = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReferenceLoading(true);
    setReferenceError(null);
    void Promise.all([listLocations(), listCategories()])
      .then(([places, groups]) => {
        if (!ignore) {
          setLocations(places);
          setCategories(groups);
        }
      })
      .catch((failure: unknown) => {
        if (!ignore) setReferenceError(asAppError(failure));
      })
      .finally(() => {
        if (!ignore) setReferenceLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [referenceRevision]);

  // Load hardware items when controlType is ALL or SERIAL
  useEffect(() => {
    if (controlType === 'QUANTITY') {
      setHardwareItems([]);
      setHardwareLoading(false);
      return;
    }
    const controller = new AbortController();
    setHardwareLoading(true);
    setHardwareError(null);
    void listHardwareUnits(
      {
        locationId: query.locationId,
        categoryId: query.categoryId,
        catalogItemId: query.catalogItemId,
        search: searchQuery.trim() || undefined,
        status: 'EN_STOCK',
        onlyParents: true,
        page: 1,
        limit: 1000,
      },
      controller.signal,
    )
      .then((res) => {
        if (!controller.signal.aborted) {
          setHardwareItems(res.items);
        }
      })
      .catch((err: unknown) => {
        if (!controller.signal.aborted) {
          setHardwareError(asAppError(err));
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setHardwareLoading(false);
        }
      });
    return () => controller.abort();
  }, [controlType, query.locationId, query.categoryId, query.catalogItemId, searchQuery, hardwareRevision]);

  // Fetch catalog details for unique serialized catalogIds not yet in catalogCache
  useEffect(() => {
    if (!hardwareItems.length) return;
    const controller = new AbortController();
    const neededIds = [
      ...new Set(
        hardwareItems
          .map((item) => item.catalogId)
          .filter((id) => id && !catalogCache[id]),
      ),
    ];
    if (!neededIds.length) return;

    let next = 0;
    async function worker() {
      while (!controller.signal.aborted && next < neededIds.length) {
        const id = neededIds[next++];
        try {
          const detail = await getCatalogDetail(id, controller.signal);
          if (!controller.signal.aborted && detail?.item) {
            setCatalogCache((prev) => ({ ...prev, [id]: detail.item }));
          }
        } catch {
          // Keep best effort
        }
      }
    }

    void Promise.all(Array.from({ length: Math.min(4, neededIds.length) }, () => worker()));
    return () => controller.abort();
  }, [hardwareItems, catalogCache]);

  // Accessibility: focus close button when modal opens
  useEffect(() => {
    if (activeUnitsRow) {
      unitsCloseButtonRef.current?.focus();
    }
  }, [activeUnitsRow]);

  function updateFilters(updates: Partial<QuantityStockQuery>) {
    setQuery((current) => ({ ...current, ...updates, page: 1 }));
  }

  function clearFilters() {
    setLimit('50');
    setFilterError(null);
    setFilterKey((value) => value + 1);
    setControlType('ALL');
    setSearchQuery('');
    setQuery({ page: 1, limit: 50 });
  }

  function reloadAll() {
    reloadQuantity();
    setHardwareRevision((v) => v + 1);
  }

  // Aggregate hardware items by catalogId and locationId
  const serializedRows: UnifiedStockRow[] = [];
  if (controlType !== 'QUANTITY') {
    const map = new Map<string, { items: HardwareItem[]; catalogId: string; locationId: string }>();
    for (const item of hardwareItems) {
      const key = `${item.catalogId}_${item.locationId}`;
      let group = map.get(key);
      if (!group) {
        group = { items: [], catalogId: item.catalogId, locationId: item.locationId };
        map.set(key, group);
      }
      group.items.push(item);
    }

    for (const [key, group] of map.entries()) {
      const first = group.items[0];
      const locName = locations.find((l) => l.id === group.locationId)?.name ?? first.locationName ?? 'Ubicación no disponible';
      const cat = catalogCache[group.catalogId];

      const catalogBrand = cat?.brand ?? undefined;
      const catalogModel = cat?.model ?? undefined;
      const catalogName = cat?.name ?? first.catalogName ?? undefined;
      const catalogSku = cat?.sku ?? first.catalogSku ?? undefined;

      // Price: if individual units have different non-null salePrices, or from basePrice
      const prices = group.items.map((i) => i.salePrice).filter((p): p is number => p !== null && p !== undefined);
      const uniquePrices = [...new Set(prices)];
      const resolvedSalePrice = uniquePrices.length === 1 ? uniquePrices[0] : uniquePrices.length > 1 ? null : cat?.basePrice ?? null;

      serializedRows.push({
        id: `serial_${key}`,
        catalogId: group.catalogId,
        catalogBrand,
        catalogModel,
        catalogName,
        catalogSku,
        locationId: group.locationId,
        locationName: locName,
        controlType: 'serial',
        quantity: group.items.length,
        costPrice: first.costPrice,
        salePrice: resolvedSalePrice,
        updatedAt: first.updatedAt || first.createdAt,
        matchingUnits: group.items,
      });
    }
  }

  // Filter quantity items if controlType is SERIAL or text search is applied
  let quantityItems: QuantityStock[] = controlType === 'SERIAL' ? [] : data.items;
  if (searchQuery.trim()) {
    const q = searchQuery.trim().toLowerCase();
    quantityItems = quantityItems.filter(
      (item) =>
        (item.catalogBrand && item.catalogBrand.toLowerCase().includes(q)) ||
        (item.catalogModel && item.catalogModel.toLowerCase().includes(q)) ||
        (item.catalogName && item.catalogName.toLowerCase().includes(q)) ||
        (item.catalogSku && item.catalogSku.toLowerCase().includes(q)),
    );
  }

  const quantityRows: UnifiedStockRow[] = quantityItems.map((item) => ({
    id: `qty_${item.id}`,
    catalogId: item.catalogId,
    catalogBrand: item.catalogBrand,
    catalogModel: item.catalogModel,
    catalogName: item.catalogName,
    catalogSku: item.catalogSku,
    locationId: item.locationId,
    locationName: item.locationName,
    controlType: 'quantity',
    quantity: item.quantity,
    costPrice: item.costPrice,
    salePrice: item.salePrice,
    minStockThreshold: item.minStockThreshold,
    isLowStock: item.isLowStock,
    updatedAt: item.updatedAt,
  }));

  const allRows: UnifiedStockRow[] = [...serializedRows, ...quantityRows];

  const secondaryFilterCount =
    Number(Boolean(query.categoryId)) +
    Number(Boolean(query.lowStock)) +
    Number(controlType !== 'ALL') +
    Number(Boolean(searchQuery.trim())) +
    Number(query.limit !== 50);

  const hasFilters = Boolean(
    query.locationId ||
      query.categoryId ||
      query.catalogItemId ||
      query.lowStock ||
      controlType !== 'ALL' ||
      searchQuery.trim() ||
      query.limit !== 50,
  );

  const loading = quantityLoading || hardwareLoading;
  const error = quantityError || hardwareError;

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Existencias por ubicación</h2>
          <p className="mt-1 text-sm text-slate-500">
            Consulta de productos disponibles (por serie y por cantidad) por ubicación.
          </p>
        </div>
      </header>

      {referenceError && (
        <ErrorState
          error={referenceError}
          onRetry={() => setReferenceRevision((value) => value + 1)}
        />
      )}
      {referenceLoading && <LoadingState message="Cargando ubicaciones y categorías…" />}

      <section aria-label="Filtros de existencias" className="min-w-0 rounded-xl border border-slate-200 bg-white p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-semibold text-slate-900">Buscar productos disponibles</h3>
          <div className="flex flex-wrap gap-2">
            {hasFilters && <button type="button" className={SECONDARY_BUTTON_CLASS} onClick={clearFilters}>Limpiar filtros</button>}
            <button type="button" className={SECONDARY_BUTTON_CLASS} onClick={reloadAll} disabled={loading}>Actualizar</button>
          </div>
        </div>
        <div className="grid min-w-0 gap-3 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <CatalogProductPicker
            key={filterKey}
            id="quantity-product-filter"
            activeOnly={false}
            label="Filtrar por producto"
            onChange={(catalogItemId) => updateFilters({ catalogItemId: catalogItemId || undefined })}
          />
          <div className="min-w-0">
            <label htmlFor="quantity-location-filter" className={LABEL_CLASS}>Filtrar por ubicación</label>
            <select
              id="quantity-location-filter"
              value={query.locationId ?? ''}
              onChange={(event) => updateFilters({ locationId: event.target.value || undefined })}
              className={TEXT_INPUT_CLASS}
            >
              <option value="">Todas las ubicaciones</option>
              {locations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name}{location.active ? '' : ' (inactiva)'}
                </option>
              ))}
            </select>
          </div>
        </div>
        <details className="mt-3 border-t border-slate-100 pt-3">
          <summary className="w-fit cursor-pointer rounded text-sm font-medium text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">
            Más filtros{secondaryFilterCount ? ` (${secondaryFilterCount})` : ''}
          </summary>
          <div className="mt-3 grid min-w-0 items-end gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="min-w-0">
              <label htmlFor="stock-control-type" className={LABEL_CLASS}>Tipo de control</label>
              <select
                id="stock-control-type"
                value={controlType}
                onChange={(e) => setControlType(e.target.value as 'ALL' | 'SERIAL' | 'QUANTITY')}
                className={TEXT_INPUT_CLASS}
              >
                <option value="ALL">Todos los tipos</option>
                <option value="SERIAL">Por serie</option>
                <option value="QUANTITY">Por cantidad</option>
              </select>
            </div>
            <div className="min-w-0">
              <label htmlFor="stock-search" className={LABEL_CLASS}>Búsqueda (marca, modelo, serie)</label>
              <input
                id="stock-search"
                type="text"
                placeholder="Buscar por texto o serie…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={TEXT_INPUT_CLASS}
              />
            </div>
            <div className="min-w-0">
              <label htmlFor="quantity-category-filter" className={LABEL_CLASS}>Filtrar por categoría</label>
              <select
                id="quantity-category-filter"
                value={query.categoryId ?? ''}
                onChange={(event) => updateFilters({ categoryId: event.target.value || undefined })}
                className={TEXT_INPUT_CLASS}
              >
                <option value="">Todas las categorías</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="min-w-0">
              <label htmlFor="quantity-limit" className={LABEL_CLASS}>Registros por página</label>
              <input
                id="quantity-limit"
                type="number"
                min="1"
                step="1"
                value={limit}
                className={TEXT_INPUT_CLASS}
                onChange={(event) => {
                  const next = event.target.value;
                  setLimit(next);
                  if (!next.trim() || !Number.isSafeInteger(Number(next)) || Number(next) < 1) {
                    setFilterError('Indica un número entero mayor que cero.');
                    return;
                  }
                  setFilterError(null);
                  updateFilters({ limit: Number(next) });
                }}
              />
            </div>
          </div>
          <div className="mt-3">
            <label className="flex min-h-10 items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={query.lowStock ?? false}
                onChange={(event) => updateFilters({ lowStock: event.target.checked || undefined })}
                className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              Solo stock bajo
            </label>
          </div>
          {filterError && <div className="mt-3"><Notification kind="error">{filterError}</Notification></div>}
        </details>
      </section>

      {error ? (
        <ErrorState error={error} onRetry={reloadAll} />
      ) : loading ? (
        <LoadingState message="Cargando existencias…" />
      ) : (
        <>
          {!allRows.length ? (
            <div className="space-y-2">
              <EmptyState message="No hay existencias para estos filtros." />
              <p className="text-sm text-slate-600">
                {hasFilters
                  ? 'Prueba otra ubicación o limpia los filtros.'
                  : 'Los productos del catálogo aparecen aquí después de registrar cantidades.'}
              </p>
            </div>
          ) : (
            <div
              className="overflow-x-auto rounded-xl border border-slate-200 bg-white"
              role="region"
              aria-label="Listado de existencias"
              tabIndex={0}
            >
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50">
                  <tr className="text-left text-slate-600">
                    <th scope="col" className="px-4 py-3 font-medium">Producto</th>
                    <th scope="col" className="px-4 py-3 font-medium">Control</th>
                    <th scope="col" className="px-4 py-3 font-medium">Ubicación</th>
                    <th scope="col" className="px-4 py-3 font-medium text-right">Cantidad disponible</th>
                    <th scope="col" className="px-4 py-3 font-medium text-right">Precio</th>
                    <th scope="col" className="px-4 py-3 font-medium text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {allRows.map((item) => {
                    const displayName =
                      [item.catalogBrand, item.catalogModel].filter(Boolean).join(' ') ||
                      item.catalogName ||
                      item.catalogSku ||
                      'Producto';

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-4 py-3 min-w-[220px]">
                          <div className="font-medium text-slate-900 leading-snug">{displayName}</div>
                          <div className="text-xs text-slate-500 font-mono mt-0.5">
                            {item.catalogSku ? `Código: ${item.catalogSku}` : '—'}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              item.controlType === 'serial'
                                ? 'bg-slate-100 text-slate-700'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {item.controlType === 'serial' ? 'Por serie' : 'Por cantidad'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-700 whitespace-nowrap">
                          {item.locationName ?? 'Ubicación no disponible'}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-slate-900 tabular-nums">
                          {item.quantity}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-700 tabular-nums">
                          {item.salePrice !== null && item.salePrice !== undefined ? item.salePrice : '—'}
                        </td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          {item.controlType === 'serial' ? (
                            <button
                              type="button"
                              className={SECONDARY_BUTTON_CLASS}
                              onClick={() => setActiveUnitsRow(item)}
                              aria-haspopup="dialog"
                            >
                              Ver unidades
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Modal de consulta de unidades por serie */}
          {activeUnitsRow && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
              role="dialog"
              aria-modal="true"
              aria-labelledby="units-modal-title"
              onKeyDown={(e) => {
                if (e.key === 'Escape') setActiveUnitsRow(null);
              }}
            >
              <div
                className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-xl bg-white shadow-xl"
                tabIndex={-1}
              >
                <header className="flex items-start justify-between border-b border-slate-200 px-5 py-4">
                  <div>
                    <h3 id="units-modal-title" className="text-base font-semibold text-slate-900">
                      Unidades disponibles
                    </h3>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {[activeUnitsRow.catalogBrand, activeUnitsRow.catalogModel].filter(Boolean).join(' ') ||
                        activeUnitsRow.catalogName ||
                        'Producto'}
                      {activeUnitsRow.catalogSku ? ` (${activeUnitsRow.catalogSku})` : ''} · {activeUnitsRow.locationName}
                    </p>
                  </div>
                  <button
                    ref={unitsCloseButtonRef}
                    type="button"
                    className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                    onClick={() => setActiveUnitsRow(null)}
                    aria-label="Cerrar ventana de unidades"
                  >
                    ✕
                  </button>
                </header>

                <div className="flex-1 overflow-y-auto p-5">
                  <div className="mb-3 flex items-center justify-between text-xs text-slate-500">
                    <span>Total de unidades: <strong className="text-slate-800">{activeUnitsRow.matchingUnits?.length ?? 0}</strong></span>
                    <span>Ubicación: <strong className="text-slate-800">{activeUnitsRow.locationName}</strong></span>
                  </div>

                  <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white">
                    {(activeUnitsRow.matchingUnits ?? []).map((unit, index) => (
                      <li key={unit.id} className="flex items-center justify-between px-3 py-2 text-sm hover:bg-slate-50">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400 font-mono w-6">{index + 1}.</span>
                          <span className="font-mono font-medium text-slate-800">{unit.serialNumber}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                          {unit.salePrice !== null && unit.salePrice !== undefined && (
                            <span className="tabular-nums">Precio: {unit.salePrice}</span>
                          )}
                          <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 font-medium text-emerald-700 ring-1 ring-emerald-600/20">
                            En stock
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                <footer className="flex justify-end border-t border-slate-200 bg-slate-50 px-5 py-3">
                  <button
                    type="button"
                    className={SECONDARY_BUTTON_CLASS}
                    onClick={() => setActiveUnitsRow(null)}
                  >
                    Cerrar
                  </button>
                </footer>
              </div>
            </div>
          )}
          <nav
            aria-label="Paginación de stock"
            className="flex flex-wrap items-center justify-between gap-3"
          >
            <p className="text-sm text-slate-600">
              Página {data.page} · {data.total + serializedRows.length} registros
            </p>
            <div className="flex gap-2">
              <button
                className={SECONDARY_BUTTON_CLASS}
                disabled={data.page <= 1}
                onClick={() => setQuery({ ...query, page: data.page - 1 })}
              >
                Anterior
              </button>
              <button
                className={SECONDARY_BUTTON_CLASS}
                disabled={data.page * data.limit >= data.total}
                onClick={() => setQuery({ ...query, page: data.page + 1 })}
              >
                Siguiente
              </button>
            </div>
          </nav>
        </>
      )}
    </section>
  );
}
