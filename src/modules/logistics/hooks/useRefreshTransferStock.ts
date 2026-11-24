import { useEffect, useRef, useState } from 'react';
import type { QuantityLine } from '../draftModels';
import { readAvailable } from './useTransferResources';
export function useRefreshTransferStock() {
  const request = useRef<AbortController | null>(null);
  const [loading, setLoading] = useState(false);
  useEffect(() => () => request.current?.abort(), []);
  async function refresh(originId: string, lines: QuantityLine[]): Promise<Record<string, number | null> | null> {
    request.current?.abort();
    const controller = new AbortController(); request.current = controller; setLoading(true);
    const results = await Promise.all(lines.map(async line => {
      try { return [line.catalog.id, await readAvailable(originId, line.catalog.id, controller.signal)] as const; }
      catch { return [line.catalog.id, null] as const; }
    }));
    if (controller.signal.aborted) return null;
    setLoading(false); return Object.fromEntries(results);
  }
  return { refresh, loading };
}
