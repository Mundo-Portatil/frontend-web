/**
 * Centralized route path constants, shared by the router, the layout and
 * the guards. Contains no components, so it can be imported anywhere
 * without circular dependencies.
 */
export const ROUTES = {
  login: '/login',
  locations: '/locations',
  users: '/users',
  profile: '/profile',
  inventory: '/inventory',
  inventoryStock: '/inventory/stock',
  inventoryInbound: '/inventory/inbound',
  inventoryCatalog: '/inventory/catalog',
  inventoryCategories: '/inventory/categories',
  inventoryLabels: '/inventory/labels',
  inventorySecondHand: '/inventory/second-hand',
  // Legacy alias
  inventoryConsult: '/inventory/stock',
  auditLogs: '/audit-logs',
  unauthorized: '/unauthorized',
} as const;
