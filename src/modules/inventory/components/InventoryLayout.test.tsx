import { render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import userEvent from '@testing-library/user-event';
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

  it('shows two main areas and only the stock subsections by default', () => {
    renderAt();
    const areas = screen.getByRole('navigation', { name: 'Áreas de inventario' });
    expect(within(areas).getAllByRole('link')).toHaveLength(2);
    expect(within(areas).getByRole('link', { name: 'Existencias' })).toHaveAttribute('aria-current', 'location');
    const nav = screen.getByRole('navigation', { name: 'Secciones de inventario' });
    expect(within(nav).getAllByRole('link')).toHaveLength(2);
    expect(within(nav).getByRole('link', { name: 'Por serie o código' })).toHaveAttribute('href', '/inventory');
    expect(within(nav).getByRole('link', { name: 'Por cantidad' })).toHaveAttribute('href', '/inventory/stock');
    expect(within(nav).queryByRole('link', { name: 'Categorías' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ingresar equipos y piezas' })).toHaveAttribute('href', '/inventory/inbound');
  });

  it('switches between the two areas without showing unrelated subsections', async () => {
    const user = userEvent.setup();
    renderAt();
    await user.click(screen.getByRole('link', { name: 'Productos' }));
    expect(screen.getByRole('link', { name: 'Productos' })).toHaveAttribute('aria-current', 'location');
    expect(screen.getByRole('link', { name: 'Productos y modelos' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Categorías' })).toHaveAttribute('href', '/inventory/categories');
    expect(screen.queryByRole('link', { name: 'Por cantidad' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Ingresar equipos y piezas' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: 'Categorías' }));
    expect(screen.getByRole('link', { name: 'Categorías' })).toHaveAttribute('aria-current', 'page');
    await user.click(screen.getByRole('link', { name: 'Existencias' }));
    expect(screen.getByRole('link', { name: 'Por serie o código' })).toHaveAttribute('aria-current', 'page');
    expect(screen.queryByRole('link', { name: 'Categorías' })).not.toBeInTheDocument();
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
    ['/inventory/categories/', 'Categorías'],
    ['/inventory/inbound', 'Ingresar equipos y piezas'],
  ])('marks only the current section at %s', (path, label) => {
    renderAt(path);
    expect(screen.getByRole('link', { name: label })).toHaveAttribute('aria-current', 'page');
    expect(screen.getAllByRole('link').filter((link) => link.getAttribute('aria-current') === 'page')).toHaveLength(1);
  });
});
