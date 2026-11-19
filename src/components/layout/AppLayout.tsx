import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import type { Role } from '../../modules/foundation/auth/models';
import { ROLE_LABELS } from '../../modules/foundation/auth/roleLabels';
import { LocationSelector } from '../../modules/foundation/locations/components/LocationSelector';
import { ROUTES } from '../../router/routes';
import { useAuthStore } from '../../stores/authStore';
import { useLocationStore } from '../../stores/locationStore';
import { useSessionProfileRefresh } from '../../hooks/useSessionProfileRefresh';
import { BrandLogo } from '../brand/BrandLogo';
import { ChevronLeftIcon, ChevronRightIcon, CloseIcon, MenuIcon } from './icons';
import { SidebarNav } from './SidebarNav';

const HEADER_ACTION_BASE_CLASS =
  'inline-flex shrink-0 items-center justify-center rounded-lg border border-white/25 px-3 py-2 text-sm font-medium text-white transition-colors hover:border-white/50 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80';

const DRAWER_ACTION_BASE_CLASS =
  'inline-flex shrink-0 items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-slate-400 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1';

function UserIdentity({
  name,
  role,
  tone = 'dark',
}: {
  name: string;
  role: Role;
  tone?: 'dark' | 'light';
}) {
  const initial = name.trim().charAt(0).toUpperCase() || '?';
  const isLight = tone === 'light';

  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <span
        aria-hidden="true"
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold ring-1 ${
          isLight ? 'bg-brand-50 text-brand-800 ring-brand-200' : 'bg-white/10 text-white ring-white/15'
        }`}
      >
        {initial}
      </span>
      <span className="min-w-0">
        <span
          className={`block truncate text-sm font-medium ${isLight ? 'text-slate-900' : 'text-white'}`}
          title={name}
        >
          {name}
        </span>
        <span className={`block truncate text-xs ${isLight ? 'text-slate-500' : 'text-brand-200'}`}>
          {ROLE_LABELS[role]}
        </span>
      </span>
    </div>
  );
}

/**
 * Shared application shell for authenticated pages.
 *
 * - Header: brand, operative location selector, authenticated user and logout.
 * - Sidebar: grouped, role-filtered navigation built from the centralized
 *   `navigation.ts` config. Collapsible on desktop and a drawer on small
 *   screens.
 * - Main: existing routed screens inside a light content surface.
 *
 * Authentication, authorization, location selection and logout logic are
 * reused as-is. The session profile is revalidated when the tab regains focus
 * so role changes made outside this session update the navigation and guards.
 */
export function AppLayout({ children }: { children?: ReactNode }) {
  useSessionProfileRefresh();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const activeLocation = useLocationStore((state) => state.activeLocation);
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLElement>(null);
  const restoreMenuFocusRef = useRef(false);

  useEffect(() => {
    if (!isMobileMenuOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    // The drawer only exists below `lg`; closing it when the viewport grows
    // prevents a hidden-but-open drawer from locking the page scroll.
    const desktopMediaQuery =
      typeof window.matchMedia === 'function' ? window.matchMedia('(min-width: 1024px)') : null;
    function handleDesktopChange(event: MediaQueryListEvent) {
      if (event.matches) {
        setIsMobileMenuOpen(false);
      }
    }
    desktopMediaQuery?.addEventListener('change', handleDesktopChange);

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        restoreMenuFocusRef.current = true;
        setIsMobileMenuOpen(false);
        return;
      }

      if (event.key !== 'Tab') {
        return;
      }

      const drawer = drawerRef.current;
      if (!drawer) {
        return;
      }

      const focusable = drawer.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]):not([tabindex="-1"]), select:not([disabled]), input:not([disabled]), textarea:not([disabled])',
      );
      if (focusable.length === 0) {
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
      desktopMediaQuery?.removeEventListener('change', handleDesktopChange);
    };
  }, [isMobileMenuOpen]);

  // Focus restoration runs after the drawer unmounts (and after `inert` is
  // released), so it works for Escape, the close button and the backdrop.
  useEffect(() => {
    if (isMobileMenuOpen || !restoreMenuFocusRef.current) {
      return;
    }
    restoreMenuFocusRef.current = false;
    menuButtonRef.current?.focus();
  }, [isMobileMenuOpen]);

  function handleMobileNavigate() {
    setIsMobileMenuOpen(false);
    // Keep keyboard and screen-reader context on the newly rendered screen.
    mainRef.current?.focus();
  }

  function dismissMobileMenu() {
    restoreMenuFocusRef.current = true;
    setIsMobileMenuOpen(false);
  }

  function handleLogout() {
    setIsMobileMenuOpen(false);
    logout();
    navigate(ROUTES.login, { replace: true });
  }

  return (
    <div className="flex min-h-dvh flex-col bg-slate-100">
      <div inert={isMobileMenuOpen ? true : undefined} className="flex flex-1 flex-col">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-[60] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-brand-800 focus:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        >
          Saltar al contenido
        </a>

        <header className="sticky top-0 z-40 bg-brand-950 shadow-sm">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-3 sm:px-4 lg:flex-nowrap lg:px-6">
            <div className="flex min-w-0 items-center gap-2.5">
              <BrandLogo height={30} tone="white" />
              <span className="truncate text-base font-semibold text-white">Mundo Portátil</span>
            </div>

            {user && (
              <button
                ref={menuButtonRef}
                type="button"
                onClick={() => setIsMobileMenuOpen(true)}
                aria-expanded={isMobileMenuOpen}
                aria-controls="mobile-navigation-drawer"
                aria-label="Abrir menú"
                aria-haspopup="dialog"
                className="ml-auto inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/25 text-white transition-colors hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80 lg:hidden"
              >
                <MenuIcon className="h-5 w-5" />
              </button>
            )}

            <div className="order-last w-full min-w-0 lg:order-none lg:ml-auto lg:w-auto">
              <LocationSelector />
            </div>

            {user && (
              <div className="hidden min-w-0 items-center gap-3 lg:flex">
                <span aria-hidden="true" className="h-8 w-px shrink-0 bg-white/15" />
                <div className="min-w-0 max-w-56">
                  <UserIdentity name={user.name} role={user.role} />
                </div>
                <button type="button" onClick={handleLogout} className={HEADER_ACTION_BASE_CLASS}>
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>

          {activeLocation && (
            <div className="border-y border-brand-100 bg-brand-50">
              <div
                role="status"
                aria-live="polite"
                className="flex w-full items-center gap-2 px-3 py-2 text-xs text-brand-900 sm:px-4 lg:px-6"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4 shrink-0 text-brand-700"
                >
                  <path d="M12 21s7-5.4 7-11a7 7 0 1 0-14 0c0 5.6 7 11 7 11Z" />
                  <circle cx="12" cy="10" r="2.5" />
                </svg>
                <span className="shrink-0 font-medium">Ubicación operativa:</span>
                <span className="truncate" title={activeLocation.name}>
                  {activeLocation.name}
                </span>
              </div>
            </div>
          )}
        </header>

        <div className="flex flex-1 flex-col lg:flex-row">
          <aside
            id="app-sidebar"
            aria-label="Menú lateral"
            className={`hidden shrink-0 flex-col border-r border-slate-200 bg-white transition-[width] duration-200 ease-out lg:flex ${
              isCollapsed ? 'w-20' : 'w-64'
            }`}
          >
            <div className="border-b border-slate-200 p-2">
              <button
                type="button"
                onClick={() => setIsCollapsed((value) => !value)}
                aria-expanded={!isCollapsed}
                aria-controls="app-sidebar"
                aria-label={isCollapsed ? 'Expandir menú lateral' : 'Contraer menú lateral'}
                title={isCollapsed ? 'Expandir menú lateral' : 'Contraer menú lateral'}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1 ${
                  isCollapsed ? 'justify-center px-2' : ''
                }`}
              >
                {isCollapsed ? (
                  <ChevronRightIcon className="h-5 w-5 shrink-0" />
                ) : (
                  <ChevronLeftIcon className="h-5 w-5 shrink-0" />
                )}
                {!isCollapsed && <span className="truncate">Contraer menú</span>}
              </button>
            </div>

            <div className="px-2 py-4">
              <SidebarNav collapsed={isCollapsed} ariaLabel="Navegación principal" />
            </div>
          </aside>

          <main
            ref={mainRef}
            id="main-content"
            tabIndex={-1}
            className="min-w-0 flex-1 px-4 py-6 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-500 sm:px-6 sm:py-8 lg:px-8"
          >
            {children ?? <Outlet />}
          </main>
        </div>
      </div>

      {user && isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            tabIndex={-1}
            aria-hidden="true"
            data-testid="mobile-menu-backdrop"
            onClick={dismissMobileMenu}
            className="absolute inset-0 h-full w-full cursor-default bg-slate-900/50"
          />

          <div
            ref={drawerRef}
            id="mobile-navigation-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Menú de navegación"
            className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col overscroll-contain bg-white shadow-xl"
          >
            <div className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-slate-200 px-4">
              <div className="flex min-w-0 items-center gap-2">
                <BrandLogo height={26} tone="brand" />
                <span className="truncate text-base font-semibold text-slate-900">
                  Mundo Portátil
                </span>
              </div>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={dismissMobileMenu}
                aria-label="Cerrar menú"
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1"
              >
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-2 py-4">
              <SidebarNav ariaLabel="Navegación móvil" onNavigate={handleMobileNavigate} />
            </div>

            <div className="shrink-0 border-t border-slate-200 p-4">
              <UserIdentity name={user.name} role={user.role} tone="light" />
              <button
                type="button"
                onClick={handleLogout}
                className={`${DRAWER_ACTION_BASE_CLASS} mt-3 w-full`}
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
