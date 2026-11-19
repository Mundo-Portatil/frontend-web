import { useCallback, useEffect, useState } from 'react';
import { asAppError, type AppError } from '../../../services/api/errors';
import { listQuantityStock } from '../services/quantityStockService';
import type { QuantityStockPageResult, QuantityStockQuery } from '../quantityModels';
export function useQuantityStock() {
  const [query, setQuery] = useState<QuantityStockQuery>({ page: 1, limit: 50 });
  const [revision, setRevision] = useState(0);
  const [data, setData] = useState<QuantityStockPageResult>({ items: [], total: 0, page: 1, limit: 50 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AppError | null>(null);
  const reload = useCallback(() => setRevision((value) => value + 1), []);
  useEffect(() => {
    const controller = new AbortController();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(null);
    void listQuantityStock(query, controller.signal).then((result) => {
      if (!controller.signal.aborted) setData(result);
    }).catch((reason: unknown) => {
      if (!controller.signal.aborted) setError(asAppError(reason));
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false);
    });
    return () => controller.abort();
  }, [query, revision]);
  return { query, setQuery, data, loading, error, reload };
}
