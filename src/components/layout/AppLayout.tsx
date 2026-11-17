import type { ReactNode } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import type { Role } from '../../modules/foundation/auth/models';
import { ROLE_LABELS } from '../../modules/foundation/auth/roleLabels';
import { ROUTES } from '../../router/routes';
import { useAuthStore } from '../../stores/authStore';
import { Can } from '../guards/Can';

interface NavItem {
  to: string;
  label: string;
  /** Roles allowed to see the link; visibility goes through `Can` (FR-015). */
  roles: Role[];
}

const NAV_ITEMS: readonly NavItem[] = [
  { to: ROUTES.locations, label: 'Ubicaciones', roles: ['ADMIN', 'VENDEDOR', 'TECNICO'] },
  { to: ROUTES.users, label: 'Usuarios', roles: ['ADMIN'] },
  { to: ROUTES.auditLogs, label: 'Bitácora', roles: ['ADMIN'] },
];

const NAV_LINK_BASE_CLASS = 'rounded-lg px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white';

const NAV_LINK_ACTIVE_CLASS = 'bg-white/15 text-white';

const NAV_LINK_INACTIVE_CLASS = 'text-slate-300 hover:bg-white/10 hover:text-white';

/**
 * Shared layout for authenticated pages: top bar with the application name,
 * role-restricted navigation links (through the `Can` mechanism), the
 * authenticated user's name and role, and a logout button.
 */
export function AppLayout({ children }: { children?: ReactNode }) {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate(ROUTES.login, { replace: true });
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-100">
      <header className="bg-slate-900">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-3">
          <div className="flex flex-wrap items-center gap-6">
            <span className="text-base font-semibold text-white">Mundo Portátil</span>
            <nav aria-label="Navegación principal" className="flex items-center gap-1">
              {NAV_ITEMS.map((item) => (
                <Can key={item.to} roles={item.roles}>
                  <NavLink
                    to={item.to}
                    className={({ isActive }) =>
                      `${NAV_LINK_BASE_CLASS} ${isActive ? NAV_LINK_ACTIVE_CLASS : NAV_LINK_INACTIVE_CLASS}`
                    }
                  >
                    {item.label}
                  </NavLink>
                </Can>
              ))}
            </nav>
          </div>

          {user && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-200">
                {user.name}
                <span className="ml-2 rounded-full bg-white/10 px-2 py-0.5 text-xs text-slate-300">
                  {ROLE_LABELS[user.role]}
                </span>
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-lg border border-slate-600 px-3 py-2 text-sm font-medium text-slate-200 transition-colors hover:border-slate-400 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 px-4 py-8">{children ?? <Outlet />}</main>
    </div>
  );
}
