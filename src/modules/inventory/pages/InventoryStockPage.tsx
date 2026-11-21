import { useEffect, useState } from 'react';
import type { Location } from '../../foundation/locations/models';
import { listActiveLocations } from '../../foundation/locations/services/locationService';
import type { Category } from '../catalogModels';
import { ScannerQuickLookupBar } from '../components/ScannerQuickLookupBar';
import { UnifiedStockTable } from '../components/UnifiedStockTable';
import { useUnifiedStock } from '../hooks/useUnifiedStock';
import { listCategories } from '../services/categoryService';

export function InventoryStockPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const {
    items,
    total,
    loading,
    error,
    page,
    setPage,
    limit,
    locationId,
    setLocationId,
    categoryId,
    setCategoryId,
    lowStock,
    setLowStock,
    includeZeroStock,
    setIncludeZeroStock,
    search,
    setSearch,
    serialsCache,
    toggleExpand,
  } = useUnifiedStock();

  useEffect(() => {
    let active = true;
    void listActiveLocations().then((locs) => {
      if (active) setLocations(locs);
    });
    void listCategories({ active: true }).then((cats) => {
      if (active) setCategories(cats);
    });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-xl font-bold text-slate-900">Stock e Inventario</h2>
        <p className="mt-1 text-sm text-slate-500">
          Consulta rápida de existencias, lector de códigos de barra y detalle de series en almacenes.
        </p>
      </header>

      {/* Scanner-First Quick Bar */}
      <ScannerQuickLookupBar />

      {error && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Main Stock Table */}
      <UnifiedStockTable
        items={items}
        total={total}
        loading={loading}
        page={page}
        limit={limit}
        setPage={setPage}
        locationId={locationId}
        setLocationId={setLocationId}
        categoryId={categoryId}
        setCategoryId={setCategoryId}
        lowStock={lowStock}
        setLowStock={setLowStock}
        includeZeroStock={includeZeroStock}
        setIncludeZeroStock={setIncludeZeroStock}
        search={search}
        setSearch={setSearch}
        locations={locations}
        categories={categories}
        serialsCache={serialsCache}
        toggleExpand={toggleExpand}
      />
    </div>
  );
}
