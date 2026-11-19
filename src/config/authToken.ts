/**
 * Session storage helpers for the JWT access token.
 *
 * The token lives in sessionStorage only (approved decision): no localStorage,
 * no cookies and no refresh tokens.
 */
const ACCESS_TOKEN_STORAGE_KEY = 'mp_access_token';

export function getAccessToken(): string | null {
  return sessionStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
}

export function saveAccessToken(token: string): void {
  sessionStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, token);
}

export function clearAccessToken(): void {
  sessionStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
}
