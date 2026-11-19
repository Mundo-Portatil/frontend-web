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
  CREATE_USER: 'Creó usuario',
  UPDATE_USER: 'Usuario actualizado',
  CREATE_LOCATION: 'Creó ubicación',
  UPDATE_LOCATION: 'Ubicación actualizada',
  CREATE_CATEGORY: 'Categoría creada',
  UPDATE_CATEGORY: 'Categoría actualizada',
};

/** Accepts `UPDATE_CATEGORY`, `update category` or `update-category`. */
function normalizeActionKey(action: string): string {
  return action.trim().replace(/[\s-]+/g, '_').toUpperCase();
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

/**
 * Returns the Spanish description for an audit event. Unknown actions keep
 * their original API value and are explicitly flagged as untranslated instead
 * of guessing their meaning.
 */
export function formatAuditAction(item: AuditLog): string {
  const actionKey = normalizeActionKey(item.action);

  if (actionKey === 'UPDATE_USER') {
    const descriptions = describeUserChanges(item.payload);
    return descriptions.length > 0
      ? descriptions.join(' · ')
      : ACTION_LABELS.UPDATE_USER;
  }

  if (actionKey === 'UPDATE_LOCATION') {
    const descriptions = describeLocationChanges(item.payload);
    return descriptions.length > 0
      ? descriptions.join(' · ')
      : ACTION_LABELS.UPDATE_LOCATION;
  }

  return ACTION_LABELS[actionKey] ?? `Acción no traducida: ${item.action}`;
}
