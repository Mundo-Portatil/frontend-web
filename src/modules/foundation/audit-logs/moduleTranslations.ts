import { humanizeIdentifier } from './humanizeIdentifier';

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
  catalog: 'Productos y modelos',
  'hardware-items': 'Equipos y piezas',
  'quantity-stock': 'Inventario por cantidad',
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
  catalog: 'catalog',
  catalogo: 'catalog',
  'productos y modelos': 'catalog',
  productos: 'catalog',
  'hardware-items': 'hardware-items',
  hardware_items: 'hardware-items',
  'equipos y piezas': 'hardware-items',
  'quantity-stock': 'quantity-stock',
  quantity_stock: 'quantity-stock',
  'inventario por cantidad': 'quantity-stock',
};

function normalizeModuleValue(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/** Translate known modules; only humanize unfamiliar identifiers for display. */
export function formatAuditModule(module: string): string {
  const key = resolveModuleFilter(module);
  return Object.hasOwn(MODULE_LABELS, key) ? MODULE_LABELS[key] : humanizeIdentifier(module, 'Sin módulo registrado');
}

/** Resolves the typed module (identifier or visible label) to the API value. */
export function resolveModuleFilter(value: string): string {
  const normalized = normalizeModuleValue(value);
  if (!normalized) {
    return '';
  }
  return Object.hasOwn(MODULE_ALIASES, normalized) ? MODULE_ALIASES[normalized] : value.trim();
}
