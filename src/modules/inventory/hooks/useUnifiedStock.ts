import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { asAppError } from '../../../services/api/errors';
import type { CatalogItem } from '../catalogModels';
import type { AvailableSerial, QuantityStockItem, QuantityStockQuery } from '../models';
import { listCatalog } from '../services/catalogService';
import { getAvailableSerials } from '../services/hardwareItemService';
import { listQuantityStock } from '../services/quantityStockService';

interface SerialsCacheEntry {
  loading: boolean;
  error: string | null;
  serials: AvailableSerial[];
  expanded: boolean;
}

export function useUnifiedStock() {
  const [locationId, setLocationId] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [lowStock, setLowStock] = useState<boolean>(false);
  const [includeZeroStock, setIncludeZeroStock] = useState<boolean>(false);
  const [search, setSearch] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(20);

  const [items, setItems] = useState<QuantityStockItem[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [serialsCache, setSerialsCache] = useState<Record<string, SerialsCacheEntry>>({});
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchStock = useCallback(async () => {
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setError(null);

    const query: QuantityStockQuery = {
      page,
      limit,
      ...(locationId ? { locationId } : {}),
      ...(categoryId ? { categoryId } : {}),
      ...(lowStock ? { lowStock: true } : {}),
    };

    try {
      const stockData = await listQuantityStock(query, controller.signal);
      let stockItems = stockData.items;
      let totalCount = stockData.total;

      // If user wants to include catalog items with 0 stock
      if (includeZeroStock) {
        try {
          const catalogData = await listCatalog(
            {
              limit: 100,
              ...(categoryId ? { categoryId } : {}),
            },
            controller.signal,
          );

          // Find catalog models that have no entries in current stockItems
          const existingCatalogIds = new Set(stockItems.map((s) => s.catalogId));
          const zeroStockCatalogItems = catalogData.items.filter(
            (c: CatalogItem) => !existingCatalogIds.has(c.id),
          );

          const zeroItems: QuantityStockItem[] = zeroStockCatalogItems.map((c: CatalogItem) => ({
            id: `zero-${c.id}`,
            catalogId: c.id,
            catalogBrand: c.brand,
            catalogModel: c.model,
            catalogSku: c.sku ?? '',
            categoryId: c.categoryId,
            locationId: locationId || 'sin-almacen',
            locationName: 'Sin existencias (0)',
            quantity: 0,
            costPrice: null,
            salePrice: c.basePrice,
            minStockThreshold: c.minStockThreshold,
            isLowStock: true,
            updatedAt: '',
          }));

          stockItems = [...stockItems, ...zeroItems];
          totalCount += zeroItems.length;
        } catch {
          // If catalog fetch fails, keep raw stock items
        }
      }

      if (!controller.signal.aborted) {
        setItems(stockItems);
        setTotal(totalCount);
      }
    } catch (e) {
      if (!controller.signal.aborted) {
        setError(asAppError(e).message);
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, [locationId, categoryId, lowStock, includeZeroStock, page, limit]);

  useEffect(() => {
    void fetchStock();
    return () => {
      abortControllerRef.current?.abort();
    };
  }, [fetchStock]);

  const loadSerials = useCallback(async (catalogId: string, itemLocationId: string) => {
    const key = `${catalogId}:${itemLocationId}`;
    setSerialsCache((prev) => ({
      ...prev,
      [key]: {
        loading: true,
        error: null,
        serials: prev[key]?.serials ?? [],
        expanded: true,
      },
    }));

    try {
      const serials = await getAvailableSerials({
        catalogId,
        locationId: itemLocationId === 'sin-almacen' ? undefined : itemLocationId,
      });
      setSerialsCache((prev) => ({
        ...prev,
        [key]: {
          loading: false,
          error: null,
          serials,
          expanded: true,
        },
      }));
    } catch (e) {
      setSerialsCache((prev) => ({
        ...prev,
        [key]: {
          loading: false,
          error: asAppError(e).message,
          serials: prev[key]?.serials ?? [],
          expanded: true,
        },
      }));
    }
  }, []);

  const toggleExpand = useCallback(
    (catalogId: string, itemLocationId: string) => {
      const key = `${catalogId}:${itemLocationId}`;
      const entry = serialsCache[key];

      if (!entry) {
        void loadSerials(catalogId, itemLocationId);
      } else {
        setSerialsCache((prev) => ({
          ...prev,
          [key]: {
            ...prev[key],
            expanded: !prev[key].expanded,
          },
        }));
      }
    },
    [serialsCache, loadSerials],
  );

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (item) =>
        item.catalogBrand.toLowerCase().includes(q) ||
        item.catalogModel.toLowerCase().includes(q) ||
        item.catalogSku.toLowerCase().includes(q),
    );
  }, [items, search]);

  return {
    items: filteredItems,
    total: search.trim() ? filteredItems.length : total,
    loading,
    error,
    page,
    setPage,
    limit,
    search,
    setSearch: (val: string) => {
      setSearch(val);
      setPage(1);
    },
    locationId,
    setLocationId: (id: string) => {
      setLocationId(id);
      setPage(1);
    },
    categoryId,
    setCategoryId: (id: string) => {
      setCategoryId(id);
      setPage(1);
    },
    lowStock,
    setLowStock: (val: boolean) => {
      setLowStock(val);
      setPage(1);
    },
    includeZeroStock,
    setIncludeZeroStock: (val: boolean) => {
      setIncludeZeroStock(val);
      setPage(1);
    },
    serialsCache,
    toggleExpand,
    reload: fetchStock,
  };
}
