import { act, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as auditLogService from '../modules/foundation/audit-logs/services/auditLogService';
import * as locationService from '../modules/foundation/locations/services/locationService';
import * as userService from '../modules/foundation/users/services/userService';
import * as catalogService from '../modules/inventory/services/catalogService';
import * as categoryService from '../modules/inventory/services/categoryService';
import * as stockService from '../modules/inventory/services/quantityStockService';
import { useAuthStore } from '../stores/authStore';
import { AppRouter } from './index';

vi.mock('../modules/foundation/users/services/userService', () => ({
  listUsers: vi.fn(),
  createUser: vi.fn(),
  updateUser: vi.fn(),
  updateOwnProfile: vi.fn(),
}));

vi.mock('../modules/foundation/locations/services/locationService', () => ({
  listLocations: vi.fn(),
  listActiveLocations: vi.fn(),
  createLocation: vi.fn(),
  updateLocation: vi.fn(),
}));

vi.mock('../modules/foundation/audit-logs/services/auditLogService', () => ({
  listAuditLogs: vi.fn(),
}));

vi.mock('../modules/inventory/services/catalogService', () => ({
  listCatalog: vi.fn(),
  getCatalogDetail: vi.fn(),
}));
vi.mock('../modules/inventory/services/quantityStockService', () => ({
  listQuantityStock: vi.fn(),
  adjustQuantityStock: vi.fn(),
}));
vi.mock('../modules/inventory/services/categoryService', () => ({
  listCategories: vi.fn(),
}));

const ADMIN = {
  id: 'admin-1',
  email: 'admin@mundoportatil.pe',
  name: 'Administrador Principal',
  role: 'ADMIN' as const,
  active: true,
};

const ENCARGADO_ALMACEN = {
  ...ADMIN,
  id: 'almacen-1',
  email: 'almacen@mundoportatil.pe',
  name: 'Encargado de Almacén',
  role: 'ENCARGADO_ALMACEN' as const,
};

const VENDEDOR = {
  ...ADMIN,
  id: 'seller-1',
  email: 'vendedor@mundoportatil.pe',
  name: 'Vendedor',
  role: 'VENDEDOR' as const,
};

const TECNICO = {
  ...ADMIN,
  id: 'technician-1',
  email: 'tecnico@mundoportatil.pe',
  name: 'Técnico',
  role: 'TECNICO' as const,
};

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppRouter />
    </MemoryRouter>,
  );
}

describe('AppRouter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(categoryService.listCategories).mockResolvedValue([]);
    useAuthStore.setState({ status: 'unauthenticated', user: null });
    vi.mocked(userService.listUsers).mockResolvedValue([]);
    vi.mocked(locationService.listLocations).mockResolvedValue([]);
    vi.mocked(locationService.listActiveLocations).mockResolvedValue([]);
    vi.mocked(catalogService.listCatalog).mockResolvedValue({ items: [], total: 0, page: 1, limit: 50 });
    vi.mocked(stockService.listQuantityStock).mockResolvedValue({ items: [], total: 0, page: 1, limit: 50 });
    vi.mocked(auditLogService.listAuditLogs).mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      limit: 20,
    });
  });

  it('redirects unauthenticated users from protected routes to /login', async () => {
    renderAt('/users');
    expect(await screen.findByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument();
  });

  it.each([ADMIN, ENCARGADO_ALMACEN, VENDEDOR, TECNICO])(
    'allows $role to access /inventory/stock and renders header',
    async (user) => {
      useAuthStore.setState({ status: 'authenticated', user });
      renderAt('/inventory/stock');
      expect(await screen.findByRole('heading', { name: 'Stock e Inventario' })).toBeInTheDocument();
    },
  );

  it.each([ADMIN, ENCARGADO_ALMACEN, VENDEDOR, TECNICO])(
    'redirects $role from /inventory to /inventory/stock',
    async (user) => {
      useAuthStore.setState({ status: 'authenticated', user });
      renderAt('/inventory');
      expect(await screen.findByRole('heading', { name: 'Stock e Inventario' })).toBeInTheDocument();
    },
  );

  it.each([ADMIN, ENCARGADO_ALMACEN, VENDEDOR, TECNICO])(
    'allows $role to access /inventory/labels',
    async (user) => {
      useAuthStore.setState({ status: 'authenticated', user });
      renderAt('/inventory/labels');
      expect(
        await screen.findByRole('heading', { name: 'Centro de Etiquetas 1D (Códigos de Barras)' }),
      ).toBeInTheDocument();
    },
  );

  it.each([ADMIN, ENCARGADO_ALMACEN])(
    'allows $role to access /inventory/inbound',
    async (user) => {
      useAuthStore.setState({ status: 'authenticated', user });
      renderAt('/inventory/inbound');
      expect(
        await screen.findByRole('heading', { name: 'Ingreso de Mercadería al Almacén' }),
      ).toBeInTheDocument();
    },
  );

  it.each([VENDEDOR, TECNICO])(
    'redirects $role from /inventory/inbound to /inventory/stock',
    async (user) => {
      useAuthStore.setState({ status: 'authenticated', user });
      renderAt('/inventory/inbound');
      expect(await screen.findByRole('heading', { name: 'Stock e Inventario' })).toBeInTheDocument();
      expect(screen.queryByRole('heading', { name: 'Ingreso de Mercadería al Almacén' })).not.toBeInTheDocument();
    },
  );

  it.each([ADMIN, ENCARGADO_ALMACEN])(
    'allows $role to access /inventory/catalog',
    async (user) => {
      useAuthStore.setState({ status: 'authenticated', user });
      renderAt('/inventory/catalog');
      expect(
        await screen.findByRole('heading', { name: 'Catálogo de Productos' }),
      ).toBeInTheDocument();
    },
  );

  it.each([VENDEDOR, TECNICO])(
    'redirects $role from /inventory/catalog to /inventory/stock',
    async (user) => {
      useAuthStore.setState({ status: 'authenticated', user });
      renderAt('/inventory/catalog');
      expect(await screen.findByRole('heading', { name: 'Stock e Inventario' })).toBeInTheDocument();
      expect(screen.queryByRole('heading', { name: 'Catálogo de Productos' })).not.toBeInTheDocument();
    },
  );

  it.each([ADMIN, ENCARGADO_ALMACEN])(
    'allows $role to access /inventory/categories',
    async (user) => {
      useAuthStore.setState({ status: 'authenticated', user });
      renderAt('/inventory/categories');
      expect(
        await screen.findByRole('heading', { name: 'Categorías' }),
      ).toBeInTheDocument();
    },
  );

  it.each([VENDEDOR, TECNICO])(
    'redirects $role from /inventory/categories to /inventory/stock',
    async (user) => {
      useAuthStore.setState({ status: 'authenticated', user });
      renderAt('/inventory/categories');
      expect(await screen.findByRole('heading', { name: 'Stock e Inventario' })).toBeInTheDocument();
      expect(screen.queryByRole('heading', { name: 'Categorías' })).not.toBeInTheDocument();
    },
  );

  it.each([ADMIN, ENCARGADO_ALMACEN])(
    'allows $role to access /inventory/second-hand',
    async (user) => {
      useAuthStore.setState({ status: 'authenticated', user });
      renderAt('/inventory/second-hand');
      expect(
        await screen.findByRole('heading', { name: 'Piezas y Equipos de Segunda Mano Pendientes' }),
      ).toBeInTheDocument();
    },
  );

  it.each([VENDEDOR, TECNICO])(
    'redirects $role from /inventory/second-hand to /inventory/stock',
    async (user) => {
      useAuthStore.setState({ status: 'authenticated', user });
      renderAt('/inventory/second-hand');
      expect(await screen.findByRole('heading', { name: 'Stock e Inventario' })).toBeInTheDocument();
      expect(
        screen.queryByRole('heading', { name: 'Piezas y Equipos de Segunda Mano Pendientes' }),
      ).not.toBeInTheDocument();
    },
  );

  it('redirects legacy /inventory/consult to /inventory/stock', async () => {
    useAuthStore.setState({ status: 'authenticated', user: ADMIN });
    renderAt('/inventory/consult');
    expect(await screen.findByRole('heading', { name: 'Stock e Inventario' })).toBeInTheDocument();
  });

  it.each([ADMIN, ENCARGADO_ALMACEN, VENDEDOR, TECNICO])('allows $role to access their own profile', async (user) => {
    useAuthStore.setState({ status: 'authenticated', user });
    renderAt('/profile');
    expect(await screen.findByRole('heading', { name: 'Mi perfil' })).toBeInTheDocument();
    expect(screen.getByLabelText('Correo electrónico')).toHaveValue(user.email);
  });

  it('protects the personal profile when no session exists', async () => {
    renderAt('/profile');
    expect(await screen.findByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument();
  });

  it('allows an authenticated ADMIN to access /users', async () => {
    useAuthStore.setState({ status: 'authenticated', user: ADMIN });
    renderAt('/users');
    expect(await screen.findByRole('heading', { name: 'Usuarios' })).toBeInTheDocument();
  });

  it('redirects an authenticated VENDEDOR from /users to /unauthorized', async () => {
    useAuthStore.setState({ status: 'authenticated', user: VENDEDOR });
    renderAt('/users');
    expect(await screen.findByRole('heading', { name: 'Acceso denegado' })).toBeInTheDocument();
  });

  it('redirects an authenticated ENCARGADO_ALMACEN from /users to /unauthorized', async () => {
    useAuthStore.setState({ status: 'authenticated', user: ENCARGADO_ALMACEN });
    renderAt('/users');
    expect(await screen.findByRole('heading', { name: 'Acceso denegado' })).toBeInTheDocument();
  });

  it('allows an authenticated ADMIN to access /audit-logs', async () => {
    useAuthStore.setState({ status: 'authenticated', user: ADMIN });
    renderAt('/audit-logs');
    expect(await screen.findByRole('heading', { name: 'Bitácora' })).toBeInTheDocument();
  });

  it('redirects an authenticated VENDEDOR from /audit-logs to /unauthorized', async () => {
    useAuthStore.setState({ status: 'authenticated', user: VENDEDOR });
    renderAt('/audit-logs');
    expect(await screen.findByRole('heading', { name: 'Acceso denegado' })).toBeInTheDocument();
  });

  it.each([ADMIN, ENCARGADO_ALMACEN, VENDEDOR, TECNICO])('allows $role to access /locations', async (user) => {
    useAuthStore.setState({ status: 'authenticated', user });
    renderAt('/locations');
    expect(await screen.findByRole('heading', { name: 'Ubicaciones' })).toBeInTheDocument();
    expect(locationService.listLocations).toHaveBeenCalled();
  });

  it('redirects to /unauthorized when the role loses admin access in-session', async () => {
    useAuthStore.setState({ status: 'authenticated', user: ADMIN });
    renderAt('/audit-logs');
    expect(await screen.findByRole('heading', { name: 'Bitácora' })).toBeInTheDocument();

    act(() => {
      useAuthStore.setState({
        status: 'authenticated',
        user: { ...ADMIN, role: 'TECNICO' },
      });
    });

    expect(await screen.findByRole('heading', { name: 'Acceso denegado' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Bitácora' })).not.toBeInTheDocument();
  });

  it('redirects authenticated users away from /login to /locations', async () => {
    useAuthStore.setState({ status: 'authenticated', user: ADMIN });
    renderAt('/login');
    expect(await screen.findByRole('heading', { name: 'Ubicaciones' })).toBeInTheDocument();
  });

  it('redirects to /login when the session expires on a protected route', async () => {
    useAuthStore.setState({ status: 'authenticated', user: ADMIN });
    renderAt('/users');
    expect(await screen.findByRole('heading', { name: 'Usuarios' })).toBeInTheDocument();

    act(() => {
      useAuthStore.getState().handleSessionExpired();
    });

    expect(await screen.findByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Usuarios' })).not.toBeInTheDocument();
  });
});
