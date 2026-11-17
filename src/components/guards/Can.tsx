import type { ReactNode } from 'react';
import type { Role } from '../../modules/foundation/auth/models';
import { useHasRole } from './useHasRole';

interface CanProps {
  /** Roles allowed to see the wrapped content. */
  roles: Role[];
  children: ReactNode;
  /** Optional content rendered when the role is not allowed. */
  fallback?: ReactNode;
}

/**
 * Unique and reusable mechanism for conditional UI visibility by role
 * (FR-015). Renders `children` only when the authenticated user's role is
 * included in `roles`; otherwise renders `fallback` (nothing by default).
 *
 * All role-based UI visibility must use this component: ad-hoc role checks
 * inside visual components are not allowed.
 *
 * Note: hiding UI actions does not replace backend authorization (FR-016);
 * the server remains the definitive security mechanism.
 */
export function Can({ roles, children, fallback = null }: CanProps) {
  const isAllowed = useHasRole(roles);

  return <>{isAllowed ? children : fallback}</>;
}
