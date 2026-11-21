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
  it.each<Role>(['ADMIN', 'VENDEDOR', 'TECNICO'])('offers both inventory destinations to %s without exposing admin links', async (role) => {
    const user = userEvent.setup();
    renderNavigation('/locations', { role });
    const trigger = screen.getByRole('button', { name: 'Inventario' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(document.getElementById(trigger.getAttribute('aria-controls')!)).toBeVisible();
    expect(screen.getByRole('link', { name: 'Consultar inventario' })).toHaveAttribute('href', '/inventory');
    expect(screen.getByRole('link', { name: 'Productos y categorías' })).toHaveAttribute('href', '/inventory/catalog');
    expect(screen.getByRole('link', { name: 'Etiquetas' })).toHaveAttribute('href', '/inventory/labels');
    expect(screen.queryByRole('link', { name: 'Ingreso de mercancía' }) !== null).toBe(role === 'ADMIN');
    expect(screen.getByRole('link', { name: 'Ubicaciones' })).toBeInTheDocument();
    if (role === 'ADMIN') expect(screen.getByRole('link', { name: 'Usuarios' })).toBeInTheDocument();
    else expect(screen.queryByRole('link', { name: 'Usuarios' })).not.toBeInTheDocument();
  });

  it.each([
    ['/inventory', 'Consultar inventario'],
    ['/inventory/stock', 'Consultar inventario'],
    ['/inventory/inbound/', 'Ingreso de mercancía'],
    ['/inventory/components', 'Consultar inventario'],
    ['/inventory/adjustments', 'Ingreso de mercancía'],
    ['/inventory/labels', 'Etiquetas'],
    ['/inventory/catalog', 'Productos y categorías'],
    ['/inventory/categories/', 'Productos y categorías'],
  ])('opens the branch and marks only %s section on a direct visit', (path, section) => {
    renderNavigation(path);
    expect(screen.getByRole('button', { name: 'Inventario' })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('link', { name: section })).toHaveAttribute('aria-current', 'page');
    const other = section === 'Consultar inventario' ? 'Productos y categorías' : 'Consultar inventario';
    expect(screen.getByRole('link', { name: other })).not.toHaveAttribute('aria-current');
  });

  it('keeps the mobile drawer open when expanding and notifies only on navigation', async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    renderNavigation('/locations', { onNavigate });
    await user.click(screen.getByRole('button', { name: 'Inventario' }));
    expect(onNavigate).not.toHaveBeenCalled();
    await user.click(screen.getByRole('link', { name: 'Productos y categorías' }));
    expect(onNavigate).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('link', { name: 'Productos y categorías' })).toHaveAttribute('aria-current', 'page');
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
    expect(screen.queryByRole('link', { name: 'Productos y categorías' })).not.toBeInTheDocument();
  });

  it('supports keyboard disclosure and Escape in the collapsed sidebar', async () => {
    const user = userEvent.setup();
    renderNavigation('/locations', { collapsed: true });
    const trigger = screen.getByRole('button', { name: 'Inventario' });
    trigger.focus();
    await user.keyboard('{Enter}');
    const child = screen.getByRole('link', { name: 'Consultar inventario' });
    expect(child.closest('ul')).toHaveClass('absolute', 'left-full', 'w-48');
    await user.tab();
    expect(child).toHaveFocus();
    await user.keyboard('{Escape}');
    expect(trigger).toHaveFocus();
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('link', { name: 'Consultar inventario' })).not.toBeInTheDocument();
    await user.keyboard(' ');
    expect(screen.getByRole('link', { name: 'Productos y categorías' })).toBeVisible();
    await user.click(screen.getByRole('link', { name: 'Productos y categorías' }));
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trigger).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(screen.getByRole('link', { name: 'Productos y categorías' })).toHaveAttribute('aria-current', 'page');
  });
});
