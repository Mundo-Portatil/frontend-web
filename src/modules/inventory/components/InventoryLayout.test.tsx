import { render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import { useAuthStore } from '../../../stores/authStore';
import { InventoryLayout } from './InventoryLayout';

const user = { id: 'self', name: 'Ana', email: 'ana@mp.pe', role: 'ADMIN' as const, active: true };
function renderAt(path = '/inventory') {
  return render(<MemoryRouter initialEntries={[path]}><Routes><Route path="/inventory" element={<InventoryLayout />}><Route index element={<p>Contenido</p>} /><Route path="*" element={<p>Contenido</p>} /></Route></Routes></MemoryRouter>);
}

describe('InventoryLayout', () => {
  beforeEach(() => useAuthStore.setState({ status: 'authenticated', user }));

  it.each(['ADMIN', 'VENDEDOR', 'TECNICO'] as const)('keeps consultation free of entry actions for %s', (role) => {
    useAuthStore.setState({ user: { ...user, role } });
    renderAt();
    expect(screen.getByRole('heading', { name: 'Productos y existencias' })).toBeInTheDocument();
    const nav = screen.getByRole('navigation', { name: 'Secciones de inventario' });
    expect(within(nav).getAllByRole('link')).toHaveLength(3);
    expect(within(nav).getByRole('link', { name: 'Productos' })).toHaveAttribute('href', '/inventory/catalog');
    expect(within(nav).getByRole('link', { name: 'Existencias por ubicación' })).toHaveAttribute('href', '/inventory/stock');
    expect(screen.queryByRole('link', { name: 'Ingresar mercancía' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Agregar cantidades' })).not.toBeInTheDocument();
  });

  it('keeps the administrative intake tools together', () => {
    renderAt('/inventory/inbound');
    expect(screen.getByRole('heading', { name: 'Ingreso de mercancía' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ingresar mercancía' })).toHaveAttribute('aria-current', 'page');
    expect(screen.queryByRole('link', { name: 'Gestionar componentes' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Corregir existencias' })).toHaveAttribute('href', '/inventory/adjustments');
  });

  it('does not expose management links to non-admin roles even on a direct layout render', () => {
    useAuthStore.setState({ user: { ...user, role: 'VENDEDOR' } });
    renderAt('/inventory/inbound');
    expect(screen.queryByRole('link', { name: 'Ingresar mercancía' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Gestionar componentes' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Corregir existencias' })).not.toBeInTheDocument();
  });

  it('shows labels as its own area without unrelated tabs', () => {
    renderAt('/inventory/labels');
    expect(screen.getByRole('heading', { name: 'Etiquetas' })).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'Secciones de inventario' })).not.toBeInTheDocument();
  });

  it.each([
    ['/inventory/stock', 'Existencias por ubicación'],
    ['/inventory/catalog', 'Productos'],
    ['/inventory/categories/', 'Categorías'],
    ['/inventory/inbound', 'Ingresar mercancía'],
    ['/inventory/adjustments', 'Corregir existencias'],
  ])('marks only the current section at %s', (path, label) => {
    renderAt(path);
    expect(screen.getByRole('link', { name: label })).toHaveAttribute('aria-current', 'page');
    expect(screen.getAllByRole('link').filter((link) => link.getAttribute('aria-current') === 'page')).toHaveLength(1);
  });
});
