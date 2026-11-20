import { useCallback, useEffect, useState } from 'react';
import type { CatalogDetail, CatalogItem } from '../catalogModels';
import { getCatalogDetail } from '../services/catalogService';

export type Availability =
  | { status: 'ready'; detail: CatalogDetail }
  | { status: 'error' };

const EMPTY: Record<string, Availability> = {};

/** The list endpoint has no totals: fetch only the visible page, with bounded parallelism. */
export function useCatalogAvailability(items: readonly CatalogItem[], enabled: boolean) {
  const [revision, setRevision] = useState(0);
  const [snapshot, setSnapshot] = useState<{ items: readonly CatalogItem[]; entries: Record<string, Availability> }>({ items, entries: EMPTY });
  const retry = useCallback(() => setRevision((value) => value + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSnapshot({ items, entries: EMPTY });
    if (!enabled || !items.length) return () => controller.abort();
    const ids = [...new Set(items.map((item) => item.id))];
    let next = 0;
    async function worker() {
      while (!controller.signal.aborted && next < ids.length) {
        const id = ids[next++];
        let availability: Availability;
        try {
          const detail = await getCatalogDetail(id, controller.signal);
          // Missing/malformed detail must never become a fictitious zero quantity.
          if (!detail || !Array.isArray(detail.stockSummary)) throw new Error('Missing stock summary');
          availability = { status: 'ready', detail };
        } catch {
          availability = { status: 'error' };
        }
        if (!controller.signal.aborted) {
          setSnapshot((current) => ({ items, entries: { ...current.entries, [id]: availability } }));
        }
      }
    }
    void Promise.all(Array.from({ length: Math.min(4, ids.length) }, () => worker()));
    return () => controller.abort();
  }, [items, enabled, revision]);

  return { entries: enabled && snapshot.items === items ? snapshot.entries : EMPTY, retry };
}

/** A loaded summary row is required for a location; an absent row is not zero stock. */
export function getAvailableQuantity(availability: Availability | undefined, locationId?: string): number | undefined {
  if (availability?.status !== 'ready') return undefined;
  const value = locationId
    ? availability.detail.stockSummary.find((stock) => stock.locationId === locationId)?.totalAvailable
    : availability.detail.totalStockOverall;
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : undefined;
}
