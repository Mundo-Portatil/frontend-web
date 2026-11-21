import { Fragment } from 'react';
import { SECONDARY_BUTTON_CLASS, TEXT_INPUT_CLASS } from '../../../utils/formStyles';
import type { Location } from '../../foundation/locations/models';
import type { Category } from '../catalogModels';
import type { QuantityStockItem } from '../quantityModels';
import { ExpandableSerialsRow } from './ExpandableSerialsRow';

interface UnifiedStockTableProps {
  items: QuantityStockItem[];
  total: number;
  loading: boolean;
  page: number;
  limit: number;
  setPage: (page: number) => void;
  locationId: string;
  setLocationId: (id: string) => void;
  categoryId: string;
  setCategoryId: (id: string) => void;
  lowStock: boolean;
  setLowStock: (val: boolean) => void;
  includeZeroStock: boolean;
  setIncludeZeroStock: (val: boolean) => void;
  search?: string;
  setSearch?: (val: string) => void;
  locations: Location[];
  categories: Category[];
  serialsCache: Record<
    string,
    { loading: boolean; error: string | null; serials: any[]; expanded: boolean }
  >;
  toggleExpand: (catalogId: string, locationId: string) => void;
}

export function UnifiedStockTable({
  items,
  total,
  loading,
  page,
  limit,
  setPage,
  locationId,
  setLocationId,
  categoryId,
  setCategoryId,
  lowStock,
  setLowStock,
  includeZeroStock,
  setIncludeZeroStock,
  search = '',
  setSearch,
  locations,
  categories,
  serialsCache,
  toggleExpand,
}: UnifiedStockTableProps) {
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const handleClearFilters = () => {
    setSearch?.('');
    setLocationId('');
    setCategoryId('');
    setLowStock(false);
    setIncludeZeroStock(false);
  };

  return (
    <div className="space-y-4">
      {/* Filters bar */}
      <div className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 text-sm shadow-xs">
        {setSearch && (
          <div className="relative min-w-[220px] flex-1">
            <input
              id="filter-search"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por marca, modelo o cód. etiqueta…"
              className={`${TEXT_INPUT_CLASS} w-full py-1.5 pl-8 text-xs`}
            />
            <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
          </div>
        )}

        <div className="flex items-center gap-2">
          <label htmlFor="filter-location" className="font-medium text-slate-700">
            Ubicación:
          </label>
          <select
            id="filter-location"
            value={locationId}
            onChange={(e) => setLocationId(e.target.value)}
            className={`${TEXT_INPUT_CLASS} w-auto py-1 text-xs`}
          >
            <option value="">Todas</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="filter-category" className="font-medium text-slate-700">
            Categoría:
          </label>
          <select
            id="filter-category"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className={`${TEXT_INPUT_CLASS} w-auto py-1 text-xs`}
          >
            <option value="">Todas</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
          <input
            type="checkbox"
            checked={lowStock}
            onChange={(e) => setLowStock(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
          />
          <span className="font-medium">Solo stock bajo</span>
        </label>

        <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
          <input
            type="checkbox"
            checked={includeZeroStock}
            onChange={(e) => setIncludeZeroStock(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
          />
          <span className="font-medium">Incluir modelos sin stock (0)</span>
        </label>

        {(locationId || categoryId || lowStock || includeZeroStock || Boolean(search)) && (
          <button
            type="button"
            onClick={handleClearFilters}
            className={`${SECONDARY_BUTTON_CLASS} py-1 px-2.5 text-xs min-h-0 ml-auto`}
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-600">
            <tr>
              <th scope="col" className="px-4 py-3">PRODUCTO (MARCA / MODELO)</th>
              <th scope="col" className="px-4 py-3">CÓD. ETIQUETA</th>
              <th scope="col" className="px-4 py-3">UBICACIÓN</th>
              <th scope="col" className="px-4 py-3 text-center">STOCK</th>
              <th scope="col" className="px-4 py-3 text-right">P. VENTA</th>
              <th scope="col" className="px-4 py-3 text-right">ACCIONES</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && items.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  Cargando inventario…
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  No se encontraron productos en stock con los filtros seleccionados.
                </td>
              </tr>
            ) : (
              items.map((item) => {
                const key = `${item.catalogId}:${item.locationId}`;
                const isExpanded = serialsCache[key]?.expanded ?? false;

                return (
                  <Fragment key={item.id}>
                    <tr className="group hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-900">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => toggleExpand(item.catalogId, item.locationId)}
                            className="text-slate-400 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-500 rounded p-0.5"
                            title={isExpanded ? 'Ocultar series' : 'Ver series'}
                            aria-label={isExpanded ? 'Ocultar series' : 'Ver series'}
                          >
                            <svg
                              className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              aria-hidden="true"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 5l7 7-7 7"
                              />
                            </svg>
                          </button>
                          <span>
                            {item.catalogBrand} {item.catalogModel}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-600">{item.catalogSku}</td>
                      <td className="px-4 py-3 text-slate-700">{item.locationName}</td>
                      <td className="px-4 py-3 text-center font-bold">
                        <span className={item.isLowStock ? 'text-amber-600' : 'text-slate-900'}>
                          {item.quantity}
                        </span>
                        {item.isLowStock && (
                          <span
                            className="ml-1.5 inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[0.625rem] font-bold text-amber-800"
                            title="Stock menor o igual al umbral mínimo"
                          >
                            Stock bajo
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-slate-900">
                        {item.salePrice !== null ? `S/ ${item.salePrice.toFixed(2)}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => toggleExpand(item.catalogId, item.locationId)}
                          className={`${SECONDARY_BUTTON_CLASS} text-xs py-1 px-2.5 min-h-0`}
                        >
                          {isExpanded ? 'Ocultar series' : 'Ver series'}
                        </button>
                      </td>
                    </tr>

                    {isExpanded && (
                      <ExpandableSerialsRow
                        catalogId={item.catalogId}
                        locationId={item.locationId}
                        serials={serialsCache[key]?.serials ?? []}
                        loading={serialsCache[key]?.loading ?? false}
                        error={serialsCache[key]?.error ?? null}
                      />
                    )}
                  </Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-200 bg-white px-4 py-3 rounded-xl shadow-xs">
          <p className="text-xs text-slate-600">
            Mostrando página <span className="font-semibold">{page}</span> de{' '}
            <span className="font-semibold">{totalPages}</span> ({total} resultados)
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => setPage(page - 1)}
              className={`${SECONDARY_BUTTON_CLASS} text-xs py-1 px-3 min-h-0`}
            >
              Anterior
            </button>
            <button
              type="button"
              disabled={page >= totalPages || loading}
              onClick={() => setPage(page + 1)}
              className={`${SECONDARY_BUTTON_CLASS} text-xs py-1 px-3 min-h-0`}
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
