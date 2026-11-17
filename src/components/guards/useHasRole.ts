import { useAuthStore } from '../../stores/authStore';
import type { Role } from '../../modules/foundation/auth/models';

/**
 * Unique imperative hook for role-based visibility checks (FR-015).
 * Returns true when the authenticated user's role is one of the allowed
 * roles. Component checks must go through `Can`; this hook exists for
 * imperative cases (e.g. guards, conditional logic outside rendering).
 */
export function useHasRole(roles: Role[]): boolean {
  const role = useAuthStore((state) => state.user?.role);
  return role !== undefined && roles.includes(role);
}
