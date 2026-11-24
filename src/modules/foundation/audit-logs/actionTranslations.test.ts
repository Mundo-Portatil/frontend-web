import { describe, expect, it } from 'vitest';
import { formatAuditAction } from './actionTranslations';
import type { AuditLog } from './models';

function auditLog(action: string, payload: Record<string, unknown> = {}): AuditLog {
  return {
    id: 'log-1',
    userId: null,
    action,
    module: 'test',
    payload,
    ipAddress: null,
    createdAt: '2026-11-14T20:30:00.000Z',
  };
}

describe('formatAuditAction', () => {
  it('translates known base actions to Spanish', () => {
    expect(formatAuditAction(auditLog('LOGIN'))).toBe('Inició sesión');
    expect(formatAuditAction(auditLog('CREATE_USER'))).toBe('Creó usuario');
    expect(formatAuditAction(auditLog('CREATE_LOCATION'))).toBe('Creó ubicación');
    expect(formatAuditAction(auditLog('CREATE_CATEGORY'))).toBe('Categoría creada');
    expect(formatAuditAction(auditLog('UPDATE_CATEGORY'))).toBe('Categoría actualizada');
  });

  it('accepts category actions written with spaces or lowercase', () => {
    expect(formatAuditAction(auditLog('update category'))).toBe('Categoría actualizada');
    expect(formatAuditAction(auditLog('create category'))).toBe('Categoría creada');
    expect(formatAuditAction(auditLog('Update-Category'))).toBe('Categoría actualizada');
  });

  it('keeps the specific user update descriptions from the payload', () => {
    expect(formatAuditAction(auditLog('UPDATE_USER', { changes: { active: false } }))).toBe(
      'Usuario desactivado',
    );
    expect(formatAuditAction(auditLog('UPDATE_USER', { changes: { active: true } }))).toBe(
      'Usuario reactivado',
    );
    expect(formatAuditAction(auditLog('UPDATE_USER', { changes: { role: 'ADMIN' } }))).toBe(
      'Rol de usuario modificado',
    );
    expect(formatAuditAction(auditLog('UPDATE_USER', { changes: { name: 'Nuevo nombre' } }))).toBe(
      'Nombre de usuario actualizado',
    );
    expect(
      formatAuditAction(auditLog('UPDATE_USER', { changes: { passwordUpdated: true } })),
    ).toBe('Contraseña de usuario actualizada');
  });

  it('falls back to the generic description when the update payload has no changes', () => {
    expect(formatAuditAction(auditLog('UPDATE_USER'))).toBe('Usuario actualizado');
    expect(formatAuditAction(auditLog('UPDATE_LOCATION'))).toBe('Ubicación actualizada');
  });

  it('humanizes unknown actions without inventing their meaning', () => {
    expect(formatAuditAction(auditLog('export report'))).toBe('Export report');
    expect(formatAuditAction(auditLog('IMPORT_PAYMENTS'))).toBe('Import payments');
    expect(formatAuditAction(auditLog('syncExternalRecords'))).toBe('Sync external records');
    expect(formatAuditAction(auditLog('   '))).toBe('Sin acción registrada');
  });
});


it('translates inventory events and profile changes using the original event values', () => {
  const original = auditLog('BATCH_INBOUND_HARDWARE', { parentCount: 3 });
  const before = JSON.stringify(original);
  expect(formatAuditAction(original)).toBe('Ingreso de equipos por lote · 3 equipos o piezas');
  expect(JSON.stringify(original)).toBe(before);
  expect(formatAuditAction(auditLog('INBOUND_QUANTITY_STOCK', { inboundQuantity: 5, totalResultingQuantity: 0 }))).toBe('Ingreso de unidades al inventario · 5 unidades · Saldo: 0');
  expect(formatAuditAction(auditLog('ADJUST_QUANTITY_STOCK', { newQuantity: 0 }))).toBe('Corrección de cantidades del inventario · Nuevo total: 0');
  expect(formatAuditAction(auditLog('UPDATE_PROFILE', { changes: { email: 'new@mp.pe', passwordUpdated: true } }))).toBe('Correo de perfil actualizado · Contraseña actualizada');
});

it('describes product and category status from explicit changes only', () => {
  expect(formatAuditAction(auditLog('UPDATE_CATALOG_ITEM', { changes: { active: true } }))).toBe('Estado de producto: activo');
  expect(formatAuditAction(auditLog('UPDATE_CATEGORY', { changes: { active: false } }))).toBe('Estado de categoría: inactiva');
  expect(formatAuditAction(auditLog('INBOUND_QUANTITY_STOCK', { inboundQuantity: '5', totalResultingQuantity: null }))).toBe('Ingreso de unidades al inventario');
  expect(formatAuditAction(auditLog('BATCH_INBOUND_HARDWARE', { parentCount: -1 }))).toBe('Ingreso de equipos por lote');
});

it('covers the remaining hardware and catalogue events already emitted by the backend', () => {
  const expected = {
    CREATE_CATALOG_ITEM: 'Producto registrado', UPDATE_CATALOG_ITEM: 'Producto actualizado',
    CREATE_PASS_THROUGH_CATALOG_MODEL: 'Modelo de producto por pase registrado',
    CREATE_HARDWARE_ITEM: 'Equipo o pieza registrado', UPDATE_HARDWARE_ITEM: 'Equipo o pieza actualizado',
    ATTACH_HARDWARE_CHILD: 'Componentes vinculados al equipo', DETACH_HARDWARE_CHILD: 'Componente separado del equipo',
    DECOMMISSION_HARDWARE_ITEM: 'Equipo o pieza dado de baja', APPROVE_USED_COMPONENT: 'Componente usado aprobado',
    PRINT_BARCODE_LABEL: 'Solicitud de etiqueta de equipo o pieza', PRINT_BARCODE_LABELS_BATCH: 'Solicitud de etiquetas por lote',
    DECREASE_QUANTITY_STOCK: 'Salida de unidades del inventario',
  };
  for (const [action, label] of Object.entries(expected)) expect(formatAuditAction(auditLog(action))).toBe(label);
});
