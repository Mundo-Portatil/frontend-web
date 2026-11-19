import { Navigate, Outlet } from 'react-router-dom';
import { LoadingScreen } from '../components/feedback/LoadingScreen';
import { useAuthStore } from '../stores/authStore';
import { ROUTES } from './routes';

/**
 * Wraps protected routes: shows a loading screen while the session is being
 * restored, redirects unauthenticated users to /login, and renders the
 * matched route (through Outlet) when the user is authenticated.
 */
export function ProtectedRoute() {
  const status = useAuthStore((state) => state.status);

  if (status === 'initializing') {
    return <LoadingScreen />;
  }

  if (status === 'unauthenticated') {
    return <Navigate to={ROUTES.login} replace />;
  }

  return <Outlet />;
}
