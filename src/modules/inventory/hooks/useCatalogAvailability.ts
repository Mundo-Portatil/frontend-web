import { useCallback, useEffect, useState } from 'react';
import { getLocationStockCount, getTotalStockCount, type CatalogDetail, type CatalogItem } from '../catalogModels';
import { getCatalogDetail } from '../services/catalogService';

export type Availability =
  | { status: 'ready'; detail: CatalogDetail }
  | { status: 'error' };

export type AvailabilityDisplay =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'empty' }
  | { status: 'ready'; quantity: number };

const EMPTY: Record<string, Availability> = {};

/** The list endpoint has no totals: fetch only the visible page, with bounded parallelism. */
export function useCatalogAvailability(items: readonly CatalogItem[], enabled: boolean, seed?: CatalogDetail) {
  const [revision, setRevision] = useState(0);
  const [snapshot, setSnapshot] = useState<{ items: readonly CatalogItem[]; entries: Record<string, Availability> }>({ items, entries: EMPTY });
  const retry = useCallback(() => setRevision((value) => value + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSnapshot({ items, entries: seed ? { [seed.item.id]: { status: 'ready', detail: seed } } : EMPTY });
    if (!enabled || !items.length) return () => controller.abort();
    const ids = [...new Set(items.map((item) => item.id))].filter((id) => id !== seed?.item.id);
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
  }, [items, enabled, revision, seed]);

  return { entries: enabled && snapshot.items === items ? snapshot.entries : EMPTY, retry };
}

/**
 * Translates the raw availability entry into an explicit display state.
 *
 * The backend summary is the only source of truth: while there is no entry the
 * cell is loading, a failed entry is an error, a confirmed zero or a missing
 * location row means there is no stock, and an invalid value is an error. A
 * missing row is never replaced by a fictitious zero.
 */
function resolveQuantity(detail: CatalogDetail, locationId?: string): number | undefined {
  if (locationId) {
    const row = detail.stockSummary.find((stock) => stock.locationId === locationId);
    return row ? getLocationStockCount(detail, row) : undefined;
  }
  if (!Number.isFinite(detail.totalStockOverall) || detail.totalStockOverall < 0) {
    return detail.totalStockOverall;
  }
  return getTotalStockCount(detail);
}

export function getAvailabilityDisplay(
  availability: Availability | undefined,
  locationId?: string,
): AvailabilityDisplay {
  if (!availability) return { status: 'loading' };
  if (availability.status === 'error') return { status: 'error' };

  const value = resolveQuantity(availability.detail, locationId);

  if (locationId && !availability.detail.stockSummary.some((stock) => stock.locationId === locationId)) {
    return { status: 'empty' };
  }
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    return { status: 'error' };
  }
  return value === 0 ? { status: 'empty' } : { status: 'ready', quantity: value };
}

/** A loaded summary row is required for a location; an absent row is not zero stock. */
export function getAvailableQuantity(availability: Availability | undefined, locationId?: string): number | undefined {
  if (availability?.status !== 'ready') return undefined;
  const value = resolveQuantity(availability.detail, locationId);
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : undefined;
}
