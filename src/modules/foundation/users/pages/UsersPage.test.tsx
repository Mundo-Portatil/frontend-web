import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearAccessToken, saveAccessToken } from '../../../../config/authToken';
import { useAuthStore } from '../../../../stores/authStore';
import { getProfile } from '../../auth/services/authService';
import { UsersPage } from './UsersPage';
import * as userService from '../services/userService';

vi.mock('../../auth/services/authService', () => ({
  getProfile: vi.fn(),
}));

vi.mock('../services/userService', () => ({
  listUsers: vi.fn(),
  createUser: vi.fn(),
  updateUser: vi.fn(),
  deactivateUser: vi.fn(),
  reactivateUser: vi.fn(),
}));

const ADMIN_SESSION = {
  status: 'authenticated' as const,
  user: {
    id: 'admin-1',
    email: 'admin@mundoportatil.pe',
    name: 'Administrador Principal',
    role: 'ADMIN' as const,
    active: true,
  },
};

const SAMPLE_USERS = [
  {
    id: 'user-1',
    email: 'admin@mundoportatil.pe',
    name: 'Administrador Principal',
    role: 'ADMIN' as const,
    active: true,
    createdAt: '2026-11-14T20:00:00.000Z',
    updatedAt: '2026-11-14T20:00:00.000Z',
  },
];

const INACTIVE_USER = {
  ...SAMPLE_USERS[0],
  id: 'user-2',
  email: 'inactivo@mundoportatil.pe',
  name: 'Usuario Inactivo',
  active: false,
};

describe('UsersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearAccessToken();
    useAuthStore.setState(ADMIN_SESSION);
  });

  afterEach(() => {
    act(() => useAuthStore.setState({ status: 'unauthenticated', user: null }));
    clearAccessToken();
  });

  it('shows the loading state while users are being fetched', async () => {
    vi.mocked(userService.listUsers).mockReturnValueOnce(new Promise(() => {}));

    render(<UsersPage />);

    expect(screen.getByRole('status')).toHaveTextContent('Cargando usuarios...');
  });

  it('shows empty state when there are no users', async () => {
    vi.mocked(userService.listUsers).mockResolvedValueOnce([]);

    render(<UsersPage />);

    expect(await screen.findByText('No hay usuarios registrados.')).toBeInTheDocument();
  });

  it('shows error state when listing users fails', async () => {
    vi.mocked(userService.listUsers).mockRejectedValueOnce({
      kind: 'server',
      message: 'Error interno del servidor. Intenta nuevamente.',
    });

    render(<UsersPage />);

    expect(
      await screen.findByText('Error interno del servidor. Intenta nuevamente.'),
    ).toBeInTheDocument();
  });

  it('validates the create form before calling the backend', async () => {
    vi.mocked(userService.listUsers).mockResolvedValueOnce([]);
    render(<UsersPage />);
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'Crear usuario' }));

    expect(screen.getByText('El correo es obligatorio.')).toBeInTheDocument();
    expect(screen.getByText('El nombre es obligatorio.')).toBeInTheDocument();
    expect(screen.getByText('La contraseña es obligatoria.')).toBeInTheDocument();
    expect(screen.getByLabelText('Correo electrónico')).toHaveAttribute(
      'aria-describedby',
      'user-email-error',
    );
    expect(userService.createUser).not.toHaveBeenCalled();
  });

  it('shows backend validation errors returned by the form submission', async () => {
    vi.mocked(userService.listUsers).mockResolvedValueOnce([]);
    vi.mocked(userService.createUser).mockRejectedValueOnce({
      kind: 'validation',
      message: 'El correo electrónico ya se encuentra registrado.',
    });

    render(<UsersPage />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText('Correo electrónico'), 'carlos.vendedor@mundoportatil.pe');
    await user.type(screen.getByLabelText('Nombre completo'), 'Carlos Mendoza');
    await user.type(screen.getByLabelText('Contraseña'), 'Password123!');
    await user.click(screen.getByRole('button', { name: 'Crear usuario' }));

    expect(
      await screen.findByText('El correo electrónico ya se encuentra registrado.'),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Correo electrónico')).toHaveValue(
      'carlos.vendedor@mundoportatil.pe',
    );
    expect(screen.getByLabelText('Nombre completo')).toHaveValue('Carlos Mendoza');
  });

  it('creates a new user from the form', async () => {
    vi.mocked(userService.listUsers).mockResolvedValueOnce([]);
    vi.mocked(userService.createUser).mockResolvedValueOnce({
      id: 'user-2',
      email: 'carlos.vendedor@mundoportatil.pe',
      name: 'Carlos Mendoza',
      role: 'VENDEDOR',
      active: true,
      createdAt: '2026-11-14T20:30:00.000Z',
      updatedAt: '2026-11-14T20:30:00.000Z',
    });

    render(<UsersPage />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText('Correo electrónico'), 'carlos.vendedor@mundoportatil.pe');
    await user.type(screen.getByLabelText('Nombre completo'), 'Carlos Mendoza');
    await user.type(screen.getByLabelText('Contraseña'), 'Password123!');
    await user.click(screen.getByRole('button', { name: 'Crear usuario' }));

    await waitFor(() => {
      expect(userService.createUser).toHaveBeenCalledWith({
        email: 'carlos.vendedor@mundoportatil.pe',
        name: 'Carlos Mendoza',
        password: 'Password123!',
        role: 'VENDEDOR',
      });
    });
    expect(await screen.findByText('Usuario creado correctamente.')).toBeInTheDocument();
    const createSection = screen.getByRole('heading', { name: 'Registrar usuario' }).closest('section');
    expect(within(createSection as HTMLElement).getByText('Usuario creado correctamente.')).toBeInTheDocument();
    expect(screen.getByText('Usuario creado correctamente.').closest('form')).toBeNull();
    expect(screen.getByLabelText('Correo electrónico')).toHaveValue('');
    expect(screen.getByLabelText('Nombre completo')).toHaveValue('');
    expect(screen.getByLabelText('Contraseña')).toHaveValue('');
  });

  it('shows the update confirmation next to the user listing, not in the creation form', async () => {
    vi.mocked(userService.listUsers).mockResolvedValueOnce(SAMPLE_USERS);
    vi.mocked(userService.updateUser).mockResolvedValueOnce({
      ...SAMPLE_USERS[0],
      name: 'Administrador Editado',
      updatedAt: '2026-11-14T20:45:00.000Z',
    });

    render(<UsersPage />);
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Editar' }));
    const nameInput = screen.getByLabelText('Nombre completo');
    await user.clear(nameInput);
    await user.type(nameInput, 'Administrador Editado');
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    const confirmation = await screen.findByText('Usuario actualizado correctamente.');
    expect(confirmation.closest('form')).toBeNull();
    const createSection = screen.getByRole('heading', { name: 'Registrar usuario' }).closest('section');
    expect(within(createSection as HTMLElement).queryByText('Usuario actualizado correctamente.')).not.toBeInTheDocument();
  });

  it('updates an existing user', async () => {
    vi.mocked(userService.listUsers).mockResolvedValueOnce(SAMPLE_USERS);
    vi.mocked(userService.updateUser).mockResolvedValueOnce({
      ...SAMPLE_USERS[0],
      name: 'Administrador Editado',
      updatedAt: '2026-11-14T20:45:00.000Z',
    });

    render(<UsersPage />);
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Editar' }));
    const nameInput = screen.getByLabelText('Nombre completo');
    await user.clear(nameInput);
    await user.type(nameInput, 'Administrador Editado');
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    await waitFor(() => {
      expect(userService.updateUser).toHaveBeenCalledWith('user-1', {
        name: 'Administrador Editado',
        role: 'ADMIN',
      });
    });
  });

  it('refreshes the session role after editing the current account', async () => {
    saveAccessToken('active-jwt');
    useAuthStore.setState({
      status: 'authenticated',
      user: { ...ADMIN_SESSION.user, id: 'user-1' },
    });
    vi.mocked(userService.listUsers).mockResolvedValueOnce(SAMPLE_USERS);
    vi.mocked(userService.updateUser).mockResolvedValueOnce({
      ...SAMPLE_USERS[0],
      role: 'TECNICO',
      updatedAt: '2026-11-14T20:48:00.000Z',
    });
    vi.mocked(getProfile).mockResolvedValueOnce({
      id: 'user-1',
      email: 'admin@mundoportatil.pe',
      name: 'Administrador Principal',
      role: 'TECNICO',
      active: true,
    });

    render(<UsersPage />);
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Editar' }));
    await user.selectOptions(screen.getByLabelText('Rol'), 'TECNICO');
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    await waitFor(() => {
      expect(getProfile).toHaveBeenCalledTimes(1);
      expect(useAuthStore.getState().user?.role).toBe('TECNICO');
    });
  });

  it('deactivates an active user', async () => {
    vi.mocked(userService.listUsers).mockResolvedValueOnce(SAMPLE_USERS);
    vi.mocked(userService.deactivateUser).mockResolvedValueOnce({
      ...SAMPLE_USERS[0],
      active: false,
      updatedAt: '2026-11-14T20:46:00.000Z',
    });

    render(<UsersPage />);
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Dar de baja' }));

    await waitFor(() => {
      expect(userService.deactivateUser).toHaveBeenCalledWith('user-1');
    });
    const confirmation = await screen.findByText('Usuario desactivado correctamente.');
    expect(confirmation.closest('form')).toBeNull();
    const createSection = screen.getByRole('heading', { name: 'Registrar usuario' }).closest('section');
    expect(within(createSection as HTMLElement).queryByText('Usuario desactivado correctamente.')).not.toBeInTheDocument();
  });

  it('reactivates an inactive user and reflects the new status', async () => {
    vi.mocked(userService.listUsers).mockResolvedValueOnce([INACTIVE_USER]);
    vi.mocked(userService.reactivateUser).mockResolvedValueOnce({
      ...INACTIVE_USER,
      active: true,
      updatedAt: '2026-11-14T20:47:00.000Z',
    });

    render(<UsersPage />);
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Reactivar' }));

    await waitFor(() => {
      expect(userService.reactivateUser).toHaveBeenCalledWith('user-2');
    });
    expect(await screen.findByText('Usuario reactivado correctamente.')).toBeInTheDocument();

    const listing = screen.getByRole('region', { name: 'Listado de usuarios' });
    expect(within(listing).getByText('Activo')).toBeInTheDocument();
    expect(within(listing).queryByText('Inactivo')).not.toBeInTheDocument();
    expect(within(listing).getByRole('button', { name: 'Dar de baja' })).toBeInTheDocument();
    expect(within(listing).queryByRole('button', { name: 'Reactivar' })).not.toBeInTheDocument();
    expect(userService.deactivateUser).not.toHaveBeenCalled();
  });

  it('shows reactivation failures next to the listing', async () => {
    vi.mocked(userService.listUsers).mockResolvedValueOnce([INACTIVE_USER]);
    vi.mocked(userService.reactivateUser).mockRejectedValueOnce({
      kind: 'server',
      message: 'No se pudo reactivar el usuario.',
    });

    render(<UsersPage />);
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Reactivar' }));

    const error = await screen.findByText('No se pudo reactivar el usuario.');
    expect(error.closest('form')).toBeNull();
  });

  it('shows deactivation failures next to the listing instead of inside the creation form', async () => {
    vi.mocked(userService.listUsers).mockResolvedValueOnce(SAMPLE_USERS);
    vi.mocked(userService.deactivateUser).mockRejectedValueOnce({
      kind: 'conflict',
      message: 'No se puede desactivar el usuario.',
    });

    render(<UsersPage />);
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Dar de baja' }));

    const error = await screen.findByText('No se puede desactivar el usuario.');
    expect(error.closest('form')).toBeNull();
    const createSection = screen.getByRole('heading', { name: 'Registrar usuario' }).closest('section');
    expect(within(createSection as HTMLElement).queryByText('No se puede desactivar el usuario.')).not.toBeInTheDocument();
  });

  it('starts with a clean form after leaving and returning to the screen', async () => {
    vi.mocked(userService.listUsers).mockResolvedValue([]);

    const firstRender = render(<UsersPage />);
    await screen.findByText('No hay usuarios registrados.');
    const user = userEvent.setup();
    await user.type(screen.getByLabelText('Correo electrónico'), 'temporal@mundoportatil.pe');
    await user.type(screen.getByLabelText('Nombre completo'), 'Temporal');
    await user.type(screen.getByLabelText('Contraseña'), 'Password123!');

    firstRender.unmount();
    render(<UsersPage />);
    await screen.findByText('No hay usuarios registrados.');

    expect(screen.getByLabelText('Correo electrónico')).toHaveValue('');
    expect(screen.getByLabelText('Nombre completo')).toHaveValue('');
    expect(screen.getByLabelText('Contraseña')).toHaveValue('');
  });

  it('hides administrative forms and actions from non-admin roles', async () => {
    act(() => useAuthStore.setState({
      ...ADMIN_SESSION,
      user: { ...ADMIN_SESSION.user, role: 'VENDEDOR' },
    }));
    vi.mocked(userService.listUsers).mockResolvedValueOnce(SAMPLE_USERS);

    render(<UsersPage />);

    expect(await screen.findByText('Administrador Principal')).toBeInTheDocument();
    expect(screen.queryByText('Registrar usuario')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Editar' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Dar de baja' })).not.toBeInTheDocument();
  });
});
