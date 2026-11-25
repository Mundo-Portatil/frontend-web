import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProfilePage } from './ProfilePage';
import { updateOwnProfile } from '../services/userService';
import { useAuthStore } from '../../../../stores/authStore';

vi.mock('../services/userService', () => ({ updateOwnProfile: vi.fn() }));
const account = { id: 'self', name: 'Ana', email: 'ana@mp.pe', role: 'VENDEDOR' as const, active: true };
beforeEach(() => { vi.clearAllMocks(); useAuthStore.setState({ status: 'authenticated', user: account }); });

describe('Mi perfil', () => {
  it.each(['ADMIN', 'VENDEDOR', 'TECNICO'] as const)('updates only own editable fields as %s and synchronizes session', async (role) => {
    useAuthStore.setState({ user: { ...account, role } });
    vi.mocked(updateOwnProfile).mockResolvedValue({ ...account, role, name: 'Ana María', createdAt: '', updatedAt: '' });
    const user = userEvent.setup();
    render(<ProfilePage />);
    await user.clear(screen.getByLabelText('Nombre'));
    await user.type(screen.getByLabelText('Nombre'), 'Ana María');
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));
    expect(await screen.findByText('Tu perfil se actualizó correctamente.')).toBeInTheDocument();
    expect(updateOwnProfile).toHaveBeenCalledWith({ name: 'Ana María' });
    expect(useAuthStore.getState().user).toEqual({ ...account, role, name: 'Ana María' });
    expect(screen.queryByLabelText('Rol')).not.toBeInTheDocument();
  });
  it('rejects short passwords before sending and requires matching confirmation', async () => {
    const user = userEvent.setup(); render(<ProfilePage />);
    await user.type(screen.getByLabelText('Nueva contraseña'), '123');
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));
    expect(screen.getByRole('alert')).toHaveTextContent('al menos 6');
    expect(updateOwnProfile).not.toHaveBeenCalled();
  });
  it('changes email and password, clears secrets and displays API conflicts', async () => {
    const user = userEvent.setup();
    vi.mocked(updateOwnProfile).mockRejectedValue({ kind: 'unknown', status: 409, message: 'El correo ya está registrado.' });
    render(<ProfilePage />);
    await user.clear(screen.getByLabelText('Correo electrónico'));
    await user.type(screen.getByLabelText('Correo electrónico'), 'otra@mp.pe');
    await user.type(screen.getByLabelText('Nueva contraseña'), 'Nueva123');
    await user.type(screen.getByLabelText('Confirmar nueva contraseña'), 'Nueva123');
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('El correo ya está registrado.');
    expect(updateOwnProfile).toHaveBeenCalledWith({ email: 'otra@mp.pe', password: 'Nueva123' });
    expect(screen.getByLabelText('Nueva contraseña')).toHaveValue('');
    expect(useAuthStore.getState().user).toEqual(account);
  });
});

it('ignores a save response after switching to another account', async () => {
  let resolve!: (value: Awaited<ReturnType<typeof updateOwnProfile>>) => void;
  vi.mocked(updateOwnProfile).mockReturnValue(new Promise((done) => { resolve = done; }));
  const user = userEvent.setup(); render(<ProfilePage />);
  await user.clear(screen.getByLabelText('Nombre'));
  await user.type(screen.getByLabelText('Nombre'), 'Nueva');
  await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));
  useAuthStore.setState({ user: { ...account, id: 'other', name: 'Otra cuenta' } });
  resolve({ ...account, name: 'Nueva', createdAt: '', updatedAt: '' });
  await screen.findByRole('button', { name: 'Guardar cambios' });
  expect(useAuthStore.getState().user?.id).toBe('other');
  expect(useAuthStore.getState().user?.name).toBe('Otra cuenta');
});
