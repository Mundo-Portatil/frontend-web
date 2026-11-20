import { render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import { useAuthStore } from '../../../stores/authStore';
import { InventoryLayout } from './InventoryLayout';

const user = { id: 'self', name: 'Ana', email: 'ana@mp.pe', role: 'ADMIN' as const, active: true };
function renderAt(path = '/inventory') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/inventory" element={<InventoryLayout />}>
          <Route index element={<p>Consulta por serie</p>} />
          <Route path="*" element={<p>Contenido de la sección</p>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe('InventoryLayout', () => {
  beforeEach(() => useAuthStore.setState({ status: 'authenticated', user }));

  it('groups the four links by purpose and keeps the entry action separate', () => {
    renderAt();
    const nav = screen.getByRole('navigation', { name: 'Secciones de inventario' });
    const queries = within(nav).getByRole('group', { name: 'Consultar existencias' });
    const products = within(nav).getByRole('group', { name: 'Organizar productos' });
    expect(within(queries).getByRole('link', { name: 'Por serie o código' })).toHaveAttribute('href', '/inventory');
    expect(within(queries).getByRole('link', { name: 'Por cantidad' })).toHaveAttribute('href', '/inventory/stock');
    expect(within(products).getByRole('link', { name: 'Productos y modelos' })).toHaveAttribute('href', '/inventory/catalog');
    expect(within(products).getByRole('link', { name: 'Categorías' })).toHaveAttribute('href', '/inventory/categories');
    expect(within(nav).getAllByRole('link')).toHaveLength(4);
    expect(screen.getByRole('link', { name: 'Ingresar equipos y piezas' })).toHaveAttribute('href', '/inventory/inbound');
  });

  it.each(['VENDEDOR', 'TECNICO'] as const)('keeps queries available and hides intake for %s', (role) => {
    useAuthStore.setState({ user: { ...user, role } });
    renderAt();
    expect(screen.getAllByRole('link')).toHaveLength(4);
    expect(screen.queryByRole('link', { name: 'Ingresar equipos y piezas' })).not.toBeInTheDocument();
  });

  it.each([
    ['/inventory', 'Por serie o código'],
    ['/inventory/stock', 'Por cantidad'],
    ['/inventory/catalog', 'Productos y modelos'],
    ['/inventory/categories', 'Categorías'],
    ['/inventory/inbound', 'Ingresar equipos y piezas'],
  ])('marks only the current section at %s', (path, label) => {
    renderAt(path);
    expect(screen.getByRole('link', { name: label })).toHaveAttribute('aria-current', 'page');
    expect(screen.getAllByRole('link').filter((link) => link.getAttribute('aria-current') === 'page')).toHaveLength(1);
  });
});
