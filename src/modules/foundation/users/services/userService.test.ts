import { describe, expect, it, vi, beforeEach } from 'vitest';
import { apiClient } from '../../../../services/api/axiosInstance';
import { createUser, deactivateUser, listUsers, reactivateUser, updateOwnProfile, updateUser } from './userService';

vi.mock('../../../../services/api/axiosInstance', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}));

describe('userService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lists users with GET /users', async () => {
    const expected = [{ id: 'u-1' }];
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: expected });

    const result = await listUsers();

    expect(apiClient.get).toHaveBeenCalledWith('/users');
    expect(result).toEqual(expected);
  });

  it('creates users with POST /users', async () => {
    const payload = {
      email: 'nuevo@mp.pe',
      name: 'Nuevo Usuario',
      password: 'secret12',
      role: 'VENDEDOR' as const,
    };
    const expected = { id: 'u-2', ...payload, active: true };
    vi.mocked(apiClient.post).mockResolvedValueOnce({ data: expected });

    const result = await createUser(payload);

    expect(apiClient.post).toHaveBeenCalledWith('/users', payload);
    expect(result).toEqual(expected);
  });

  it('updates users with PATCH /users/:id', async () => {
    const payload = { name: 'Editado', role: 'TECNICO' as const };
    const expected = { id: 'u-3', ...payload, active: true };
    vi.mocked(apiClient.patch).mockResolvedValueOnce({ data: expected });

    const result = await updateUser('u-3', payload);

    expect(apiClient.patch).toHaveBeenCalledWith('/users/u-3', payload);
    expect(result).toEqual(expected);
  });

  it('deactivates users via PATCH active=false', async () => {
    const expected = { id: 'u-4', active: false };
    vi.mocked(apiClient.patch).mockResolvedValueOnce({ data: expected });

    const result = await deactivateUser('u-4');

    expect(apiClient.patch).toHaveBeenCalledWith('/users/u-4', { active: false });
    expect(result).toEqual(expected);
  });

  it('reactivates users via PATCH active=true', async () => {
    const expected = { id: 'u-4', active: true };
    vi.mocked(apiClient.patch).mockResolvedValueOnce({ data: expected });

    const result = await reactivateUser('u-4');

    expect(apiClient.patch).toHaveBeenCalledWith('/users/u-4', { active: true });
    expect(result).toEqual(expected);
  });
});

it('updates authenticated identity via fixed /users/me and strips administrative fields', async () => {
  vi.mocked(apiClient.patch).mockResolvedValueOnce({ data: { id: 'self' } });
  const payload = { name: 'Ana', email: 'ana@mp.pe', password: 'Nueva123', id: 'other', role: 'ADMIN', active: false };
  await updateOwnProfile(payload);
  expect(apiClient.patch).toHaveBeenLastCalledWith('/users/me', { name: 'Ana', email: 'ana@mp.pe', password: 'Nueva123' });
});
