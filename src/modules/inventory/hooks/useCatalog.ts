import { useCallback, useEffect, useRef, useState } from 'react';
import { asAppError, type AppError } from '../../../services/api/errors';
import { searchCatalog, type CatalogSearchResult } from '../services/catalogSearchService';
import type { CatalogPageResult, CatalogQuery } from '../catalogModels';
export function useCatalog(searchUnits = false) {
  const [query, setQuery] = useState<CatalogQuery>({ page: 1, limit: 50 });
  const [revision, setRevision] = useState(0);
  const [snapshot, setSnapshot] = useState<CatalogSearchResult>({ result: { items: [], total: 0, page: 1, limit: 50 } });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AppError | null>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const applySearch = useCallback((value: string) => {
    const search = value.trim() || undefined;
    setQuery((current) => current.search === search && !controllerRef.current?.signal.aborted ? current : { ...current, search, page: 1 });
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    controllerRef.current = controller;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(null);
    void searchCatalog(query, searchUnits, controller.signal).then((data) => {
      if (!controller.signal.aborted) setSnapshot({ ...data, result: { ...data.result, items: [...data.result.items] } });
    }).catch((reason: unknown) => {
      if (!controller.signal.aborted) setError(asAppError(reason));
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [query, revision, searchUnits]);
  return { query, setQuery, applySearch, ...snapshot, result: snapshot.result as CatalogPageResult, loading, error, reload: () => setRevision((value) => value + 1), cancelPending: () => controllerRef.current?.abort() };
}
