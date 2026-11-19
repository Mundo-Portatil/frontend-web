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

  it('flags unknown actions without inventing a translation', () => {
    expect(formatAuditAction(auditLog('export report'))).toBe('Acción no traducida: export report');
  });
});
