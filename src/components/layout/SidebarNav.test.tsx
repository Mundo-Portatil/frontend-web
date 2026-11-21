import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Role } from '../../modules/foundation/auth/models';
import { useAuthStore } from '../../stores/authStore';
import { SidebarNav } from './SidebarNav';

function renderNavigation(path = '/locations', options: { role?: Role; collapsed?: boolean; onNavigate?: () => void } = {}) {
  useAuthStore.setState({
    status: 'authenticated',
    user: { id: 'test-user', email: 'test@example.com', name: 'Test', active: true, role: options.role ?? 'ADMIN' },
  });
  return render(
    <MemoryRouter initialEntries={[path]}>
      <SidebarNav ariaLabel="Principal" collapsed={options.collapsed} onNavigate={options.onNavigate} />
    </MemoryRouter>,
  );
}

afterEach(() => useAuthStore.setState({ status: 'unauthenticated', user: null }));

describe('SidebarNav inventory sections', () => {
  it.each<Role>(['ADMIN', 'ENCARGADO_ALMACEN', 'VENDEDOR', 'TECNICO'])('configures inventory navigation for %s', async (role) => {
    const user = userEvent.setup();
    renderNavigation('/locations', { role });
    const trigger = screen.getByRole('button', { name: 'Inventario' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(document.getElementById(trigger.getAttribute('aria-controls')!)).toBeVisible();
    expect(screen.getByRole('link', { name: 'Stock e Inventario' })).toHaveAttribute('href', '/inventory/stock');
    expect(screen.getByRole('link', { name: 'Etiquetas 1D' })).toHaveAttribute('href', '/inventory/labels');
    if (role === 'ADMIN' || role === 'ENCARGADO_ALMACEN') {
      expect(screen.getByRole('link', { name: 'Ingreso de mercadería' })).toHaveAttribute('href', '/inventory/inbound');
      expect(screen.getByRole('link', { name: 'Catálogo de productos' })).toHaveAttribute('href', '/inventory/catalog');
      expect(screen.getByRole('link', { name: 'Categorías' })).toHaveAttribute('href', '/inventory/categories');
      expect(screen.getByRole('link', { name: 'Segunda mano' })).toHaveAttribute('href', '/inventory/second-hand');
    } else {
      expect(screen.queryByRole('link', { name: 'Ingreso de mercadería' })).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: 'Catálogo de productos' })).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: 'Categorías' })).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: 'Segunda mano' })).not.toBeInTheDocument();
    }
    expect(screen.getByRole('link', { name: 'Ubicaciones' })).toBeInTheDocument();
    if (role === 'ADMIN') expect(screen.getByRole('link', { name: 'Usuarios' })).toBeInTheDocument();
    else expect(screen.queryByRole('link', { name: 'Usuarios' })).not.toBeInTheDocument();
  });

  it.each([
    ['/inventory/stock', 'Stock e Inventario'],
    ['/inventory', 'Stock e Inventario'],
    ['/inventory/inbound', 'Ingreso de mercadería'],
    ['/inventory/catalog', 'Catálogo de productos'],
    ['/inventory/categories', 'Categorías'],
    ['/inventory/labels', 'Etiquetas 1D'],
    ['/inventory/second-hand', 'Segunda mano'],
  ])('opens the branch and marks only %s section on a direct visit', (path, section) => {
    renderNavigation(path);
    expect(screen.getByRole('button', { name: 'Inventario' })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('link', { name: section })).toHaveAttribute('aria-current', 'page');
    const other = section === 'Stock e Inventario' ? 'Catálogo de productos' : 'Stock e Inventario';
    expect(screen.getByRole('link', { name: other })).not.toHaveAttribute('aria-current');
  });

  it('keeps the mobile drawer open when expanding and notifies only on navigation', async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    renderNavigation('/locations', { onNavigate });
    await user.click(screen.getByRole('button', { name: 'Inventario' }));
    expect(onNavigate).not.toHaveBeenCalled();
    await user.click(screen.getByRole('link', { name: 'Catálogo de productos' }));
    expect(onNavigate).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('link', { name: 'Catálogo de productos' })).toHaveAttribute('aria-current', 'page');
    await user.click(screen.getByRole('link', { name: 'Ubicaciones' }));
    expect(onNavigate).toHaveBeenCalledTimes(2);
  });

  it('keeps an active branch closed when the sidebar becomes collapsed', () => {
    const { rerender } = renderNavigation('/inventory/catalog');
    expect(screen.getByRole('button', { name: 'Inventario' })).toHaveAttribute('aria-expanded', 'true');
    rerender(
      <MemoryRouter initialEntries={['/inventory/catalog']}>
        <SidebarNav ariaLabel="Principal" collapsed />
      </MemoryRouter>,
    );
    expect(screen.getByRole('button', { name: 'Inventario' })).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('link', { name: 'Catálogo de productos' })).not.toBeInTheDocument();
  });

  it('supports keyboard disclosure and Escape in the collapsed sidebar', async () => {
    const user = userEvent.setup();
    renderNavigation('/locations', { collapsed: true });
    const trigger = screen.getByRole('button', { name: 'Inventario' });
    trigger.focus();
    await user.keyboard('{Enter}');
    const child = screen.getByRole('link', { name: 'Stock e Inventario' });
    expect(child.closest('ul')).toHaveClass('absolute', 'left-full', 'w-48');
    await user.tab();
    expect(child).toHaveFocus();
    await user.keyboard('{Escape}');
    expect(trigger).toHaveFocus();
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('link', { name: 'Stock e Inventario' })).not.toBeInTheDocument();
    await user.keyboard(' ');
    expect(screen.getByRole('link', { name: 'Catálogo de productos' })).toBeVisible();
    await user.click(screen.getByRole('link', { name: 'Catálogo de productos' }));
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trigger).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(screen.getByRole('link', { name: 'Catálogo de productos' })).toHaveAttribute('aria-current', 'page');
  });
});
