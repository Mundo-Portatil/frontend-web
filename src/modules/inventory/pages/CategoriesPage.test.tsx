import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuthStore } from '../../../stores/authStore';
import { CategoriesPage } from './CategoriesPage';
import * as service from '../services/categoryService';
vi.mock('../services/categoryService', () => ({ listCategories: vi.fn(), createCategory: vi.fn(), updateCategory: vi.fn() }));
const session = { id: 'self', email: 'a@mp.pe', name: 'Ana', role: 'ADMIN' as const, active: true };
const category = { id: '77e45678-e89b-42d3-a456-426614174000', name: 'RAM', description: null, active: true, productsCount: 8, createdAt: '2026-11-14T21:00:00.000Z' };
beforeEach(() => { vi.resetAllMocks(); useAuthStore.setState({ status: 'authenticated', user: session }); vi.mocked(service.listCategories).mockResolvedValue([category]); });
describe('CategoriesPage', () => {
  it.each(['ADMIN', 'VENDEDOR', 'TECNICO'] as const)('allows %s to consult, with ADMIN-only mutations', async (role) => {
    useAuthStore.setState({ user: { ...session, role } }); render(<CategoriesPage />);
    expect(await screen.findByText('RAM')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
    if (role === 'ADMIN') expect(screen.getByRole('button', { name: 'Editar' })).toBeInTheDocument();
    else { expect(screen.queryByRole('button', { name: 'Editar' })).not.toBeInTheDocument(); expect(screen.queryByLabelText('Nombre')).not.toBeInTheDocument(); }
  });
  it('shows loading, empty, error and retry states', async () => {
    vi.mocked(service.listCategories).mockReturnValueOnce(new Promise(() => {}));
    const view = render(<CategoriesPage />);
    expect(screen.getByText('Cargando categorías...')).toBeInTheDocument(); view.unmount();
    vi.mocked(service.listCategories).mockRejectedValueOnce({ kind: 'network', message: 'Sin conexión' }).mockResolvedValueOnce([]);
    render(<CategoriesPage />); expect(await screen.findByText('Sin conexión')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByText('No hay categorías disponibles.')).toBeInTheDocument();
  });
  it('sends both active filters and omits active for all', async () => {
    const user = userEvent.setup(); render(<CategoriesPage />); await screen.findByText('RAM');
    await user.selectOptions(screen.getByLabelText('Estado de categorías'), 'inactive');
    await waitFor(() => expect(service.listCategories).toHaveBeenLastCalledWith({ active: false }, expect.any(AbortSignal)));
    await user.selectOptions(screen.getByLabelText('Estado de categorías'), 'active');
    await waitFor(() => expect(service.listCategories).toHaveBeenLastCalledWith({ active: true }, expect.any(AbortSignal)));
    await user.selectOptions(screen.getByLabelText('Estado de categorías'), 'all');
    await waitFor(() => expect(service.listCategories).toHaveBeenLastCalledWith({}, expect.any(AbortSignal)));
  });
  it('validates required name then creates and reloads authoritative counts', async () => {
    vi.mocked(service.createCategory).mockResolvedValue(category);
    const user = userEvent.setup(); render(<CategoriesPage />); await screen.findByText('RAM');
    await user.click(screen.getByRole('button', { name: 'Registrar categoría' }));
    await user.click(screen.getByRole('button', { name: 'Crear categoría' }));
    expect(screen.getByRole('alert')).toHaveTextContent('El nombre es obligatorio.'); expect(service.createCategory).not.toHaveBeenCalled();
    await user.type(screen.getByLabelText('Nombre'), 'SSD');
    await user.type(screen.getByLabelText('Descripción'), 'Almacenamiento');
    await user.click(screen.getByRole('button', { name: 'Crear categoría' }));
    expect(await screen.findByText('Categoría creada correctamente.')).toBeInTheDocument();
    expect(service.createCategory).toHaveBeenCalledWith({ name: 'SSD', description: 'Almacenamiento', active: true });
    expect(service.listCategories).toHaveBeenCalledTimes(2);
  });
  it('edits category state and reflects filtered server results', async () => {
    vi.mocked(service.updateCategory).mockResolvedValue({ ...category, active: false });
    const user = userEvent.setup(); render(<CategoriesPage />);
    await user.click(await screen.findByRole('button', { name: 'Editar' }));
    await user.click(screen.getByLabelText('Activa'));
    vi.mocked(service.listCategories).mockResolvedValue([{ ...category, active: false }]);
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));
    expect(await screen.findByText('Categoría actualizada correctamente.')).toBeInTheDocument();
    expect(service.updateCategory).toHaveBeenCalledWith(category.id, { name: 'RAM', description: '', active: false });
    expect(await screen.findByText('Inactiva')).toBeInTheDocument();
  });
  it.each([400, 403, 404, 409])('shows API %s failures and preserves form values', async (status) => {
    vi.mocked(service.updateCategory).mockRejectedValue({ kind: status === 403 ? 'forbidden' : 'validation', status, message: `Operación rechazada ${status}` });
    const user = userEvent.setup(); render(<CategoriesPage />);
    await user.click(await screen.findByRole('button', { name: 'Editar' }));
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(`Operación rechazada ${status}`);
    expect(screen.getByLabelText('Nombre')).toHaveValue('RAM');
  });
  it('ignores responses from a previous filter', async () => {
    let finish!: (items: typeof category[]) => void;
    vi.mocked(service.listCategories).mockReturnValueOnce(new Promise((resolve) => { finish = resolve; })).mockResolvedValueOnce([]);
    render(<CategoriesPage />);
    await userEvent.selectOptions(screen.getByLabelText('Estado de categorías'), 'inactive');
    await screen.findByText('No hay categorías disponibles.');
    await act(async () => finish([category]));
    expect(screen.queryByText('RAM')).not.toBeInTheDocument();
  });
});

it('prevents switching the edited category while its save is pending', async () => {
  const other = { ...category, id: '88e45678-e89b-42d3-a456-426614174000', name: 'SSD' };
  vi.mocked(service.listCategories).mockResolvedValue([category, other]);
  let finish!: (item: typeof category) => void;
  vi.mocked(service.updateCategory).mockReturnValue(new Promise((resolve) => { finish = resolve; }));
  const user = userEvent.setup(); render(<CategoriesPage />);
  await screen.findByText('RAM');
  await user.click(screen.getAllByRole('button', { name: 'Editar' })[0]);
  await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));
  for (const button of screen.getAllByRole('button', { name: 'Editar' })) expect(button).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled();
  await act(async () => finish(category));
  await screen.findByText('Categoría actualizada correctamente.');
  for (const button of screen.getAllByRole('button', { name: 'Editar' })) expect(button).toBeEnabled();
});
