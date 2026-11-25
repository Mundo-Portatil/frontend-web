import { useEffect, useId, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Can } from '../guards/Can';
import { ChevronRightIcon } from './icons';
import { getNavigationGroups, type NavChild, type NavItem } from './navigation';

function isNavChildActive(child: NavChild, path: string): boolean {
  return (
    child.activePaths.includes(path) ||
    (child.activePrefixes?.some((prefix) => path === prefix || path.startsWith(`${prefix}/`)) ?? false)
  );
}

const LINK_BASE_CLASS =
  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1';

const LINK_ACTIVE_CLASS = 'bg-brand-50 text-brand-800 ring-1 ring-inset ring-brand-100';

const LINK_INACTIVE_CLASS = 'text-slate-600 hover:bg-slate-100 hover:text-slate-900';

const LINK_COLLAPSED_CLASS = 'justify-center px-2';

const ICON_CLASS = 'h-5 w-5 shrink-0';

/** The navigation config is static; groups are computed once per module load. */
const NAVIGATION_GROUPS = getNavigationGroups();

interface SidebarNavProps {
  /** Collapsed mode hides the labels but keeps an accessible name. */
  collapsed?: boolean;
  /** Called after a navigation item is activated (closes the mobile drawer). */
  onNavigate?: () => void;
  /** Accessible name of the nav landmark. */
  ariaLabel: string;
}

/**
 * Grouped, role-filtered navigation rendered inside the sidebar.
 *
 * Visibility goes through `Can` (FR-015): the item roles come from the
 * centralized nav config and the group is hidden when none of its items is
 * allowed for the authenticated role. Hiding items here never replaces the
 * route guards or backend authorization.
 */
export function SidebarNav({ collapsed = false, onNavigate, ariaLabel }: SidebarNavProps) {
  const headingIdPrefix = useId();

  return (
    <nav aria-label={ariaLabel} className="flex flex-col gap-4">
      {NAVIGATION_GROUPS.map((group) => {
        const headingId = `${headingIdPrefix}-${group.id}`;

        return (
          <Can key={group.id} roles={group.roles}>
            <section
              aria-labelledby={headingId}
              className={
                collapsed
                  ? 'border-t border-slate-200 pt-3 first:border-t-0 first:pt-0'
                  : 'border-t border-slate-100 pt-4 first:border-t-0 first:pt-0'
              }
            >
              <p
                id={headingId}
                className={
                  collapsed
                    ? 'sr-only'
                    : 'mb-1 px-3 text-[0.6875rem] font-semibold uppercase tracking-wider text-slate-600'
                }
              >
                {group.label}
              </p>
              <ul className="flex flex-col gap-1">
                {group.items.map((item) => (
                  <Can key={item.id} roles={item.roles}>
                    <SidebarItem item={item} collapsed={collapsed} onNavigate={onNavigate} />
                  </Can>
                ))}
              </ul>
            </section>
          </Can>
        );
      })}
    </nav>
  );
}


function SidebarItem({
  item,
  collapsed,
  onNavigate,
}: {
  item: NavItem;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const { pathname } = useLocation();
  const path = pathname.replace(/\/+$/, '') || '/';
  const isActive = item.children?.some((child) => isNavChildActive(child, path)) ?? false;
  const [disclosure, setDisclosure] = useState({ path, collapsed, open: isActive && !collapsed });
  // A new route opens its branch; users can still collapse it on the current route.
  const open = disclosure.path === path && disclosure.collapsed === collapsed
    ? disclosure.open
    : isActive && !collapsed;
  const childListId = useId();
  const containerRef = useRef<HTMLLIElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!collapsed || !open) return;
    function dismissOutside(event: PointerEvent) {
      if (event.target instanceof Node && !containerRef.current?.contains(event.target)) {
        setDisclosure({ path, collapsed, open: false });
      }
    }
    document.addEventListener('pointerdown', dismissOutside);
    return () => document.removeEventListener('pointerdown', dismissOutside);
  }, [collapsed, open, path]);

  if (!item.children) {
    return (
      <li>
        <NavLink
          to={item.to}
          onClick={onNavigate}
          title={collapsed ? item.label : undefined}
          aria-label={collapsed ? item.label : undefined}
          className={({ isActive: active }) =>
            `${LINK_BASE_CLASS} ${collapsed ? LINK_COLLAPSED_CLASS : ''} ${active ? LINK_ACTIVE_CLASS : LINK_INACTIVE_CLASS}`
          }
        >
          <item.icon className={ICON_CLASS} />
          <span className={collapsed ? 'sr-only' : 'truncate'}>{item.label}</span>
        </NavLink>
      </li>
    );
  }

  return (
    <li
      ref={containerRef}
      className="relative"
      onBlur={(event) => {
        if (collapsed && !event.currentTarget.contains(event.relatedTarget)) {
          setDisclosure({ path, collapsed, open: false });
        }
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && open) {
          event.preventDefault();
          event.stopPropagation();
          setDisclosure({ path, collapsed, open: false });
          buttonRef.current?.focus();
        }
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={childListId}
        aria-label={collapsed ? item.label : undefined}
        title={collapsed ? item.label : undefined}
        onClick={() => setDisclosure({ path, collapsed, open: !open })}
        className={`${LINK_BASE_CLASS} w-full ${collapsed ? LINK_COLLAPSED_CLASS : ''} ${isActive ? LINK_ACTIVE_CLASS : LINK_INACTIVE_CLASS}`}
      >
        <item.icon className={ICON_CLASS} />
        <span className={collapsed ? 'sr-only' : 'flex-1 truncate text-left'}>{item.label}</span>
        {!collapsed && <ChevronRightIcon className={`h-4 w-4 shrink-0 ${open ? 'rotate-90' : ''}`} />}
      </button>
      <ul
        id={childListId}
        hidden={!open}
        aria-label={item.label}
        className={collapsed
          ? 'absolute left-full top-0 z-50 ml-3 w-48 space-y-1 rounded-xl border border-slate-200 bg-white p-2 shadow-lg'
          : 'ml-5 mt-1 space-y-1 border-l border-slate-200 pl-3'}
      >
        {item.children.map((child) => {
          const childActive = isNavChildActive(child, path);
          return (
            <Can key={child.id} roles={child.roles}>
              <li>
                <Link
                  to={child.to}
                  aria-current={childActive ? 'page' : undefined}
                  onClick={() => {
                    if (collapsed) {
                      setDisclosure({ path: child.to, collapsed, open: false });
                      buttonRef.current?.focus();
                    }
                    onNavigate?.();
                  }}
                  className={`${LINK_BASE_CLASS} ${childActive ? LINK_ACTIVE_CLASS : LINK_INACTIVE_CLASS}`}
                >
                  <span className="truncate">{child.label}</span>
                </Link>
              </li>
            </Can>
          );
        })}
      </ul>
    </li>
  );
}
