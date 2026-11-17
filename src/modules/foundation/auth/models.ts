/** User roles supported by the backend (single role per user). */
export type Role = 'ADMIN' | 'VENDEDOR' | 'TECNICO';

/** Authenticated user returned by POST /auth/login. */
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}

/** Session user returned by GET /auth/profile. */
export type ProfileUser = AuthUser & {
  active: boolean;
};

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  user: AuthUser;
}
