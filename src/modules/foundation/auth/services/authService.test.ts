import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '../../../../services/api/axiosInstance';
import { getProfile, login } from './authService';

vi.mock('../../../../services/api/axiosInstance', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('posts credentials to the public login endpoint', async () => {
    const credentials = { email: 'admin@mundoportatil.pe', password: 'Admin123!' };
    const expected = {
      access_token: 'jwt-token',
      user: {
        id: 'user-1',
        email: credentials.email,
        name: 'Administrador Principal',
        role: 'ADMIN' as const,
      },
    };
    vi.mocked(apiClient.post).mockResolvedValueOnce({ data: expected });

    const result = await login(credentials);

    expect(apiClient.post).toHaveBeenCalledWith('/auth/login', credentials, {
      skipAuthHandler: true,
    });
    expect(result).toEqual(expected);
  });

  it('fetches the authenticated profile', async () => {
    const expected = {
      id: 'user-1',
      email: 'admin@mundoportatil.pe',
      name: 'Administrador Principal',
      role: 'ADMIN' as const,
      active: true,
    };
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: expected });

    const result = await getProfile();

    expect(apiClient.get).toHaveBeenCalledWith('/auth/profile');
    expect(result).toEqual(expected);
  });
});
