import { Navigate, Route, Routes } from 'react-router-dom';
import { LoadingScreen } from '../components/feedback/LoadingScreen';
import { AppLayout } from '../components/layout/AppLayout';
import { LoginPage } from '../modules/foundation/auth/pages/LoginPage';
import { UnauthorizedPage } from '../modules/foundation/auth/pages/UnauthorizedPage';
import { AuditLogsPage } from '../modules/foundation/audit-logs/pages/AuditLogsPage';
import { LocationsPage } from '../modules/foundation/locations/pages/LocationsPage';
import { ProfilePage } from '../modules/foundation/users/pages/ProfilePage';
import { UsersPage } from '../modules/foundation/users/pages/UsersPage';
import { CategoriesPage } from '../modules/inventory';
import { useAuthStore } from '../stores/authStore';
import { ProtectedRoute } from './ProtectedRoute';
import { RoleGuard } from './RoleGuard';
import { ROUTES } from './routes';

/**
 * Public route for guests: shows the loading screen while the session is
 * being restored, redirects already-authenticated users to /locations, and
 * otherwise renders the public page.
 */
function PublicOnlyRoute() {
  const status = useAuthStore((state) => state.status);

  if (status === 'initializing') {
    return <LoadingScreen />;
  }

  if (status === 'authenticated') {
    return <Navigate to={ROUTES.locations} replace />;
  }

  return <LoginPage />;
}

/**
 * Wildcard fallback: sends authenticated users to the operative route and
 * unauthenticated users to the login page.
 */
function WildcardRedirect() {
  const status = useAuthStore((state) => state.status);

  if (status === 'initializing') {
    return <LoadingScreen />;
  }

  return <Navigate to={status === 'authenticated' ? ROUTES.locations : ROUTES.login} replace />;
}

/**
 * Centralized route configuration for the application.
 *
 * - Public routes: /login.
 * - Protected routes (session required): rendered inside AppLayout.
 * - ADMIN-only routes: wrapped with RoleGuard.
 */
export function AppRouter() {
  return (
    <Routes>
      <Route path={ROUTES.login} element={<PublicOnlyRoute />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path={ROUTES.inventoryCategories} element={<CategoriesPage />} />
          <Route path={ROUTES.profile} element={<ProfilePage />} />
          <Route path={ROUTES.locations} element={<LocationsPage />} />
          <Route path={ROUTES.unauthorized} element={<UnauthorizedPage />} />
          <Route
            path={ROUTES.users}
            element={
              <RoleGuard allowedRoles={['ADMIN']}>
                <UsersPage />
              </RoleGuard>
            }
          />
          <Route
            path={ROUTES.auditLogs}
            element={
              <RoleGuard allowedRoles={['ADMIN']}>
                <AuditLogsPage />
              </RoleGuard>
            }
          />
        </Route>
      </Route>

      <Route path="*" element={<WildcardRedirect />} />
    </Routes>
  );
}
