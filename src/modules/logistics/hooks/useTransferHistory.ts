import { useCallback, useEffect, useState } from 'react';
import { useAuthStore } from '../../../stores/authStore';
import { asAppError, type AppError } from '../../../services/api/errors';
import { listTransfers } from '../services/transferService';
import type { Transfer, TransferQuery } from '../models';

export function useTransferHistory() {
  const user = useAuthStore((state) => state.user);
  const [query, setQuery] = useState<TransferQuery>({});
  const [rows, setRows] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AppError | null>(null);
  const [revision, setRevision] = useState(0);
  const [loadedKey, setLoadedKey] = useState('');
  const userId = user?.id;
  const userRole = user?.role;
  const userLocationId = user?.locationId;
  const scoped = userRole === 'VENDEDOR' || userRole === 'TECNICO';
  const missingLocation = scoped && !userLocationId;
  const locationId = scoped ? undefined : query.locationId;
  const startDate = query.startDate;
  const endDate = query.endDate;
  const requestKey = JSON.stringify([userId, userRole, userLocationId, locationId, startDate, endDate, revision]);

  useEffect(() => {
    if (!userId || missingLocation) return;
    const controller = new AbortController();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(null);
    const request: TransferQuery = scoped ? { startDate, endDate } : { locationId, startDate, endDate };
    void listTransfers(request, controller.signal).then((data) => {
      if (!controller.signal.aborted) setRows(data);
    }).catch((failure: unknown) => {
      if (!controller.signal.aborted) setError(asAppError(failure));
    }).finally(() => { if (!controller.signal.aborted) { setLoadedKey(requestKey); setLoading(false); } });
    return () => controller.abort();
  }, [userId, missingLocation, scoped, locationId, startDate, endDate, requestKey]);

  const reload = useCallback(() => setRevision((value) => value + 1), []);
  const current = loadedKey === requestKey;
  return { rows: missingLocation || !current ? [] : rows, query, setQuery, loading: loading || !current, error: current ? error : null, scoped, missingLocation, reload };
}
