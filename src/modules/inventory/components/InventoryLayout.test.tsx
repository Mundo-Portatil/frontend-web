import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { InventoryLayout } from './InventoryLayout';

function renderAt(path = '/inventory/stock') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/inventory" element={<InventoryLayout />}>
          <Route path="stock" element={<p>Vista Stock</p>} />
          <Route path="labels" element={<p>Vista Etiquetas</p>} />
          <Route path="inbound" element={<p>Vista Ingreso</p>} />
          <Route path="catalog" element={<p>Vista Catálogo</p>} />
          <Route path="categories" element={<p>Vista Categorías</p>} />
          <Route path="second-hand" element={<p>Vista Segunda Mano</p>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe('InventoryLayout', () => {
  it('renders child routes through Outlet without horizontal tabs header', () => {
    renderAt('/inventory/stock');
    expect(screen.getByText('Vista Stock')).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'Pestañas de Inventario' })).not.toBeInTheDocument();
  });

  it('renders nested sub-route correctly', () => {
    renderAt('/inventory/categories');
    expect(screen.getByText('Vista Categorías')).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'Pestañas de Inventario' })).not.toBeInTheDocument();
  });
});
