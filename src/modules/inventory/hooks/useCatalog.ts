import { useEffect, useState } from 'react';
import { asAppError, type AppError } from '../../../services/api/errors';
import { listCatalog } from '../services/catalogService';
import type { CatalogPageResult, CatalogQuery } from '../catalogModels';
export function useCatalog() {
  const [query, setQuery] = useState<CatalogQuery>({ page: 1, limit: 50 });
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState<CatalogPageResult>({ items: [], total: 0, page: 1, limit: 50 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AppError | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(null);
    void listCatalog(query, controller.signal).then((data) => {
      // A fresh items array makes the availability hook reload the page even
      // when the backend returns an equivalent payload after a manual reload.
      if (!controller.signal.aborted) setResult({ ...data, items: [...data.items] });
    }).catch((reason: unknown) => {
      if (!controller.signal.aborted) setError(asAppError(reason));
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [query, revision]);
  return { query, setQuery, result, loading, error, reload: () => setRevision((value) => value + 1) };
}
