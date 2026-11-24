import { beforeEach, expect, it, vi } from 'vitest';
import { searchCatalog } from './catalogSearchService';
import { listCatalog, getCatalogDetail } from './catalogService';
import { scanHardware } from './hardwareItemService';
import type { CatalogItem } from '../catalogModels';
vi.mock('./catalogService', () => ({ listCatalog: vi.fn(), getCatalogDetail: vi.fn() }));
vi.mock('./hardwareItemService', () => ({ scanHardware: vi.fn() }));
const model = { id: 'model', name: 'Lenovo Legion', brand: 'Lenovo', model: 'Legion', categoryId: 'laptops', active: true } as CatalogItem;
beforeEach(() => { vi.resetAllMocks(); vi.mocked(scanHardware).mockRejectedValue({ status: 404 }); });
it('finds a full displayed name across candidate pages and paginates only its real matches', async () => {
  const second = { ...model, id: 'model2', name: 'Lenovo Legion Pro', model: 'Legion Pro' };
  vi.mocked(listCatalog).mockResolvedValueOnce({ items: [], total: 0, page: 2, limit: 1 })
    .mockResolvedValueOnce({ items: [model], total: 2, page: 1, limit: 50 })
    .mockResolvedValueOnce({ items: [second], total: 2, page: 2, limit: 50 });
  const signal = new AbortController().signal;
  const actual = await searchCatalog({ search: 'Lenovo Legion', categoryId: 'laptops', active: true, page: 2, limit: 1 }, true, signal);
  expect(actual.result).toEqual({ items: [second], total: 2, page: 2, limit: 1 });
  expect(listCatalog).toHaveBeenLastCalledWith({ search: 'Lenovo', categoryId: 'laptops', active: true, page: 2, limit: 50 }, signal);
  expect(getCatalogDetail).not.toHaveBeenCalled();
});
it('does not perform supplementary detail requests after a pending search is cancelled', async () => {
  let finish!: (value: Awaited<ReturnType<typeof listCatalog>>) => void;
  vi.mocked(listCatalog).mockImplementation(() => new Promise((resolve) => { finish = resolve; }));
  vi.mocked(scanHardware).mockResolvedValue({ catalogId: model.id } as Awaited<ReturnType<typeof scanHardware>>);
  const controller = new AbortController();
  const pending = searchCatalog({ search: 'old-series' }, true, controller.signal);
  controller.abort(); finish({ items: [], total: 0, page: 1, limit: 50 });
  await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
  expect(getCatalogDetail).not.toHaveBeenCalled();
});
