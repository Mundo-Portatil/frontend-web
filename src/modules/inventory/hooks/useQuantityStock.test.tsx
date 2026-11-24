import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { useQuantityStock } from './useQuantityStock';
import { listQuantityStock } from '../services/quantityStockService';
import type { QuantityStockPageResult } from '../quantityModels';
vi.mock('../services/quantityStockService', () => ({ listQuantityStock: vi.fn() }));
beforeEach(() => vi.resetAllMocks());
it('ignores obsolete responses and cancels prior filtered query', async () => {
  let completeOld!: (value: QuantityStockPageResult) => void;
  vi.mocked(listQuantityStock).mockReturnValueOnce(new Promise((resolve) => { completeOld = resolve; })).mockResolvedValueOnce({ items: [], page: 1, limit: 50, total: 4 });
  const { result } = renderHook(() => useQuantityStock());
  const oldSignal = vi.mocked(listQuantityStock).mock.calls[0][1];
  act(() => result.current.setQuery({ lowStock: true, page: 1, limit: 50 }));
  await waitFor(() => expect(result.current.data.total).toBe(4));
  expect(oldSignal?.aborted).toBe(true);
  await act(async () => completeOld({ items: [], page: 1, limit: 50, total: 99 }));
  expect(result.current.data.total).toBe(4);
});
