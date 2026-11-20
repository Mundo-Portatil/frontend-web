import { act, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppRouter } from './index';
import { useAuthStore } from '../stores/authStore';
import * as catalogService from '../modules/inventory/services/catalogService';
import * as stockService from '../modules/inventory/services/quantityStockService';
import * as categoryService from '../modules/inventory/services/categoryService';
import * as userService from '../modules/foundation/users/services/userService';
import * as locationService from '../modules/foundation/locations/services/locationService';
import * as auditLogService from '../modules/foundation/audit-logs/services/auditLogService';

vi.mock('../modules/foundation/locations/components/LocationSelector', () => ({
  LocationSelector: () => null,
}));

vi.mock('../modules/foundation/users/services/userService', () => ({
  listUsers: vi.fn(),
  createUser: vi.fn(),
  updateUser: vi.fn(),
  deactivateUser: vi.fn(),
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

vi.mock('../modules/inventory/services/catalogService', () => ({ listCatalog: vi.fn() }));
vi.mock('../modules/inventory/services/quantityStockService', () => ({ listQuantityStock: vi.fn() }));
vi.mock('../modules/inventory/services/categoryService', () => ({ listCategories: vi.fn() }));

const ADMIN = {
  id: 'admin-1',
  email: 'admin@mundoportatil.pe',
  name: 'Administrador Principal',
  role: 'ADMIN' as const,
  active: true,
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

  it.each([ADMIN, VENDEDOR, TECNICO])('allows $role to consult inventory and quantity stock', async (user) => {
    useAuthStore.setState({ status: 'authenticated', user });
    renderAt('/inventory/stock');
    expect(await screen.findByRole('heading', { name: 'Stock por cantidad' })).toBeInTheDocument();
    expect(await screen.findByText('No hay existencias para estos filtros.')).toBeInTheDocument();
  });

  it.each([ADMIN, VENDEDOR, TECNICO])('allows $role to open hardware lookup', async (user) => {
    useAuthStore.setState({ status: 'authenticated', user });
    renderAt('/inventory');
    expect(await screen.findByRole('heading', { name: 'Inventario' })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: 'Consulta de inventario' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Consulta' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Stock' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Catálogo' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Categorías' })).toBeInTheDocument();
  });

  it.each([VENDEDOR, TECNICO])('denies $role access to hardware intake', async (user) => {
    useAuthStore.setState({ status: 'authenticated', user });
    renderAt('/inventory/inbound');
    expect(await screen.findByRole('heading', { name: 'Acceso denegado' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Ingreso' })).not.toBeInTheDocument();
  });

  it('allows an ADMIN to open hardware intake', async () => {
    useAuthStore.setState({ status: 'authenticated', user: ADMIN });
    renderAt('/inventory/inbound');
    expect(await screen.findByRole('heading', { name: 'Ingreso de hardware' })).toBeInTheDocument();
    expect(await screen.findByLabelText('Ubicación inicial')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ingreso' })).toHaveAttribute('aria-current', 'page');
  });

  it('protects inventory for unauthenticated users', async () => {
    renderAt('/inventory');
    expect(await screen.findByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument();
  });

  it.each([ADMIN, VENDEDOR, TECNICO])('allows $role to access their own profile', async (user) => {
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

  it('allows a VENDEDOR to access /locations', async () => {
    useAuthStore.setState({ status: 'authenticated', user: VENDEDOR });

    renderAt('/locations');

    expect(await screen.findByRole('heading', { name: 'Ubicaciones' })).toBeInTheDocument();
    expect(locationService.listLocations).toHaveBeenCalled();
  });

  it('allows a TECNICO to access /locations', async () => {
    useAuthStore.setState({ status: 'authenticated', user: TECNICO });

    renderAt('/locations');

    expect(await screen.findByRole('heading', { name: 'Ubicaciones' })).toBeInTheDocument();
    expect(locationService.listLocations).toHaveBeenCalled();
  });

  it('redirects a TECNICO from /users to /unauthorized', async () => {
    useAuthStore.setState({ status: 'authenticated', user: TECNICO });

    renderAt('/users');

    expect(await screen.findByRole('heading', { name: 'Acceso denegado' })).toBeInTheDocument();
  });

  it('redirects a TECNICO from /audit-logs to /unauthorized', async () => {
    useAuthStore.setState({ status: 'authenticated', user: TECNICO });

    renderAt('/audit-logs');

    expect(await screen.findByRole('heading', { name: 'Acceso denegado' })).toBeInTheDocument();
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

it.each([ADMIN, VENDEDOR, TECNICO])('allows $role to consult inventory categories', async (user) => {
  useAuthStore.setState({ status: 'authenticated', user });
  renderAt('/inventory/categories');
  expect(await screen.findByRole('heading', { name: 'Categorías' })).toBeInTheDocument();
  expect(await screen.findByText('No hay categorías disponibles.')).toBeInTheDocument();
});

it('protects category access for guests', async () => {
  useAuthStore.setState({ status: 'unauthenticated', user: null });
  renderAt('/inventory/categories');
  expect(await screen.findByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument();
});


it.each([ADMIN, VENDEDOR, TECNICO])('allows $role to consult the catalog route', async (user) => {
  vi.mocked(catalogService.listCatalog).mockResolvedValue({ items: [], total: 0, page: 1, limit: 50 });
  vi.mocked(categoryService.listCategories).mockResolvedValue([]);
  useAuthStore.setState({ status: 'authenticated', user });
  renderAt('/inventory/catalog');
  expect(await screen.findByRole('heading', { name: 'Catálogo maestro' })).toBeInTheDocument();
  expect(await screen.findByText('No hay productos disponibles.')).toBeInTheDocument();
});
