import { AxiosError, AxiosHeaders } from 'axios';
import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clearAccessToken } from '../../../config/authToken';
import { useAuthStore } from '../../../stores/authStore';
import { errorResponseInterceptor } from './errorResponseInterceptor';

function makeConfig(overrides: Partial<InternalAxiosRequestConfig> = {}): InternalAxiosRequestConfig {
  return {
    headers: new AxiosHeaders(),
    url: '/users',
    ...overrides,
  } as InternalAxiosRequestConfig;
}

function makeHttpError(
  status: number,
  data: unknown,
  config: InternalAxiosRequestConfig = makeConfig(),
): AxiosError {
  const response: AxiosResponse = {
    data,
    status,
    statusText: 'Error',
    headers: {},
    config,
  };
  return new AxiosError('Request failed', 'ERR_BAD_RESPONSE', config, undefined, response);
}

function makeNetworkError(): AxiosError {
  return new AxiosError('Network Error', 'ERR_NETWORK', makeConfig());
}

describe('errorResponseInterceptor', () => {
  beforeEach(() => {
    clearAccessToken();
    vi.restoreAllMocks();
    useAuthStore.setState({
      status: 'authenticated',
      user: {
        id: 'user-1',
        email: 'admin@mundoportatil.pe',
        name: 'Administrador Principal',
        role: 'ADMIN',
        active: true,
      },
    });
  });

  it('rejects 401 responses as unauthorized and clears the session', async () => {
    const sessionExpired = vi.spyOn(useAuthStore.getState(), 'handleSessionExpired');

    await expect(
      errorResponseInterceptor(makeHttpError(401, { message: 'Token expirado' })),
    ).rejects.toEqual({
      kind: 'unauthorized',
      status: 401,
      message: 'Credenciales inválidas o sesión expirada.',
    });

    expect(sessionExpired).toHaveBeenCalledTimes(1);
  });

  it('does not clear the session when the login request itself returns 401', async () => {
    const sessionExpired = vi.spyOn(useAuthStore.getState(), 'handleSessionExpired');

    await expect(
      errorResponseInterceptor(
        makeHttpError(401, { message: 'Credenciales inválidas' }, makeConfig({ url: '/auth/login' })),
      ),
    ).rejects.toMatchObject({ kind: 'unauthorized' });

    expect(sessionExpired).not.toHaveBeenCalled();
  });

  it('maps 403 responses to forbidden without clearing the session', async () => {
    const sessionExpired = vi.spyOn(useAuthStore.getState(), 'handleSessionExpired');

    await expect(
      errorResponseInterceptor(makeHttpError(403, { message: 'Acceso denegado' })),
    ).rejects.toEqual({
      kind: 'forbidden',
      status: 403,
      message: 'No tienes autorización para realizar esta operación.',
    });

    expect(sessionExpired).not.toHaveBeenCalled();
  });

  it('maps connectivity failures to a network error', async () => {
    await expect(errorResponseInterceptor(makeNetworkError())).rejects.toEqual({
      kind: 'network',
      message: 'No se pudo establecer comunicación con el servidor. Verifica tu conexión.',
    });
  });

  it('maps validation errors with an array message to a user-friendly message', async () => {
    await expect(
      errorResponseInterceptor(
        makeHttpError(400, {
          message: ['El email es obligatorio', 'La contraseña debe tener al menos 6 caracteres'],
          error: 'Bad Request',
          statusCode: 400,
        }),
      ),
    ).rejects.toEqual({
      kind: 'validation',
      status: 400,
      message: 'El email es obligatorio',
    });
  });

  it('keeps the contract message for conflict errors', async () => {
    await expect(
      errorResponseInterceptor(
        makeHttpError(409, { message: 'El correo electrónico ya se encuentra registrado.' }),
      ),
    ).rejects.toEqual({
      kind: 'unknown',
      status: 409,
      message: 'El correo electrónico ya se encuentra registrado.',
    });
  });

  it('maps server errors without exposing backend internals', async () => {
    await expect(
      errorResponseInterceptor(
        makeHttpError(500, { message: 'Database connection refused' }),
      ),
    ).rejects.toEqual({
      kind: 'server',
      status: 500,
      message: 'Error interno del servidor. Intenta nuevamente.',
    });
  });
});
