/** User roles supported by the backend (single role per user). */
export type Role = 'ADMIN' | 'ENCARGADO_ALMACEN' | 'VENDEDOR' | 'TECNICO';

/** Authenticated user returned by POST /auth/login. */
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  locationId?: string | null;
  locationName?: string | null;
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
