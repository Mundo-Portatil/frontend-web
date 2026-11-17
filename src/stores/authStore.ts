import { create } from 'zustand';
import { clearAccessToken, getAccessToken, saveAccessToken } from '../config/authToken';
import type { LoginCredentials, ProfileUser } from '../modules/foundation/auth/models';
import { getProfile, login as requestLogin } from '../modules/foundation/auth/services/authService';
import { asAppError } from '../services/api/errors';
import type { AppError } from '../services/api/errors';

export type AuthStatus = 'initializing' | 'authenticated' | 'unauthenticated';

/** Result returned to the UI after an authentication attempt. */
export interface LoginResult {
  success: boolean;
  error?: AppError;
}

interface AuthState {
  status: AuthStatus;
  user: ProfileUser | null;
  /** Restores the session from sessionStorage on application startup. */
  initialize: () => Promise<void>;
  /** Authenticates the user and establishes the session. */
  login: (credentials: LoginCredentials) => Promise<LoginResult>;
  /** Clears the session (user initiated). */
  logout: () => void;
  /** Clears the session after a 401 from a protected endpoint (interceptor). */
  handleSessionExpired: () => void;
}

const UNAUTHENTICATED_STATE = { status: 'unauthenticated', user: null } as const;

export const useAuthStore = create<AuthState>()((set) => ({
  status: 'initializing',
  user: null,

  initialize: async () => {
    const token = getAccessToken();
    if (!token) {
      set(UNAUTHENTICATED_STATE);
      return;
    }

    try {
      const user = await getProfile();
      set({ status: 'authenticated', user });
    } catch {
      // Invalid or expired token (401) or user no longer exists (404):
      // clear the stored token and leave the app unauthenticated.
      clearAccessToken();
      set(UNAUTHENTICATED_STATE);
    }
  },

  login: async (credentials) => {
    try {
      const response = await requestLogin(credentials);
      saveAccessToken(response.access_token);
      // The login contract does not include `active`, but the backend rejects
      // inactive users with 401, so a user who passed login is active. The
      // profile refresh below restores the authoritative value.
      set({ status: 'authenticated', user: { ...response.user, active: true } });

      // Refresh the user with GET /auth/profile so the session user includes
      // the `active` field from the contract. The session is already valid,
      // so a failure here does not break the login flow.
      try {
        const profileUser = await getProfile();
        set({ user: profileUser });
      } catch {
        // Keep the login payload user data.
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: asAppError(error) };
    }
  },

  logout: () => {
    clearAccessToken();
    set(UNAUTHENTICATED_STATE);
  },

  handleSessionExpired: () => {
    clearAccessToken();
    set(UNAUTHENTICATED_STATE);
  },
}));
