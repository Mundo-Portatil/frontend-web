import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useHasRole } from '../components/guards/useHasRole';
import type { Role } from '../modules/foundation/auth/models';
import { ROUTES } from './routes';

interface RoleGuardProps {
  /** Roles allowed to access the wrapped route. */
  allowedRoles: Role[];
  children: ReactNode;
}

/**
 * Restricts route access to the given roles (FR-012 / FR-014). The role check
 * delegates to the shared `useHasRole` mechanism; users with a role outside
 * `allowedRoles` are redirected to /unauthorized.
 */
export function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const isAllowed = useHasRole(allowedRoles);

  if (!isAllowed) {
    return <Navigate to={ROUTES.unauthorized} replace />;
  }

  return <>{children}</>;
}
