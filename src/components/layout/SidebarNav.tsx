import { useId } from 'react';
import { NavLink } from 'react-router-dom';
import { Can } from '../guards/Can';
import { getNavigationGroups } from './navigation';

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
                    <li>
                      <NavLink
                        to={item.to}
                        onClick={onNavigate}
                        title={collapsed ? item.label : undefined}
                        aria-label={collapsed ? item.label : undefined}
                        className={({ isActive }) =>
                          `${LINK_BASE_CLASS} ${collapsed ? LINK_COLLAPSED_CLASS : ''} ${
                            isActive ? LINK_ACTIVE_CLASS : LINK_INACTIVE_CLASS
                          }`
                        }
                      >
                        <item.icon className={ICON_CLASS} />
                        <span className={collapsed ? 'sr-only' : 'truncate'}>{item.label}</span>
                      </NavLink>
                    </li>
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
