import { useEffect, useMemo, useState } from 'react';
import { asAppError } from '../../../services/api/errors';
import {
  SECONDARY_BUTTON_CLASS,
  TEXT_INPUT_CLASS,
} from '../../../utils/formStyles';
import type { CatalogItem, Category } from '../catalogModels';
import type { QuantityStockItem } from '../quantityModels';
import { CatalogDecommissionModal } from '../components/CatalogDecommissionModal';
import { CatalogProductFormModal } from '../components/CatalogProductFormModal';
import { CatalogStockDetailModal } from '../components/CatalogStockDetailModal';
import { listCatalog } from '../services/catalogService';
import { listCategories } from '../services/categoryService';
import { listQuantityStock } from '../services/quantityStockService';

export function InventoryCatalogPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
  const [stockItems, setStockItems] = useState<QuantityStockItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState<string>('');
  const [filterCategoryId, setFilterCategoryId] = useState<string>('');

  // Modals state
  const [productFormItem, setProductFormItem] = useState<CatalogItem | null | undefined>(undefined);
  const [stockDetailCatalogId, setStockDetailCatalogId] = useState<string | null>(null);
  const [decommissionItem, setDecommissionItem] = useState<CatalogItem | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [cats, catalogRes, stockRes] = await Promise.all([
        listCategories(),
        listCatalog({ limit: 100 }),
        listQuantityStock({ limit: 100 }),
      ]);
      setCategories(cats);
      setCatalogItems(catalogRes.items);
      setStockItems(stockRes.items);
    } catch (e) {
      setError(asAppError(e).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  // Compute aggregated stock by catalogId
  const stockByCatalogId = useMemo(() => {
    const map = new Map<string, { totalUnits: number; salePrice?: number }>();
    for (const stock of stockItems) {
      const current = map.get(stock.catalogId) ?? { totalUnits: 0, salePrice: undefined };
      current.totalUnits += stock.quantity;
      if (stock.salePrice !== null && stock.salePrice !== undefined && current.salePrice === undefined) {
        current.salePrice = stock.salePrice;
      }
      map.set(stock.catalogId, current);
    }
    return map;
  }, [stockItems]);

  // Categories lookup map
  const categoryMap = useMemo(() => {
    return new Map<string, string>(categories.map((c) => [c.id, c.name]));
  }, [categories]);

  // Filtered & Sorted items:
  // Requirement: "Ordena siempre los productos dados de baja (active === false) al final de la lista."
  const filteredAndSortedItems = useMemo(() => {
    let list = [...catalogItems];

    if (filterCategoryId) {
      list = list.filter((i) => i.categoryId === filterCategoryId);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (i) =>
          i.brand.toLowerCase().includes(q) ||
          i.model.toLowerCase().includes(q) ||
          (i.sku && i.sku.toLowerCase().includes(q)),
      );
    }

    // Sort: active items first, inactive/decommissioned (active === false) strictly at the end
    list.sort((a, b) => {
      if (a.active === b.active) {
        return `${a.brand} ${a.model}`.localeCompare(`${b.brand} ${b.model}`);
      }
      return a.active ? -1 : 1;
    });

    return list;
  }, [catalogItems, filterCategoryId, search]);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Catálogo de Productos</h2>
          <p className="mt-1 text-sm text-slate-500">
            Administre especificaciones de modelos, precios base, códigos de etiqueta y existencias físicas.
          </p>
        </div>
      </header>

      {error && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[260px]">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por marca, modelo o código de etiqueta…"
              className={`${TEXT_INPUT_CLASS} max-w-md`}
            />

            <select
              value={filterCategoryId}
              onChange={(e) => setFilterCategoryId(e.target.value)}
              className={`${TEXT_INPUT_CLASS} w-auto`}
              aria-label="Filtrar por categoría"
            >
              <option value="">Todas las categorías</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => void loadData()}
            disabled={loading}
            className={SECONDARY_BUTTON_CLASS}
          >
            Actualizar
          </button>
        </div>

        {/* Enriched Table */}
        <div
          role="region"
          aria-label="Listado de catálogo"
          tabIndex={0}
          className="overflow-x-auto rounded-lg border border-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50"
        >
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 font-semibold uppercase text-xs text-slate-600">
              <tr>
                <th scope="col" className="px-4 py-3">Marca y Modelo</th>
                <th scope="col" className="px-4 py-3">Categoría</th>
                <th scope="col" className="px-4 py-3">Cód. Etiqueta</th>
                <th scope="col" className="px-4 py-3 text-right">Precios</th>
                <th scope="col" className="px-4 py-3 text-center">Cantidad en Stock</th>
                <th scope="col" className="px-4 py-3 text-center">Estado</th>
                <th scope="col" className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading && catalogItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    Cargando catálogo maestro…
                  </td>
                </tr>
              ) : filteredAndSortedItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    No se encontraron productos en el catálogo.
                  </td>
                </tr>
              ) : (
                filteredAndSortedItems.map((item) => {
                  const stockInfo = stockByCatalogId.get(item.id);
                  const totalUnits = stockInfo?.totalUnits ?? 0;
                  const categoryName = categoryMap.get(item.categoryId) || 'Sin categoría';
                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        !item.active ? 'bg-slate-50/50 opacity-75' : ''
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">
                          {item.brand} {item.model}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                          {categoryName}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-700">
                        {item.sku || '—'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <p className="font-medium text-slate-900">S/ {item.basePrice.toFixed(2)}</p>
                        {stockInfo?.salePrice !== undefined && (
                          <span className="text-[0.6875rem] text-slate-500 block">
                            Venta: S/ {stockInfo.salePrice.toFixed(2)}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`font-semibold ${
                            totalUnits > 0 ? 'text-slate-900' : 'text-slate-400'
                          }`}
                        >
                          {totalUnits} uds.
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            item.active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {item.active ? 'Activo' : 'Dado de baja'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setStockDetailCatalogId(item.id)}
                            className="whitespace-nowrap inline-flex items-center justify-center h-8 px-3 text-xs font-medium rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40"
                          >
                            Ver ficha
                          </button>
                          <button
                            type="button"
                            onClick={() => setProductFormItem(item)}
                            className="whitespace-nowrap inline-flex items-center justify-center h-8 px-3 text-xs font-medium rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40"
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => setDecommissionItem(item)}
                            className="whitespace-nowrap inline-flex items-center justify-center h-8 px-3 text-xs font-medium rounded-lg border border-slate-300 bg-white text-red-600 hover:bg-red-50 hover:border-red-200 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40"
                          >
                            Dar de baja
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Modal 1: Product Form (Create / Edit) */}
      {productFormItem !== undefined && (
        <CatalogProductFormModal
          categories={categories}
          initialItem={productFormItem}
          onClose={() => setProductFormItem(undefined)}
          onSaved={() => void loadData()}
        />
      )}

      {/* Modal 2: Stock Detail & Technical Specs */}
      {stockDetailCatalogId && (
        <CatalogStockDetailModal
          catalogId={stockDetailCatalogId}
          onClose={() => setStockDetailCatalogId(null)}
        />
      )}

      {/* Modal 3: Decommission Units / Deactivate Catalog Model */}
      {decommissionItem && (
        <CatalogDecommissionModal
          item={decommissionItem}
          onClose={() => setDecommissionItem(null)}
          onSuccess={() => void loadData()}
        />
      )}
    </div>
  );
}
