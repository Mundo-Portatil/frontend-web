import { isAxiosError } from 'axios';
import { useAuthStore } from '../../../stores/authStore';
import { mapAxiosError } from '../errors';
import { isPublicRequest } from '../publicRequest';

/**
 * Response error interceptor: converts every failure into a typed AppError and
 * triggers the session-expiration flow when a protected request receives a 401.
 *
 * The login request (a public endpoint) is deliberately excluded: credential
 * failures are handled by the login form and must not clear the session.
 * Redirection to /login is not performed here; clearing the auth store state
 * makes ProtectedRoute redirect automatically.
 */
export async function errorResponseInterceptor(error: unknown): Promise<never> {
  const appError = mapAxiosError(error);

  if (appError.kind === 'unauthorized') {
    const config = isAxiosError(error) ? error.config : undefined;
    if (!isPublicRequest(config?.url, config?.skipAuthHandler)) {
      useAuthStore.getState().handleSessionExpired();
    }
  }

  return Promise.reject(appError);
}
