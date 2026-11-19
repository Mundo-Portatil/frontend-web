import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearAccessToken, saveAccessToken } from '../../config/authToken';
import { useAuthStore } from '../../stores/authStore';
import { useLocationStore } from '../../stores/locationStore';
import { AppLayout } from './AppLayout';
import * as locationService from '../../modules/foundation/locations/services/locationService';
import { getProfile } from '../../modules/foundation/auth/services/authService';

vi.mock('../../modules/foundation/locations/services/locationService', () => ({
  listActiveLocations: vi.fn(),
}));

vi.mock('../../modules/foundation/auth/services/authService', () => ({
  getProfile: vi.fn(),
}));

const ADMIN = {
  id: 'admin-1',
  email: 'admin@mundoportatil.pe',
  name: 'Administrador Principal de Operaciones',
  role: 'ADMIN' as const,
  active: true,
};

const VENDEDOR = {
  ...ADMIN,
  id: 'seller-1',
  email: 'vendedor@mundoportatil.pe',
  name: 'Vendedor de Tienda',
  role: 'VENDEDOR' as const,
};

const TECNICO = {
  ...ADMIN,
  id: 'technician-1',
  email: 'tecnico@mundoportatil.pe',
  name: 'Técnico de Servicio',
  role: 'TECNICO' as const,
};

function renderLayout() {
  return render(
    <MemoryRouter initialEntries={['/locations']}>
      <Routes>
        <Route
          path="/locations"
          element={
            <AppLayout>
              <h1>Contenido protegido</h1>
            </AppLayout>
          }
        />
        <Route path="/login" element={<p>Iniciar sesión</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

function getDesktopNav() {
  return screen.getByRole('navigation', { name: 'Navegación principal' });
}

describe('AppLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearAccessToken();
    act(() => useAuthStore.setState({ status: 'authenticated', user: ADMIN }));
    useLocationStore.getState().reset();
    vi.mocked(locationService.listActiveLocations).mockResolvedValue([]);
  });

  afterEach(() => {
    act(() => useAuthStore.setState({ status: 'unauthenticated', user: null }));
    clearAccessToken();
    vi.unstubAllGlobals();
  });

  it('shows the authenticated user, role and the protected content', async () => {
    renderLayout();

    expect(await screen.findByText('Contenido protegido')).toBeInTheDocument();
    expect(screen.getAllByText('Administrador Principal de Operaciones').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Administrador').length).toBeGreaterThan(0);
  });

  it('renders only the implemented modules in the administration group', async () => {
    renderLayout();
    await screen.findByText('Sin ubicaciones activas');
    const nav = getDesktopNav();

    expect(within(nav).getByText('Administración')).toBeInTheDocument();
    expect(within(nav).getByRole('link', { name: 'Ubicaciones' })).toBeInTheDocument();
    expect(within(nav).getByRole('link', { name: 'Usuarios' })).toBeInTheDocument();
    expect(within(nav).getByRole('link', { name: 'Bitácora' })).toBeInTheDocument();

    for (const futureLabel of [
      'Inicio',
      'Ventas',
      'POS',
      'Inventario',
      'Traslados',
      'Servicio técnico',
      'Caja',
      'Auditoría Express',
      'Aprobaciones',
      'Garantías',
    ]) {
      expect(within(nav).queryByRole('link', { name: futureLabel })).not.toBeInTheDocument();
    }
  });

  it('highlights the active route', async () => {
    renderLayout();
    await screen.findByText('Sin ubicaciones activas');
    const nav = getDesktopNav();

    expect(within(nav).getByRole('link', { name: 'Ubicaciones' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(within(nav).getByRole('link', { name: 'Usuarios' })).not.toHaveAttribute('aria-current');
  });

  it('filters the navigation for a VENDEDOR', async () => {
    act(() => useAuthStore.setState({ status: 'authenticated', user: VENDEDOR }));

    renderLayout();
    await screen.findByText('Sin ubicaciones activas');
    const nav = getDesktopNav();

    expect(within(nav).getByRole('link', { name: 'Ubicaciones' })).toBeInTheDocument();
    expect(within(nav).queryByRole('link', { name: 'Usuarios' })).not.toBeInTheDocument();
    expect(within(nav).queryByRole('link', { name: 'Bitácora' })).not.toBeInTheDocument();
  });

  it('filters the navigation for a TECNICO', async () => {
    act(() => useAuthStore.setState({ status: 'authenticated', user: TECNICO }));

    renderLayout();
    await screen.findByText('Sin ubicaciones activas');
    const nav = getDesktopNav();

    expect(within(nav).getByRole('link', { name: 'Ubicaciones' })).toBeInTheDocument();
    expect(within(nav).queryByRole('link', { name: 'Usuarios' })).not.toBeInTheDocument();
    expect(within(nav).queryByRole('link', { name: 'Bitácora' })).not.toBeInTheDocument();
  });

  it('updates the visible navigation when the authenticated role changes in-session', async () => {
    renderLayout();
    await screen.findByText('Sin ubicaciones activas');
    const nav = getDesktopNav();

    expect(within(nav).getByRole('link', { name: 'Usuarios' })).toBeInTheDocument();
    expect(within(nav).getByRole('link', { name: 'Bitácora' })).toBeInTheDocument();

    act(() => useAuthStore.setState({ status: 'authenticated', user: TECNICO }));

    await waitFor(() => {
      expect(within(nav).queryByRole('link', { name: 'Usuarios' })).not.toBeInTheDocument();
      expect(within(nav).queryByRole('link', { name: 'Bitácora' })).not.toBeInTheDocument();
    });
    expect(within(nav).getByRole('link', { name: 'Ubicaciones' })).toBeInTheDocument();

    act(() => useAuthStore.setState({ status: 'authenticated', user: VENDEDOR }));

    await waitFor(() => {
      expect(within(nav).queryByRole('link', { name: 'Usuarios' })).not.toBeInTheDocument();
      expect(within(nav).queryByRole('link', { name: 'Bitácora' })).not.toBeInTheDocument();
    });

    act(() => useAuthStore.setState({ status: 'authenticated', user: ADMIN }));

    await waitFor(() => {
      expect(within(nav).getByRole('link', { name: 'Usuarios' })).toBeInTheDocument();
      expect(within(nav).getByRole('link', { name: 'Bitácora' })).toBeInTheDocument();
    });
  });

  it('refreshes the profile and navigation when the window regains focus', async () => {
    saveAccessToken('active-jwt');
    vi.mocked(getProfile).mockResolvedValueOnce({
      ...TECNICO,
      active: true,
    });

    renderLayout();
    await screen.findByText('Sin ubicaciones activas');
    const nav = getDesktopNav();
    expect(within(nav).getByRole('link', { name: 'Bitácora' })).toBeInTheDocument();

    act(() => {
      window.dispatchEvent(new Event('focus'));
    });

    await waitFor(() => {
      expect(getProfile).toHaveBeenCalledTimes(1);
      expect(within(nav).queryByRole('link', { name: 'Bitácora' })).not.toBeInTheDocument();
      expect(within(nav).queryByRole('link', { name: 'Usuarios' })).not.toBeInTheDocument();
    });
  });

  it('collapses and expands the sidebar while keeping accessible names', async () => {
    renderLayout();
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'Contraer menú lateral' }));

    const expandButton = screen.getByRole('button', { name: 'Expandir menú lateral' });
    expect(expandButton).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByRole('complementary', { name: 'Menú lateral' })).toHaveClass('w-20');
    expect(within(getDesktopNav()).getByRole('link', { name: 'Ubicaciones' })).toBeInTheDocument();

    await user.click(expandButton);

    expect(screen.getByRole('button', { name: 'Contraer menú lateral' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    expect(screen.getByRole('complementary', { name: 'Menú lateral' })).toHaveClass('w-64');
  });

  it('opens and closes the mobile drawer with keyboard-accessible state', async () => {
    renderLayout();
    const user = userEvent.setup();
    const menuButton = await screen.findByRole('button', { name: 'Abrir menú' });

    await user.click(menuButton);

    const drawer = screen.getByRole('dialog', { name: 'Menú de navegación' });
    expect(menuButton).toHaveAttribute('aria-expanded', 'true');
    expect(within(drawer).getByRole('navigation', { name: 'Navegación móvil' })).toBeInTheDocument();
    expect(within(drawer).getByRole('button', { name: 'Cerrar sesión' })).toBeInTheDocument();
    expect(within(drawer).getByRole('button', { name: 'Cerrar menú' })).toHaveFocus();

    await user.keyboard('{Escape}');

    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: 'Menú de navegación' })).not.toBeInTheDocument();
      expect(menuButton).toHaveAttribute('aria-expanded', 'false');
      expect(menuButton).toHaveFocus();
    });
  });

  it('closes the mobile drawer after selecting a navigation option and focuses the content', async () => {
    renderLayout();
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Abrir menú' }));
    const drawer = screen.getByRole('dialog', { name: 'Menú de navegación' });
    await user.click(within(drawer).getByRole('link', { name: 'Ubicaciones' }));

    expect(screen.queryByRole('dialog', { name: 'Menú de navegación' })).not.toBeInTheDocument();
    expect(screen.getByRole('main')).toHaveFocus();
  });

  it('closes the mobile drawer from the backdrop', async () => {
    renderLayout();
    const user = userEvent.setup();
    const menuButton = await screen.findByRole('button', { name: 'Abrir menú' });

    await user.click(menuButton);
    await user.click(screen.getByTestId('mobile-menu-backdrop'));

    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: 'Menú de navegación' })).not.toBeInTheDocument();
      expect(menuButton).toHaveFocus();
    });
  });

  it('closes the mobile drawer when the desktop breakpoint is reached', async () => {
    const listeners: Array<(event: MediaQueryListEvent) => void> = [];
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => {
          listeners.push(listener);
        },
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    );

    renderLayout();
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'Abrir menú' }));

    expect(document.body.style.overflow).toBe('hidden');

    act(() => {
      for (const listener of listeners) {
        listener({ matches: true } as MediaQueryListEvent);
      }
    });

    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: 'Menú de navegación' })).not.toBeInTheDocument();
      expect(document.body.style.overflow).toBe('');
    });
  });

  it('logs the user out from the header and returns to the login route', async () => {
    renderLayout();
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'Cerrar sesión' }));

    expect(useAuthStore.getState().status).toBe('unauthenticated');
    expect(useAuthStore.getState().user).toBeNull();
    expect(await screen.findByText('Iniciar sesión')).toBeInTheDocument();
  });
});
