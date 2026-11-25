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
    expect(formatAuditAction(auditLog('CREATE_USER'))).toBe('Creó un usuario');
    expect(formatAuditAction(auditLog('CREATE_LOCATION'))).toBe('Creó una ubicación');
    expect(formatAuditAction(auditLog('CREATE_CATEGORY'))).toBe('Creó una categoría');
    expect(formatAuditAction(auditLog('UPDATE_CATEGORY'))).toBe('Modificó una categoría');
  });

  it('accepts category actions written with spaces or lowercase', () => {
    expect(formatAuditAction(auditLog('update category'))).toBe('Modificó una categoría');
    expect(formatAuditAction(auditLog('create category'))).toBe('Creó una categoría');
    expect(formatAuditAction(auditLog('Update-Category'))).toBe('Modificó una categoría');
  });

  it('keeps the specific user update descriptions from the payload', () => {
    expect(formatAuditAction(auditLog('UPDATE_USER', { changes: { active: false } }))).toBe(
      'Desactivó un usuario',
    );
    expect(formatAuditAction(auditLog('UPDATE_USER', { changes: { active: true } }))).toBe(
      'Reactivó un usuario',
    );
    expect(formatAuditAction(auditLog('UPDATE_USER', { changes: { role: 'ADMIN' } }))).toBe(
      'Modificó el rol de un usuario',
    );
    expect(formatAuditAction(auditLog('UPDATE_USER', { changes: { name: 'Nuevo nombre' } }))).toBe(
      'Modificó el nombre de un usuario',
    );
    expect(
      formatAuditAction(auditLog('UPDATE_USER', { changes: { passwordUpdated: true } })),
    ).toBe('Modificó la contraseña de un usuario');
  });

  it('falls back to the generic description when the update payload has no changes', () => {
    expect(formatAuditAction(auditLog('UPDATE_USER'))).toBe('Modificó un usuario');
    expect(formatAuditAction(auditLog('UPDATE_LOCATION'))).toBe('Modificó una ubicación');
  });

  it('uses a neutral Spanish description for unknown actions without changing them', () => {
    expect(formatAuditAction(auditLog('export report'))).toBe('Registró una actividad');
    expect(formatAuditAction(auditLog('IMPORT_PAYMENTS'))).toBe('Registró una actividad');
    expect(formatAuditAction(auditLog('syncExternalRecords'))).toBe('Registró una actividad');
    expect(formatAuditAction(auditLog('   '))).toBe('Sin acción registrada');
  });
});


it('translates inventory events and profile changes using the original event values', () => {
  const original = auditLog('BATCH_INBOUND_HARDWARE', { parentCount: 3 });
  const before = JSON.stringify(original);
  expect(formatAuditAction(original)).toBe('Registró un ingreso de equipos por número de serie · 3 equipos o piezas');
  expect(JSON.stringify(original)).toBe(before);
  expect(formatAuditAction(auditLog('INBOUND_QUANTITY_STOCK', { inboundQuantity: 5, totalResultingQuantity: 0 }))).toBe('Registró un ingreso de mercancía por cantidad · 5 unidades · Saldo: 0');
  expect(formatAuditAction(auditLog('ADJUST_QUANTITY_STOCK', { newQuantity: 0 }))).toBe('Corrigió las cantidades del inventario · Nuevo total: 0');
  expect(formatAuditAction(auditLog('UPDATE_PROFILE', { changes: { email: 'new@mp.pe', passwordUpdated: true } }))).toBe('Correo de perfil actualizado · Contraseña actualizada');
});

it('describes product and category status from explicit changes only', () => {
  expect(formatAuditAction(auditLog('UPDATE_CATALOG_ITEM', { changes: { active: true } }))).toBe('Estado de producto: activo');
  expect(formatAuditAction(auditLog('UPDATE_CATEGORY', { changes: { active: false } }))).toBe('Estado de categoría: inactiva');
  expect(formatAuditAction(auditLog('INBOUND_QUANTITY_STOCK', { inboundQuantity: '5', totalResultingQuantity: null }))).toBe('Registró un ingreso de mercancía por cantidad');
  expect(formatAuditAction(auditLog('BATCH_INBOUND_HARDWARE', { parentCount: -1 }))).toBe('Registró un ingreso de equipos por número de serie');
});

it('covers the remaining hardware and catalogue events already emitted by the backend', () => {
  const expected = {
    CREATE_CATALOG_ITEM: 'Registró un modelo de producto', UPDATE_CATALOG_ITEM: 'Modificó un modelo de producto',
    CREATE_PASS_THROUGH_CATALOG_MODEL: 'Registró un modelo para una venta por encargo',
    CREATE_HARDWARE_ITEM: 'Registró un equipo o componente', UPDATE_HARDWARE_ITEM: 'Modificó un equipo o componente',
    ATTACH_HARDWARE_CHILD: 'Vinculó componentes a un equipo', DETACH_HARDWARE_CHILD: 'Separó un componente de un equipo',
    DECOMMISSION_HARDWARE_ITEM: 'Dio de baja un equipo o componente', APPROVE_USED_COMPONENT: 'Aprobó un componente de segunda mano',
    PRINT_BARCODE_LABEL: 'Solicitó una etiqueta de equipo o componente', PRINT_BARCODE_LABELS_BATCH: 'Solicitó etiquetas para varias unidades',
    DECREASE_QUANTITY_STOCK: 'Registró una salida de mercancía',
  };
  for (const [action, label] of Object.entries(expected)) expect(formatAuditAction(auditLog(action))).toBe(label);
});


it('describes current inventory receipts and model labels without exposing technical identifiers', () => {
  const receipt = auditLog('UNIFIED_INVENTORY_INBOUND', { totalUnits: 5 });
  const before = JSON.stringify(receipt);
  expect(formatAuditAction(receipt)).toBe('Registró un ingreso de mercancía al Almacén Central · 5 unidades');
  expect(JSON.stringify(receipt)).toBe(before);
  expect(formatAuditAction(auditLog('PRINT_MODEL_BARCODE_LABELS', { copies: 10 }))).toBe('Solicitó etiquetas de un modelo de producto · 10 copias');
  expect(formatAuditAction(auditLog('DEACTIVATE_USER'))).toBe('Desactivó un usuario');
  expect(formatAuditAction(auditLog('REACTIVATE_USER'))).toBe('Reactivó un usuario');
});
