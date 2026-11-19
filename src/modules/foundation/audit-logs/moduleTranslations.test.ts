import { describe, expect, it } from 'vitest';
import { formatAuditModule, resolveModuleFilter } from './moduleTranslations';

describe('formatAuditModule', () => {
  it('translates known module identifiers to Spanish', () => {
    expect(formatAuditModule('auth')).toBe('Autenticación');
    expect(formatAuditModule('users')).toBe('Usuarios');
    expect(formatAuditModule('locations')).toBe('Ubicaciones');
    expect(formatAuditModule('categories')).toBe('Categorías');
  });

  it('accepts identifiers with different casing', () => {
    expect(formatAuditModule('Categories')).toBe('Categorías');
    expect(formatAuditModule(' USERS ')).toBe('Usuarios');
  });

  it('keeps unknown module identifiers unchanged', () => {
    expect(formatAuditModule('reports')).toBe('reports');
  });
});

describe('resolveModuleFilter', () => {
  it('resolves visible labels and identifiers to the API value', () => {
    expect(resolveModuleFilter('Categorías')).toBe('categories');
    expect(resolveModuleFilter('categorias')).toBe('categories');
    expect(resolveModuleFilter('categories')).toBe('categories');
    expect(resolveModuleFilter('Usuarios')).toBe('users');
    expect(resolveModuleFilter('Autenticación')).toBe('auth');
    expect(resolveModuleFilter('Ubicaciones')).toBe('locations');
  });

  it('returns an empty filter for blank input', () => {
    expect(resolveModuleFilter('   ')).toBe('');
  });
});
