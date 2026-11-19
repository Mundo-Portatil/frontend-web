import { useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';

/**
 * Revalidates the authenticated profile when the tab regains focus or becomes
 * visible again. The backend has no push channel for role changes, so this is
 * the existing profile mechanism used to detect updates made outside the
 * current session. It is intentionally limited to an active session.
 */
export function useSessionProfileRefresh() {
  const status = useAuthStore((state) => state.status);
  const refreshProfile = useAuthStore((state) => state.refreshProfile);

  useEffect(() => {
    if (status !== 'authenticated') {
      return;
    }

    function refresh() {
      void refreshProfile();
    }

    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') {
        refresh();
      }
    }

    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refreshProfile, status]);
}
