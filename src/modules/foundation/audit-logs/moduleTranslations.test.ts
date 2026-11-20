import { describe, expect, it } from 'vitest';
import { formatAuditModule, resolveModuleFilter } from './moduleTranslations';

describe('formatAuditModule', () => {
  it('translates known module identifiers to Spanish', () => {
    expect(formatAuditModule('auth')).toBe('Autenticación');
    expect(formatAuditModule('users')).toBe('Usuarios');
    expect(formatAuditModule('locations')).toBe('Ubicaciones');
    expect(formatAuditModule('categories')).toBe('Categorías');
    expect(formatAuditModule('catalog')).toBe('Productos y modelos');
    expect(formatAuditModule('hardware-items')).toBe('Equipos y piezas');
    expect(formatAuditModule('quantity-stock')).toBe('Inventario por cantidad');
  });

  it('accepts identifiers with different casing', () => {
    expect(formatAuditModule('Categories')).toBe('Categorías');
    expect(formatAuditModule(' USERS ')).toBe('Usuarios');
  });

  it('humanizes unfamiliar module identifiers without guessing their meaning', () => {
    expect(formatAuditModule('reports')).toBe('Reports');
    expect(formatAuditModule('external_stock_updates')).toBe('External stock updates');
    expect(formatAuditModule('legacyModule')).toBe('Legacy module');
    expect(formatAuditModule('constructor')).toBe('Constructor');
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
    expect(resolveModuleFilter('Equipos y piezas')).toBe('hardware-items');
    expect(resolveModuleFilter('Inventario por cantidad')).toBe('quantity-stock');
    expect(resolveModuleFilter('Productos y modelos')).toBe('catalog');
    expect(resolveModuleFilter(' Custom_Module ')).toBe('Custom_Module');
  });

  it('returns an empty filter for blank input', () => {
    expect(resolveModuleFilter('   ')).toBe('');
  });
});
