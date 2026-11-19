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
  inventoryCategories: '/inventory/categories',
  auditLogs: '/audit-logs',
  unauthorized: '/unauthorized',
} as const;
