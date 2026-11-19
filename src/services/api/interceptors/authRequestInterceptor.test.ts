import { AxiosHeaders } from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';
import { beforeEach, describe, expect, it } from 'vitest';
import { clearAccessToken, getAccessToken, saveAccessToken } from '../../../config/authToken';
import { authRequestInterceptor } from './authRequestInterceptor';

function makeConfig(overrides: Partial<InternalAxiosRequestConfig> = {}): InternalAxiosRequestConfig {
  return {
    headers: new AxiosHeaders(),
    url: '/users',
    ...overrides,
  } as InternalAxiosRequestConfig;
}

describe('authRequestInterceptor', () => {
  beforeEach(() => {
    clearAccessToken();
  });

  it('attaches the Bearer token from sessionStorage to protected requests', () => {
    saveAccessToken('jwt-token');

    const config = authRequestInterceptor(makeConfig());

    expect(config.headers.get('Authorization')).toBe('Bearer jwt-token');
    expect(getAccessToken()).toBe('jwt-token');
  });

  it('does not attach an Authorization header when there is no token', () => {
    const config = authRequestInterceptor(makeConfig());

    expect(config.headers.get('Authorization')).toBeUndefined();
  });

  it('never attaches the token to the public login endpoint', () => {
    saveAccessToken('jwt-token');

    const config = authRequestInterceptor(makeConfig({ url: '/auth/login' }));

    expect(config.headers.get('Authorization')).toBeUndefined();
  });

  it('skips authentication when the request is explicitly marked as public', () => {
    saveAccessToken('jwt-token');

    const config = authRequestInterceptor(
      makeConfig({ url: '/auth/profile', skipAuthHandler: true }),
    );

    expect(config.headers.get('Authorization')).toBeUndefined();
  });
});
