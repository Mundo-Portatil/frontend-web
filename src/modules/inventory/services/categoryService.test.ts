import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '../../../services/api/axiosInstance';
import { createCategory, listCategories, updateCategory } from './categoryService';
vi.mock('../../../services/api/axiosInstance', () => ({ apiClient: { get: vi.fn(), post: vi.fn(), patch: vi.fn() } }));
describe('categoryService', () => {
  beforeEach(() => vi.clearAllMocks());
  it.each([undefined, true, false])('sends active=%s without dropping false', async (active) => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: [] });
    const query = active === undefined ? {} : { active };
    expect(await listCategories(query)).toEqual([]);
    expect(apiClient.get).toHaveBeenCalledWith('/categories', { params: query, signal: undefined });
  });
  it('uses POST and PATCH and returns server entities', async () => {
    const payload = { name: 'RAM', description: 'Memorias', active: true };
    vi.mocked(apiClient.post).mockResolvedValue({ data: { id: 'id', ...payload } });
    vi.mocked(apiClient.patch).mockResolvedValue({ data: { id: 'id', ...payload, active: false } });
    expect(await createCategory(payload)).toMatchObject({ id: 'id' });
    expect(apiClient.post).toHaveBeenCalledWith('/categories', payload);
    expect(await updateCategory('id', { active: false })).toMatchObject({ active: false });
    expect(apiClient.patch).toHaveBeenCalledWith('/categories/id', { active: false });
  });
  it('propagates normalized API failures for the shared feedback', async () => {
    const error = { kind: 'forbidden', status: 403, message: 'No tienes autorización.' };
    vi.mocked(apiClient.post).mockRejectedValue(error);
    await expect(createCategory({ name: 'RAM' })).rejects.toEqual(error);
  });
});
