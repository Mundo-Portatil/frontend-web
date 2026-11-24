import type { AuditLog } from './models';
import { humanizeIdentifier } from './humanizeIdentifier';

/**
 * Centralized Spanish presentation for audit log actions.
 *
 * API action values are never modified; this module only translates them for
 * display. When a module starts recording a new action, add its translation
 * here so the rest of the screen does not need to change.
 */
export const ACTION_LABELS: Record<string, string> = {
  LOGIN: 'Inició sesión',
  CREATE_USER: 'Creó usuario',
  UPDATE_USER: 'Usuario actualizado',
  CREATE_LOCATION: 'Creó ubicación',
  UPDATE_LOCATION: 'Ubicación actualizada',
  CREATE_CATEGORY: 'Categoría creada',
  UPDATE_CATEGORY: 'Categoría actualizada',
  UPDATE_PROFILE: 'Perfil personal actualizado',
  CREATE_CATALOG_ITEM: 'Producto registrado',
  UPDATE_CATALOG_ITEM: 'Producto actualizado',
  CREATE_PASS_THROUGH_CATALOG_MODEL: 'Modelo de producto por pase registrado',
  CREATE_HARDWARE_ITEM: 'Equipo o pieza registrado',
  UPDATE_HARDWARE_ITEM: 'Equipo o pieza actualizado',
  BATCH_INBOUND_HARDWARE: 'Ingreso de equipos por lote',
  ATTACH_HARDWARE_CHILD: 'Componentes vinculados al equipo',
  DETACH_HARDWARE_CHILD: 'Componente separado del equipo',
  DECOMMISSION_HARDWARE_ITEM: 'Equipo o pieza dado de baja',
  APPROVE_USED_COMPONENT: 'Componente usado aprobado',
  PRINT_BARCODE_LABEL: 'Solicitud de etiqueta de equipo o pieza',
  PRINT_BARCODE_LABELS_BATCH: 'Solicitud de etiquetas por lote',
  INBOUND_QUANTITY_STOCK: 'Ingreso de unidades al inventario',
  ADJUST_QUANTITY_STOCK: 'Corrección de cantidades del inventario',
  DECREASE_QUANTITY_STOCK: 'Salida de unidades del inventario',
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
    descriptions.push('Usuario desactivado');
  }
  if (changes.active === true) {
    descriptions.push('Usuario reactivado');
  }
  if (changes.role !== undefined) {
    descriptions.push('Rol de usuario modificado');
  }
  if (typeof changes.name === 'string') {
    descriptions.push('Nombre de usuario actualizado');
  }
  if (changes.passwordUpdated === true) {
    descriptions.push('Contraseña de usuario actualizada');
  }

  return descriptions;
}

function describeLocationChanges(payload: Record<string, unknown>): string[] {
  const changes = readChanges(payload);
  const descriptions: string[] = [];

  if (changes.active === false) {
    descriptions.push('Ubicación desactivada');
  }
  if (changes.active === true) {
    descriptions.push('Ubicación reactivada');
  }
  if (typeof changes.name === 'string') {
    descriptions.push('Nombre de ubicación actualizado');
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

  const label = ACTION_LABELS[actionKey] ?? humanizeIdentifier(item.action, 'Sin acción registrada');
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
