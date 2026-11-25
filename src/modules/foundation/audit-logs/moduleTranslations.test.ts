import { describe, expect, it } from 'vitest';
import { formatAuditModule, resolveModuleFilter } from './moduleTranslations';

describe('formatAuditModule', () => {
  it('translates known module identifiers to Spanish', () => {
    expect(formatAuditModule('auth')).toBe('Autenticación');
    expect(formatAuditModule('users')).toBe('Usuarios');
    expect(formatAuditModule('locations')).toBe('Ubicaciones');
    expect(formatAuditModule('categories')).toBe('Categorías');
    expect(formatAuditModule('catalog')).toBe('Catálogo de productos');
    expect(formatAuditModule('hardware-items')).toBe('Equipos y componentes');
    expect(formatAuditModule('quantity-stock')).toBe('Inventario por cantidad');
  });

  it('accepts identifiers with different casing', () => {
    expect(formatAuditModule('Categories')).toBe('Categorías');
    expect(formatAuditModule(' USERS ')).toBe('Usuarios');
  });

  it('uses a neutral Spanish label for unfamiliar modules without guessing their meaning', () => {
    expect(formatAuditModule('reports')).toBe('Otro módulo');
    expect(formatAuditModule('external_stock_updates')).toBe('Otro módulo');
    expect(formatAuditModule('legacyModule')).toBe('Otro módulo');
    expect(formatAuditModule('constructor')).toBe('Otro módulo');
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
    expect(resolveModuleFilter('Equipos y componentes')).toBe('hardware-items');
    expect(resolveModuleFilter('Inventario por cantidad')).toBe('quantity-stock');
    expect(resolveModuleFilter('Catálogo de productos')).toBe('catalog');
    expect(resolveModuleFilter(' Custom_Module ')).toBe('Custom_Module');
  });

  it('returns an empty filter for blank input', () => {
    expect(resolveModuleFilter('   ')).toBe('');
  });
});


it('translates inventory modules while preserving real filter identifiers and historical aliases', () => {
  expect(formatAuditModule('inventory')).toBe('Inventario');
  expect(formatAuditModule('product-catalog')).toBe('Catálogo de productos');
  expect(resolveModuleFilter('Inventario')).toBe('inventory');
  expect(resolveModuleFilter('Catálogo de productos')).toBe('catalog');
  expect(resolveModuleFilter('product-catalog')).toBe('product-catalog');
  expect(resolveModuleFilter('Equipos y componentes')).toBe('hardware-items');
  expect(resolveModuleFilter('Equipos y piezas')).toBe('hardware-items');
  expect(resolveModuleFilter('UNKNOWN_SERVICE')).toBe('UNKNOWN_SERVICE');
});
