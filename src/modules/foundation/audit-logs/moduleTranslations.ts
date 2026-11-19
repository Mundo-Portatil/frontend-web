/**
 * Centralized Spanish presentation for audit log modules.
 *
 * API module identifiers are never modified; this module only translates them
 * for display and resolves the aliases accepted by the filter. Add new module
 * entries here when a future phase starts recording audit events.
 */
export const MODULE_LABELS: Record<string, string> = {
  auth: 'Autenticación',
  users: 'Usuarios',
  locations: 'Ubicaciones',
  categories: 'Categorías',
};

/** Maps the labels and aliases typed in the filter to the API identifier. */
const MODULE_ALIASES: Record<string, string> = {
  auth: 'auth',
  autenticacion: 'auth',
  users: 'users',
  usuario: 'users',
  usuarios: 'users',
  locations: 'locations',
  ubicacion: 'locations',
  ubicaciones: 'locations',
  categories: 'categories',
  categoria: 'categories',
  categorias: 'categories',
};

function normalizeModuleValue(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/** Translates a module identifier for display, keeping unknown values as-is. */
export function formatAuditModule(module: string): string {
  return MODULE_LABELS[normalizeModuleValue(module)] ?? module;
}

/** Resolves the typed module (identifier or visible label) to the API value. */
export function resolveModuleFilter(value: string): string {
  const normalized = normalizeModuleValue(value);
  if (!normalized) {
    return '';
  }
  return MODULE_ALIASES[normalized] ?? normalized;
}
