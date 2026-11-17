import type { AxiosRequestConfig } from 'axios';

declare module 'axios' {
  export interface AxiosRequestConfig {
    /**
     * Marks a request as public so the auth request interceptor does not
     * attach a Bearer token. Used by public endpoints such as POST /auth/login.
     */
    skipAuthHandler?: boolean;
  }
}

/**
 * Backend endpoints that must never receive an Authorization header.
 * Keep this list in sync with the published API contract.
 */
export const PUBLIC_API_PATHS: readonly string[] = ['/auth/login'];

/**
 * Returns true when the request targets a public endpoint or was explicitly
 * marked as public through the `skipAuthHandler` custom config flag.
 */
export function isPublicRequest(url: string | undefined, skipAuthHandler?: boolean): boolean {
  if (skipAuthHandler) {
    return true;
  }
  if (!url) {
    return false;
  }
  return PUBLIC_API_PATHS.some(
    (path) => url === path || url.startsWith(`${path}?`) || url.startsWith(`${path}/`),
  );
}

/**
 * Config helper that marks a request as public for the auth request
 * interceptor, so services do not hand-write custom flags.
 */
export function publicRequestConfig(): AxiosRequestConfig {
  return { skipAuthHandler: true };
}
