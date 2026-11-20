import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import type { CatalogDetail, CatalogItem } from '../catalogModels';
import { getCatalogDetail } from '../services/catalogService';
import { getAvailableQuantity, useCatalogAvailability } from './useCatalogAvailability';

vi.mock('../services/catalogService', () => ({ getCatalogDetail: vi.fn() }));
const item = { id: 'laptop', isSerialized: true } as CatalogItem;
function detail(total = 2): CatalogDetail {
  return {
    item,
    categoryName: 'Portátiles',
    totalStockOverall: total,
    stockSummary: [
      { locationId: 'central', locationName: 'Central', locationType: 'ALMACEN_CENTRAL', serializedCount: total, quantityCount: 100, totalAvailable: total },
      { locationId: 'store', locationName: 'Puesto', locationType: 'PUESTO', serializedCount: 0, quantityCount: 0, totalAvailable: 0 },
    ],
  };
}
beforeEach(() => vi.resetAllMocks());

it.each([true, false])('uses confirmed typed totals and location balances without mixing inventory classes (%s)', async (isSerialized) => {
  const items = [{ ...item, isSerialized }];
  const summary = detail();
  summary.item = items[0];
  summary.stockSummary[0].serializedCount = isSerialized ? 2 : 100;
  summary.stockSummary[0].quantityCount = isSerialized ? 100 : 2;
  vi.mocked(getCatalogDetail).mockResolvedValue(summary);
  const { result } = renderHook(() => useCatalogAvailability(items, true));
  expect(getAvailableQuantity(result.current.entries[item.id])).toBeUndefined();
  await waitFor(() => expect(result.current.entries[item.id]?.status).toBe('ready'));
  expect(getAvailableQuantity(result.current.entries[item.id])).toBe(2);
  expect(getAvailableQuantity(result.current.entries[item.id], 'central')).toBe(2);
  expect(getAvailableQuantity(result.current.entries[item.id], 'store')).toBe(0);
  expect(getAvailableQuantity(result.current.entries[item.id], 'missing')).toBeUndefined();
  expect(getCatalogDetail).toHaveBeenCalledTimes(1);
});

it('never substitutes zero for an error, and retries to display a confirmed zero', async () => {
  const items = [item];
  vi.mocked(getCatalogDetail).mockRejectedValueOnce(new Error('Offline')).mockResolvedValueOnce(detail(0));
  const { result } = renderHook(() => useCatalogAvailability(items, true));
  await waitFor(() => expect(result.current.entries[item.id]?.status).toBe('error'));
  expect(getAvailableQuantity(result.current.entries[item.id])).toBeUndefined();
  act(() => result.current.retry());
  await waitFor(() => expect(result.current.entries[item.id]?.status).toBe('ready'));
  expect(getAvailableQuantity(result.current.entries[item.id])).toBe(0);
  expect(getCatalogDetail).toHaveBeenCalledTimes(2);
});

it('limits parallel requests and aborts the old page without requesting its queued products', async () => {
  const finish: Array<(value: CatalogDetail) => void> = [];
  vi.mocked(getCatalogDetail).mockImplementation(() => new Promise((resolve) => finish.push(resolve)));
  const items = Array.from({ length: 6 }, (_, index) => ({ ...item, id: String(index) }));
  const { result, rerender } = renderHook(({ entries, enabled }) => useCatalogAvailability(entries, enabled), { initialProps: { entries: items, enabled: true } });
  expect(getCatalogDetail).toHaveBeenCalledTimes(4);
  const signals = vi.mocked(getCatalogDetail).mock.calls.map((call) => call[1]);
  rerender({ entries: [], enabled: false });
  expect(signals.every((signal) => signal?.aborted)).toBe(true);
  await act(async () => finish.forEach((resolve) => resolve(detail())));
  expect(result.current.entries).toEqual({});
  expect(getCatalogDetail).toHaveBeenCalledTimes(4);
});

it('refreshes the same product after the catalogue reloads and makes no requests while the list loads', async () => {
  vi.mocked(getCatalogDetail).mockResolvedValueOnce(detail(2)).mockResolvedValueOnce(detail(7));
  const items = [item];
  const { result, rerender } = renderHook(({ enabled, entries }) => useCatalogAvailability(entries, enabled), { initialProps: { enabled: false, entries: items } });
  expect(getCatalogDetail).not.toHaveBeenCalled();
  rerender({ enabled: true, entries: items });
  await waitFor(() => expect(getAvailableQuantity(result.current.entries[item.id])).toBe(2));
  rerender({ enabled: false, entries: items });
  expect(getAvailableQuantity(result.current.entries[item.id])).toBeUndefined();
  rerender({ enabled: true, entries: [...items] });
  await waitFor(() => expect(getAvailableQuantity(result.current.entries[item.id])).toBe(7));
  expect(getCatalogDetail).toHaveBeenCalledTimes(2);
});
