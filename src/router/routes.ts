/**
 * Centralized route path constants, shared by the router, the layout and
 * the guards. Contains no components, so it can be imported anywhere
 * without circular dependencies.
 */
export const ROUTES = {
  login: '/login',
  logistics: '/logistics',
  logisticsNew: '/logistics/new',
  locations: '/locations',
  users: '/users',
  profile: '/profile',
  inventory: '/inventory',
  inventoryInbound: '/inventory/inbound',
  inventoryComponents: '/inventory/components',
  inventoryAdjustments: '/inventory/adjustments',
  inventoryLabels: '/inventory/labels',
  inventoryStock: '/inventory/stock',
  inventoryCategories: '/inventory/categories',
  inventoryCatalog: '/inventory/catalog',
  auditLogs: '/audit-logs',
  unauthorized: '/unauthorized',
} as const;
