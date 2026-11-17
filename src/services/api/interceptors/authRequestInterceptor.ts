import type { InternalAxiosRequestConfig } from 'axios';
import { getAccessToken } from '../../../config/authToken';
import { isPublicRequest } from '../publicRequest';

/**
 * Request interceptor: attaches the Bearer token stored in sessionStorage to
 * protected requests. Public requests (e.g. POST /auth/login) are skipped so
 * they never carry a stale or invalid token.
 */
export function authRequestInterceptor(config: InternalAxiosRequestConfig): InternalAxiosRequestConfig {
  if (isPublicRequest(config.url, config.skipAuthHandler)) {
    return config;
  }

  const token = getAccessToken();
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }

  return config;
}
