import type { Role } from '../auth/models';

/** User entity returned by the users endpoints. */
export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  /** Current API returns nullable fields; optional for legacy accounts/responses during rollout. */
  locationId?: string | null;
  locationName?: string | null;
}

/** POST /users payload. */
export interface CreateUserInput {
  email: string;
  name: string;
  password: string;
  role?: Role;
  locationId?: string | null;
}

/** PATCH /users/:id payload. */
export interface UpdateUserInput {
  name?: string;
  role?: Role;
  locationId?: string | null;
  active?: boolean;
  password?: string;
}

/** PATCH /users/me accepts only editable personal fields; identity comes from JWT. */
export interface UpdateOwnProfileInput {
  name?: string;
  email?: string;
  password?: string;
}
