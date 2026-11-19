import type { ComponentType, SVGProps } from 'react';
import type { Role } from '../../modules/foundation/auth/models';
import { ROUTES } from '../../router/routes';
import { AuditLogIcon, CategoriesIcon, LocationsIcon, UsersIcon } from './icons';

/**
 * Centralized, typed navigation definition for the application shell.
 *
 * The sidebar only renders items that are actually implemented and available.
 * When a future phase ships a module, add its entry here: the layout, role
 * filtering and responsive behaviour are resolved automatically.
 *
 * Adding a new module:
 * 1. Register its route in `src/router/routes.ts` and `src/router/index.tsx`
 *    (with the matching guards).
 * 2. Append one `NavItem` with its group, icon and allowed roles.
 * 3. If the module must stay hidden until it is enabled, provide
 *    `isAvailable` (keep this simple; no feature-flag framework is needed).
 */

export type NavGroupId = 'general' | 'operations' | 'control' | 'administration';

export interface NavGroupDefinition {
  id: NavGroupId;
  label: string;
}

export interface NavItem {
  /** Unique identifier for the navigation entry. */
  id: string;
  /** Visible name (also used as the accessible name when collapsed). */
  label: string;
  /** Icon rendered next to the label. */
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  /** Route path owned by the module. */
  to: string;
  /** Navigation group the entry belongs to. */
  group: NavGroupId;
  /** Roles allowed to see and use the entry (FR-015). */
  roles: Role[];
  /**
   * Optional module availability condition. Items without it are considered
   * available. Used to keep a module hidden until it is enabled without
   * duplicating links across components.
   */
  isAvailable?: () => boolean;
}

/** Ordered groups. Empty groups are never rendered. */
export const NAV_GROUPS: readonly NavGroupDefinition[] = [
  { id: 'general', label: 'General' },
  { id: 'operations', label: 'Operaciones' },
  { id: 'control', label: 'Control' },
  { id: 'administration', label: 'Administración' },
];

/**
 * Navigation for implemented and available modules.
 * Future modules (Ventas/POS, Catálogo, Traslados, Servicio técnico, Caja,
 * Auditoría Express, Aprobaciones, Trazabilidad) must not be added until their
 * phase is implemented, integrated and enabled.
 */
export const NAV_ITEMS: readonly NavItem[] = [
  {
    id: 'inventory-catalog',
    label: 'Catálogo',
    icon: CategoriesIcon,
    to: ROUTES.inventoryCatalog,
    group: 'operations',
    roles: ['ADMIN', 'VENDEDOR', 'TECNICO'],
  },
  {
    id: 'inventory-categories',
    label: 'Categorías',
    icon: CategoriesIcon,
    to: ROUTES.inventoryCategories,
    group: 'operations',
    roles: ['ADMIN', 'VENDEDOR', 'TECNICO'],
  },
  {
    id: 'locations',
    label: 'Ubicaciones',
    icon: LocationsIcon,
    to: ROUTES.locations,
    group: 'administration',
    roles: ['ADMIN', 'VENDEDOR', 'TECNICO'],
  },
  {
    id: 'users',
    label: 'Usuarios',
    icon: UsersIcon,
    to: ROUTES.users,
    group: 'administration',
    roles: ['ADMIN'],
  },
  {
    id: 'audit-logs',
    label: 'Bitácora',
    icon: AuditLogIcon,
    to: ROUTES.auditLogs,
    group: 'administration',
    roles: ['ADMIN'],
  },
];

export interface NavGroup extends NavGroupDefinition {
  items: NavItem[];
  /** Union of the item roles, used to hide empty groups per role. */
  roles: Role[];
}

/**
 * Builds the groups to render from the available items. Groups without
 * available items are dropped, so the menu never shows empty sections.
 */
export function getNavigationGroups(items: readonly NavItem[] = NAV_ITEMS): NavGroup[] {
  const availableItems = items.filter((item) => item.isAvailable?.() ?? true);

  return NAV_GROUPS.map((group) => {
    const groupItems = availableItems.filter((item) => item.group === group.id);
    const roles = [...new Set(groupItems.flatMap((item) => item.roles))];

    return { ...group, items: groupItems, roles };
  }).filter((group) => group.items.length > 0 && group.roles.length > 0);
}
