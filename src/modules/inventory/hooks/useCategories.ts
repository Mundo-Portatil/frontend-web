import { useCallback, useEffect, useState } from 'react';
import { asAppError, type AppError } from '../../../services/api/errors';
import type { Category } from '../models';
import { listCategories } from '../services/categoryService';

export type CategoryFilter = 'all' | 'active' | 'inactive';
export function useCategories() {
  const [filter, setFilter] = useState<CategoryFilter>('all');
  const [revision, setRevision] = useState(0);
  const [items, setItems] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AppError | null>(null);
  const reload = useCallback(() => setRevision((value) => value + 1), []);
  useEffect(() => {
    const controller = new AbortController();
    // A filter change starts a new request and discards older responses.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(null);
    const query = filter === 'all' ? {} : { active: filter === 'active' };
    void listCategories(query, controller.signal).then((data) => {
      if (!controller.signal.aborted) setItems(data);
    }).catch((reason: unknown) => {
      if (!controller.signal.aborted) setError(asAppError(reason));
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false);
    });
    return () => controller.abort();
  }, [filter, revision]);
  return { filter, setFilter, items, loading, error, reload };
}
