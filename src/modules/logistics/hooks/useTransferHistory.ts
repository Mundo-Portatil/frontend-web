import { useEffect, useState } from 'react';
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
  const requestKey = JSON.stringify([user?.id, user?.role, user?.locationId, query, revision]);
  const scoped = user?.role === 'VENDEDOR' || user?.role === 'TECNICO';
  const missingLocation = scoped && !user?.locationId;
  useEffect(() => {
    if (!user || missingLocation) return;
    const controller = new AbortController();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(null);
    const request = scoped ? { startDate: query.startDate, endDate: query.endDate } : query;
    void listTransfers(request, controller.signal).then((data) => {
      if (!controller.signal.aborted) setRows(data);
    }).catch((failure: unknown) => {
      if (!controller.signal.aborted) setError(asAppError(failure));
    }).finally(() => { if (!controller.signal.aborted) { setLoadedKey(requestKey); setLoading(false); } });
    return () => controller.abort();
  }, [query, revision, user, scoped, missingLocation, requestKey]);
  const current = loadedKey === requestKey;
  return { rows: missingLocation || !current ? [] : rows, query, setQuery, loading: loading || !current, error: current ? error : null, scoped, missingLocation, reload: () => setRevision((value) => value + 1) };
}
