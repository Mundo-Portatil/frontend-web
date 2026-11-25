import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuthStore } from '../../../../stores/authStore';
import { getProfile, login as requestLogin } from '../services/authService';
import { LoginPage } from './LoginPage';

vi.mock('../services/authService', () => ({
  login: vi.fn(),
  getProfile: vi.fn(),
}));

function renderLoginPage() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/locations" element={<h1>Ubicaciones route</h1>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({ status: 'unauthenticated', user: null });
  });

  it('validates required fields before sending the request', async () => {
    renderLoginPage();
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }));

    expect(screen.getByText('El correo electrónico es obligatorio.')).toBeInTheDocument();
    expect(screen.getByText('La contraseña es obligatoria.')).toBeInTheDocument();
    expect(requestLogin).not.toHaveBeenCalled();
  });

  it('sends non-empty passwords to the backend without applying registration rules', async () => {
    vi.mocked(requestLogin).mockRejectedValueOnce({
      kind: 'unauthorized',
      message: 'Credenciales inválidas o sesión expirada.',
    });
    renderLoginPage();
    const user = userEvent.setup();

    await user.type(screen.getByLabelText('Correo electrónico'), 'legacy@mundoportatil.pe');
    await user.type(screen.getByLabelText('Contraseña'), 'abc');
    await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }));

    await waitFor(() => {
      expect(requestLogin).toHaveBeenCalledWith({ email: 'legacy@mundoportatil.pe', password: 'abc' });
    });
  });

  it('shows the authentication error returned by the backend', async () => {
    vi.mocked(requestLogin).mockRejectedValueOnce({
      kind: 'unauthorized',
      message: 'Credenciales inválidas o sesión expirada.',
    });
    renderLoginPage();
    const user = userEvent.setup();

    await user.type(screen.getByLabelText('Correo electrónico'), 'admin@mundoportatil.pe');
    await user.type(screen.getByLabelText('Contraseña'), 'Wrong123!');
    await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Credenciales inválidas o sesión expirada.',
    );
  });

  it('authenticates valid credentials and redirects to the operative route', async () => {
    vi.mocked(requestLogin).mockResolvedValueOnce({
      access_token: 'jwt-token',
      user: {
        id: 'user-1',
        email: 'admin@mundoportatil.pe',
        name: 'Administrador Principal',
        role: 'ADMIN',
      },
    });
    vi.mocked(getProfile).mockResolvedValueOnce({
      id: 'user-1',
      email: 'admin@mundoportatil.pe',
      name: 'Administrador Principal',
      role: 'ADMIN',
      active: true,
    });
    renderLoginPage();
    const user = userEvent.setup();

    await user.type(screen.getByLabelText('Correo electrónico'), 'admin@mundoportatil.pe');
    await user.type(screen.getByLabelText('Contraseña'), 'Admin123!');
    await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }));

    expect(await screen.findByText('Ubicaciones route')).toBeInTheDocument();
    expect(useAuthStore.getState().status).toBe('authenticated');
  });

  it('shows a loading state while the authentication request is in progress', async () => {
    vi.mocked(requestLogin).mockReturnValueOnce(new Promise(() => {}));
    renderLoginPage();
    const user = userEvent.setup();

    await user.type(screen.getByLabelText('Correo electrónico'), 'admin@mundoportatil.pe');
    await user.type(screen.getByLabelText('Contraseña'), 'Admin123!');
    await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }));

    expect(screen.getByRole('button', { name: 'Iniciando sesión…' })).toBeDisabled();
  });
});
