import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clearAccessToken, getAccessToken, saveAccessToken } from '../config/authToken';
import { getProfile, login as requestLogin } from '../modules/foundation/auth/services/authService';
import type { Location } from '../modules/foundation/locations/models';
import { useAuthStore } from './authStore';
import { useLocationStore } from './locationStore';

vi.mock('../modules/foundation/auth/services/authService', () => ({
  login: vi.fn(),
  getProfile: vi.fn(),
}));

const LOGIN_USER = {
  id: 'user-1',
  email: 'admin@mundoportatil.pe',
  name: 'Administrador Principal',
  role: 'ADMIN' as const,
};

const PROFILE_USER = {
  ...LOGIN_USER,
  active: true,
};

const TECNICO_PROFILE_USER = {
  ...PROFILE_USER,
  role: 'TECNICO' as const,
};

const CREDENTIALS = {
  email: 'admin@mundoportatil.pe',
  password: 'Admin123!',
};

const ACTIVE_LOCATION: Location = {
  id: 'location-1',
  name: 'Almacén Central',
  type: 'ALMACEN_CENTRAL',
  active: true,
  createdAt: '2026-11-14T20:00:00.000Z',
};

describe('authStore', () => {
  beforeEach(() => {
    clearAccessToken();
    vi.clearAllMocks();
    useAuthStore.setState({ status: 'unauthenticated', user: null });
    useLocationStore.setState({ activeLocation: null });
  });

  it('starts unauthenticated when there is no stored token', async () => {
    await useAuthStore.getState().initialize();

    expect(getProfile).not.toHaveBeenCalled();
    expect(useAuthStore.getState().status).toBe('unauthenticated');
    expect(useAuthStore.getState().user).toBeNull();
  });

  it('restores the session from sessionStorage and GET /auth/profile', async () => {
    saveAccessToken('stored-jwt');
    vi.mocked(getProfile).mockResolvedValueOnce(PROFILE_USER);

    await useAuthStore.getState().initialize();

    expect(getProfile).toHaveBeenCalledTimes(1);
    expect(useAuthStore.getState().status).toBe('authenticated');
    expect(useAuthStore.getState().user).toEqual(PROFILE_USER);
  });

  it('clears an invalid stored token when the profile cannot be validated', async () => {
    saveAccessToken('expired-jwt');
    vi.mocked(getProfile).mockRejectedValueOnce({
      kind: 'unauthorized',
      message: 'Credenciales inválidas o sesión expirada.',
    });

    await useAuthStore.getState().initialize();

    expect(getAccessToken()).toBeNull();
    expect(useAuthStore.getState().status).toBe('unauthenticated');
    expect(useAuthStore.getState().user).toBeNull();
  });

  it('stores the JWT and refreshes the user profile on successful login', async () => {
    vi.mocked(requestLogin).mockResolvedValueOnce({
      access_token: 'new-jwt',
      user: LOGIN_USER,
    });
    vi.mocked(getProfile).mockResolvedValueOnce(PROFILE_USER);

    const result = await useAuthStore.getState().login(CREDENTIALS);

    expect(result).toEqual({ success: true });
    expect(requestLogin).toHaveBeenCalledWith(CREDENTIALS);
    expect(getAccessToken()).toBe('new-jwt');
    expect(useAuthStore.getState().status).toBe('authenticated');
    expect(useAuthStore.getState().user).toEqual(PROFILE_USER);
  });

  it('keeps the login user when the optional profile refresh fails', async () => {
    vi.mocked(requestLogin).mockResolvedValueOnce({
      access_token: 'new-jwt',
      user: LOGIN_USER,
    });
    vi.mocked(getProfile).mockRejectedValueOnce({ kind: 'network', message: 'Sin conexión' });

    const result = await useAuthStore.getState().login(CREDENTIALS);

    expect(result).toEqual({ success: true });
    expect(useAuthStore.getState().status).toBe('authenticated');
    expect(useAuthStore.getState().user).toEqual({ ...LOGIN_USER, active: true });
  });

  it('returns the authentication error without changing the session on failed login', async () => {
    vi.mocked(requestLogin).mockRejectedValueOnce({
      kind: 'unauthorized',
      message: 'Credenciales inválidas o sesión expirada.',
    });

    const result = await useAuthStore.getState().login(CREDENTIALS);

    expect(result).toEqual({
      success: false,
      error: {
        kind: 'unauthorized',
        message: 'Credenciales inválidas o sesión expirada.',
      },
    });
    expect(getAccessToken()).toBeNull();
    expect(useAuthStore.getState().status).toBe('unauthenticated');
  });

  it('restores the current role from the profile when reloading the page', async () => {
    saveAccessToken('stored-jwt');
    vi.mocked(getProfile).mockResolvedValueOnce(TECNICO_PROFILE_USER);

    await useAuthStore.getState().initialize();

    expect(useAuthStore.getState().user?.role).toBe('TECNICO');
  });

  it('uses the profile role as authoritative after a new login', async () => {
    vi.mocked(requestLogin).mockResolvedValueOnce({
      access_token: 'new-jwt',
      user: LOGIN_USER,
    });
    vi.mocked(getProfile).mockResolvedValueOnce(TECNICO_PROFILE_USER);

    await useAuthStore.getState().login(CREDENTIALS);

    expect(useAuthStore.getState().user?.role).toBe('TECNICO');
  });

  it('loads the updated role after logout and a new login', async () => {
    useAuthStore.setState({ status: 'authenticated', user: PROFILE_USER });
    useAuthStore.getState().logout();

    vi.mocked(requestLogin).mockResolvedValueOnce({
      access_token: 'new-jwt',
      user: LOGIN_USER,
    });
    vi.mocked(getProfile).mockResolvedValueOnce(TECNICO_PROFILE_USER);

    await useAuthStore.getState().login(CREDENTIALS);

    expect(useAuthStore.getState().user?.role).toBe('TECNICO');
  });

  it('refreshes the authenticated role without clearing the session', async () => {
    saveAccessToken('active-jwt');
    useAuthStore.setState({ status: 'authenticated', user: PROFILE_USER });
    vi.mocked(getProfile).mockResolvedValueOnce(TECNICO_PROFILE_USER);

    const refreshed = await useAuthStore.getState().refreshProfile();

    expect(refreshed).toEqual(TECNICO_PROFILE_USER);
    expect(useAuthStore.getState().status).toBe('authenticated');
    expect(useAuthStore.getState().user?.role).toBe('TECNICO');
  });

  it('keeps the current session when a profile refresh fails due to the network', async () => {
    saveAccessToken('active-jwt');
    useAuthStore.setState({ status: 'authenticated', user: PROFILE_USER });
    vi.mocked(getProfile).mockRejectedValueOnce({ kind: 'network', message: 'Sin conexión' });

    const refreshed = await useAuthStore.getState().refreshProfile();

    expect(refreshed).toBeNull();
    expect(useAuthStore.getState().status).toBe('authenticated');
    expect(useAuthStore.getState().user).toEqual(PROFILE_USER);
  });

  it('clears the session when the profile refresh is unauthorized', async () => {
    saveAccessToken('expired-jwt');
    useAuthStore.setState({ status: 'authenticated', user: PROFILE_USER });
    useLocationStore.getState().selectLocation(ACTIVE_LOCATION);
    vi.mocked(getProfile).mockRejectedValueOnce({
      kind: 'unauthorized',
      message: 'Credenciales inválidas o sesión expirada.',
    });

    await useAuthStore.getState().refreshProfile();

    expect(getAccessToken()).toBeNull();
    expect(useAuthStore.getState().status).toBe('unauthenticated');
    expect(useAuthStore.getState().user).toBeNull();
    expect(useLocationStore.getState().activeLocation).toBeNull();
  });

  it('clears the token, the location context and the state on logout', () => {
    saveAccessToken('active-jwt');
    useAuthStore.setState({ status: 'authenticated', user: PROFILE_USER });
    useLocationStore.getState().selectLocation(ACTIVE_LOCATION);

    useAuthStore.getState().logout();

    expect(getAccessToken()).toBeNull();
    expect(useAuthStore.getState().status).toBe('unauthenticated');
    expect(useAuthStore.getState().user).toBeNull();
    expect(useLocationStore.getState().activeLocation).toBeNull();
  });

  it('clears the token, the location context and the state when the session expires', () => {
    saveAccessToken('expired-jwt');
    useAuthStore.setState({ status: 'authenticated', user: PROFILE_USER });
    useLocationStore.getState().selectLocation(ACTIVE_LOCATION);

    useAuthStore.getState().handleSessionExpired();

    expect(getAccessToken()).toBeNull();
    expect(useAuthStore.getState().status).toBe('unauthenticated');
    expect(useAuthStore.getState().user).toBeNull();
    expect(useLocationStore.getState().activeLocation).toBeNull();
  });
});


it('does not overwrite a successful profile edit with an older profile GET', async () => {
  saveAccessToken('active-jwt');
  useAuthStore.setState({ status: 'authenticated', user: PROFILE_USER });
  let resolve!: (user: typeof PROFILE_USER) => void;
  vi.mocked(getProfile).mockReturnValueOnce(new Promise((done) => { resolve = done; }));
  const pending = useAuthStore.getState().refreshProfile();
  const edited = { ...PROFILE_USER, name: 'Nombre actualizado', email: 'nuevo@mp.pe' };
  useAuthStore.getState().updateProfileUser(edited);
  resolve(PROFILE_USER);
  expect(await pending).toBeNull();
  expect(useAuthStore.getState().user).toEqual(edited);
});
