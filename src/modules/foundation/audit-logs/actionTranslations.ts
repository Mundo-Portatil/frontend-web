import type { AuditLog } from './models';

/**
 * Centralized Spanish presentation for audit log actions.
 *
 * API action values are never modified; this module only translates them for
 * display. When a module starts recording a new action, add its translation
 * here so the rest of the screen does not need to change.
 */
export const ACTION_LABELS: Record<string, string> = {
  LOGIN: 'Inició sesión',
  DEACTIVATE_USER: 'Desactivó un usuario',
  REACTIVATE_USER: 'Reactivó un usuario',
  UNIFIED_INVENTORY_INBOUND: 'Registró un ingreso de mercancía al Almacén Central',
  PRINT_MODEL_BARCODE_LABELS: 'Solicitó etiquetas de un modelo de producto',
  CREATE_USER: 'Creó un usuario',
  UPDATE_USER: 'Modificó un usuario',
  CREATE_LOCATION: 'Creó una ubicación',
  UPDATE_LOCATION: 'Modificó una ubicación',
  CREATE_CATEGORY: 'Creó una categoría',
  UPDATE_CATEGORY: 'Modificó una categoría',
  UPDATE_PROFILE: 'Modificó su perfil personal',
  CREATE_CATALOG_ITEM: 'Registró un modelo de producto',
  UPDATE_CATALOG_ITEM: 'Modificó un modelo de producto',
  CREATE_PASS_THROUGH_CATALOG_MODEL: 'Registró un modelo para una venta por encargo',
  CREATE_HARDWARE_ITEM: 'Registró un equipo o componente',
  UPDATE_HARDWARE_ITEM: 'Modificó un equipo o componente',
  BATCH_INBOUND_HARDWARE: 'Registró un ingreso de equipos por número de serie',
  ATTACH_HARDWARE_CHILD: 'Vinculó componentes a un equipo',
  DETACH_HARDWARE_CHILD: 'Separó un componente de un equipo',
  DECOMMISSION_HARDWARE_ITEM: 'Dio de baja un equipo o componente',
  APPROVE_USED_COMPONENT: 'Aprobó un componente de segunda mano',
  PRINT_BARCODE_LABEL: 'Solicitó una etiqueta de equipo o componente',
  PRINT_BARCODE_LABELS_BATCH: 'Solicitó etiquetas para varias unidades',
  INBOUND_QUANTITY_STOCK: 'Registró un ingreso de mercancía por cantidad',
  ADJUST_QUANTITY_STOCK: 'Corrigió las cantidades del inventario',
  DECREASE_QUANTITY_STOCK: 'Registró una salida de mercancía',
};

/** Accepts `UPDATE_CATEGORY`, `update category` or `update-category`. */
function normalizeActionKey(action: string): string {
  return action.trim().replace(/([a-z\d])([A-Z])/g, '$1_$2').replace(/[\s-]+/g, '_').toUpperCase();
}

function readChanges(payload: Record<string, unknown>): Record<string, unknown> {
  const changes = payload.changes;
  return typeof changes === 'object' && changes !== null && !Array.isArray(changes)
    ? (changes as Record<string, unknown>)
    : {};
}

function describeUserChanges(payload: Record<string, unknown>): string[] {
  const changes = readChanges(payload);
  const descriptions: string[] = [];

  if (changes.active === false) {
    descriptions.push('Desactivó un usuario');
  }
  if (changes.active === true) {
    descriptions.push('Reactivó un usuario');
  }
  if (changes.role !== undefined) {
    descriptions.push('Modificó el rol de un usuario');
  }
  if (typeof changes.name === 'string') {
    descriptions.push('Modificó el nombre de un usuario');
  }
  if (changes.passwordUpdated === true) {
    descriptions.push('Modificó la contraseña de un usuario');
  }

  return descriptions;
}

function describeLocationChanges(payload: Record<string, unknown>): string[] {
  const changes = readChanges(payload);
  const descriptions: string[] = [];

  if (changes.active === false) {
    descriptions.push('Desactivó una ubicación');
  }
  if (changes.active === true) {
    descriptions.push('Reactivó una ubicación');
  }
  if (typeof changes.name === 'string') {
    descriptions.push('Modificó el nombre de una ubicación');
  }

  return descriptions;
}

function describeRecordChanges(payload: Record<string, unknown>, entity: 'Producto' | 'Categoría'): string[] {
  const changes = readChanges(payload);
  const descriptions: string[] = [];
  if (changes.active === true) descriptions.push(entity === 'Producto' ? 'Estado de producto: activo' : 'Estado de categoría: activa');
  if (changes.active === false) descriptions.push(entity === 'Producto' ? 'Estado de producto: inactivo' : 'Estado de categoría: inactiva');
  if (typeof changes.name === 'string') descriptions.push(entity === 'Producto' ? 'Nombre de producto actualizado' : 'Nombre de categoría actualizado');
  return descriptions;
}

function finiteCount(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}

/** Descriptions use only known payload properties; raw events remain unchanged. */
export function formatAuditAction(item: AuditLog): string {
  const actionKey = normalizeActionKey(item.action);
  let descriptions: string[] = [];
  if (actionKey === 'UPDATE_USER') descriptions = describeUserChanges(item.payload);
  if (actionKey === 'UPDATE_LOCATION') descriptions = describeLocationChanges(item.payload);
  if (actionKey === 'UPDATE_CATALOG_ITEM') descriptions = describeRecordChanges(item.payload, 'Producto');
  if (actionKey === 'UPDATE_CATEGORY') descriptions = describeRecordChanges(item.payload, 'Categoría');
  if (actionKey === 'UPDATE_PROFILE') {
    const changes = readChanges(item.payload);
    if (typeof changes.name === 'string') descriptions.push('Nombre de perfil actualizado');
    if (typeof changes.email === 'string') descriptions.push('Correo de perfil actualizado');
    if (changes.passwordUpdated === true) descriptions.push('Contraseña actualizada');
  }
  if (descriptions.length) return descriptions.join(' · ');

  const label = ACTION_LABELS[actionKey] ?? (actionKey ? 'Registró una actividad' : 'Sin acción registrada');
  if (actionKey === 'UNIFIED_INVENTORY_INBOUND' && finiteCount(item.payload.totalUnits)) return `${label} · ${item.payload.totalUnits} unidades`;
  if (actionKey === 'PRINT_MODEL_BARCODE_LABELS' && finiteCount(item.payload.copies)) return `${label} · ${item.payload.copies} copias`;
  if (actionKey === 'INBOUND_QUANTITY_STOCK') {
    const details = [label];
    if (finiteCount(item.payload.inboundQuantity)) details.push(`${item.payload.inboundQuantity} unidades`);
    if (finiteCount(item.payload.totalResultingQuantity)) details.push(`Saldo: ${item.payload.totalResultingQuantity}`);
    return details.join(' · ');
  }
  if (actionKey === 'ADJUST_QUANTITY_STOCK' && finiteCount(item.payload.newQuantity)) {
    return `${label} · Nuevo total: ${item.payload.newQuantity}`;
  }
  if (actionKey === 'BATCH_INBOUND_HARDWARE' && finiteCount(item.payload.parentCount)) {
    return `${label} · ${item.payload.parentCount} equipos o piezas`;
  }
  return label;
}
