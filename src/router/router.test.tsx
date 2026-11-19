import { act, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppRouter } from './index';
import { useAuthStore } from '../stores/authStore';
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
    useAuthStore.setState({ status: 'unauthenticated', user: null });
    vi.mocked(userService.listUsers).mockResolvedValue([]);
    vi.mocked(locationService.listLocations).mockResolvedValue([]);
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
