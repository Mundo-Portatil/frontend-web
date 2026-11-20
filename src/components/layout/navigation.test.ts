import { describe, expect, it } from 'vitest';
import { ROUTES } from '../../router/routes';
import type { NavItem } from './navigation';
import { getNavigationGroups, NAV_ITEMS } from './navigation';

const BASE_ITEM: Omit<NavItem, 'id' | 'label' | 'to' | 'group' | 'roles'> = {
  icon: () => null,
};

describe('getNavigationGroups', () => {
  it('only exposes implemented modules', () => {
    expect(NAV_ITEMS.map((item) => item.id)).toEqual(['inventory', 'locations', 'users', 'audit-logs']);
  });

  it('points every navigation item to a registered route', () => {
    const registeredPaths = new Set<string>(Object.values(ROUTES));

    for (const item of NAV_ITEMS) {
      expect(registeredPaths.has(item.to)).toBe(true);
    }
  });

  it('omits groups without available items (e.g. General has no usable screen yet)', () => {
    const groups = getNavigationGroups();

    expect(groups.map((group) => group.id)).toEqual(['operations', 'administration']);
    expect(groups[1].items.map((item) => item.label)).toEqual([
      'Ubicaciones',
      'Usuarios',
      'Bitácora',
    ]);
  });

  it('drops items whose module is not available', () => {
    const items: NavItem[] = [
      { ...BASE_ITEM, id: 'locations', label: 'Ubicaciones', to: '/locations', group: 'administration', roles: ['ADMIN'] },
      {
        ...BASE_ITEM,
        id: 'inventory',
        label: 'Inventario',
        to: '/inventory',
        group: 'operations',
        roles: ['ADMIN'],
        isAvailable: () => false,
      },
    ];

    const groups = getNavigationGroups(items);

    expect(groups.map((group) => group.id)).toEqual(['administration']);
    expect(groups[0].items.map((item) => item.id)).toEqual(['locations']);
  });

  it('computes the group roles union for role-based group visibility', () => {
    const items: NavItem[] = [
      { ...BASE_ITEM, id: 'locations', label: 'Ubicaciones', to: '/locations', group: 'administration', roles: ['ADMIN', 'VENDEDOR'] },
      { ...BASE_ITEM, id: 'users', label: 'Usuarios', to: '/users', group: 'administration', roles: ['ADMIN'] },
    ];

    expect(getNavigationGroups(items)[0].roles).toEqual(['ADMIN', 'VENDEDOR']);
  });

  it('keeps the configured group order for future modules', () => {
    const items: NavItem[] = [
      { ...BASE_ITEM, id: 'locations', label: 'Ubicaciones', to: '/locations', group: 'administration', roles: ['ADMIN'] },
      { ...BASE_ITEM, id: 'inventory', label: 'Inventario', to: '/inventory', group: 'operations', roles: ['ADMIN'] },
      { ...BASE_ITEM, id: 'audit', label: 'Auditoría Express', to: '/audit', group: 'control', roles: ['ADMIN'] },
    ];

    expect(getNavigationGroups(items).map((group) => group.id)).toEqual([
      'operations',
      'control',
      'administration',
    ]);
  });
});
