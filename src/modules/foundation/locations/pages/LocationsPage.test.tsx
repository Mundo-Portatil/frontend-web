import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuthStore } from '../../../../stores/authStore';
import { useLocationStore } from '../../../../stores/locationStore';
import { LocationsPage } from './LocationsPage';
import * as locationService from '../services/locationService';

vi.mock('../services/locationService', () => ({
  listLocations: vi.fn(),
  listActiveLocations: vi.fn(),
  createLocation: vi.fn(),
  updateLocation: vi.fn(),
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

const SAMPLE_LOCATION = {
  id: 'location-1',
  name: 'Almacén Central',
  type: 'ALMACEN_CENTRAL' as const,
  active: true,
  createdAt: '2026-11-14T20:00:00.000Z',
};

describe('LocationsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState(ADMIN_SESSION);
    useLocationStore.getState().reset();
  });

  afterEach(() => {
    act(() => useAuthStore.setState({ status: 'unauthenticated', user: null }));
  });

  it('shows the loading state while locations are being fetched', () => {
    vi.mocked(locationService.listLocations).mockReturnValueOnce(new Promise(() => {}));

    render(<LocationsPage />);

    expect(screen.getByRole('status')).toHaveTextContent('Cargando ubicaciones...');
  });

  it('shows empty state when there are no locations', async () => {
    vi.mocked(locationService.listLocations).mockResolvedValueOnce([]);

    render(<LocationsPage />);

    expect(await screen.findByText('No hay ubicaciones disponibles.')).toBeInTheDocument();
  });

  it('shows error state with retry when the listing fails', async () => {
    vi.mocked(locationService.listLocations)
      .mockRejectedValueOnce({
        kind: 'network',
        message: 'No se pudo establecer comunicación con el servidor. Verifica tu conexión.',
      })
      .mockResolvedValueOnce([]);

    render(<LocationsPage />);

    expect(
      await screen.findByText('No se pudo establecer comunicación con el servidor. Verifica tu conexión.'),
    ).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Reintentar' }));

    expect(await screen.findByText('No hay ubicaciones disponibles.')).toBeInTheDocument();
    expect(locationService.listLocations).toHaveBeenCalledTimes(2);
  });

  it('validates the location name before calling the backend', async () => {
    vi.mocked(locationService.listLocations).mockResolvedValueOnce([]);
    render(<LocationsPage />);
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'Crear ubicación' }));

    expect(screen.getByText('El nombre es obligatorio.')).toBeInTheDocument();
    expect(locationService.createLocation).not.toHaveBeenCalled();
  });

  it('creates a location', async () => {
    vi.mocked(locationService.listLocations).mockResolvedValueOnce([]);
    vi.mocked(locationService.createLocation).mockResolvedValueOnce({
      ...SAMPLE_LOCATION,
      id: 'location-2',
      name: 'Puesto 105',
      type: 'PUESTO',
    });

    render(<LocationsPage />);
    const user = userEvent.setup();

    await user.type(await screen.findByLabelText('Nombre'), 'Puesto 105');
    await user.click(screen.getByRole('button', { name: 'Crear ubicación' }));

    await waitFor(() => {
      expect(locationService.createLocation).toHaveBeenCalledWith({
        name: 'Puesto 105',
        type: 'PUESTO',
      });
    });
    expect(await screen.findByText('Ubicación creada correctamente.')).toBeInTheDocument();
    expect(useLocationStore.getState().availableLocations).toEqual([
      expect.objectContaining({ id: 'location-2', name: 'Puesto 105' }),
    ]);
  });

  it('updates a location', async () => {
    vi.mocked(locationService.listLocations).mockResolvedValueOnce([SAMPLE_LOCATION]);
    vi.mocked(locationService.updateLocation).mockResolvedValueOnce({
      ...SAMPLE_LOCATION,
      name: 'Almacén Renombrado',
    });

    render(<LocationsPage />);
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Editar' }));
    const nameInput = screen.getByLabelText('Nombre');
    await user.clear(nameInput);
    await user.type(nameInput, 'Almacén Renombrado');
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    await waitFor(() => {
      expect(locationService.updateLocation).toHaveBeenCalledWith('location-1', {
        name: 'Almacén Renombrado',
      });
    });
    expect(await screen.findByText('Ubicación actualizada correctamente.')).toBeInTheDocument();
  });

  it('updates the operative context immediately when the selected location is renamed', async () => {
    useLocationStore.getState().selectLocation(SAMPLE_LOCATION);
    vi.mocked(locationService.listLocations).mockResolvedValueOnce([SAMPLE_LOCATION]);
    vi.mocked(locationService.updateLocation).mockResolvedValueOnce({
      ...SAMPLE_LOCATION,
      name: 'Almacén Renombrado',
    });

    render(<LocationsPage />);
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Editar' }));
    const nameInput = screen.getByLabelText('Nombre');
    await user.clear(nameInput);
    await user.type(nameInput, 'Almacén Renombrado');
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    expect(await screen.findByText('Ubicación actualizada correctamente.')).toBeInTheDocument();
    expect(useLocationStore.getState().activeLocation?.name).toBe('Almacén Renombrado');
    expect(useLocationStore.getState().availableLocations[0]?.name).toBe('Almacén Renombrado');
  });

  it('deactivates an active location', async () => {
    vi.mocked(locationService.listLocations).mockResolvedValueOnce([SAMPLE_LOCATION]);
    vi.mocked(locationService.updateLocation).mockResolvedValueOnce({
      ...SAMPLE_LOCATION,
      active: false,
    });

    render(<LocationsPage />);
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Editar' }));
    expect(screen.queryByRole('button', { name: 'Dar de baja' })).not.toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText('Estado de la ubicación'), 'false');
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));
    expect(locationService.updateLocation).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Confirmar desactivación' }));

    await waitFor(() => {
      expect(locationService.updateLocation).toHaveBeenCalledWith('location-1', { active: false });
    });
    expect(await screen.findByText('Ubicación desactivada correctamente.')).toBeInTheDocument();
  });

  it('clears the operative location when it is deactivated', async () => {
    useLocationStore.setState({ activeLocation: SAMPLE_LOCATION });
    vi.mocked(locationService.listLocations).mockResolvedValueOnce([SAMPLE_LOCATION]);
    vi.mocked(locationService.updateLocation).mockResolvedValueOnce({
      ...SAMPLE_LOCATION,
      active: false,
    });

    render(<LocationsPage />);
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Editar' }));
    expect(screen.queryByRole('button', { name: 'Dar de baja' })).not.toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText('Estado de la ubicación'), 'false');
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));
    expect(locationService.updateLocation).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Confirmar desactivación' }));

    await waitFor(() => {
      expect(useLocationStore.getState().activeLocation).toBeNull();
    });
  });

  it('hides administrative forms and actions from non-admin roles', async () => {
    useAuthStore.setState({
      ...ADMIN_SESSION,
      user: { ...ADMIN_SESSION.user, role: 'TECNICO' },
    });
    vi.mocked(locationService.listLocations).mockResolvedValueOnce([SAMPLE_LOCATION]);

    render(<LocationsPage />);

    expect(await screen.findByText('Almacén Central')).toBeInTheDocument();
    expect(screen.queryByText('Registrar ubicación')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Editar' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Dar de baja' })).not.toBeInTheDocument();
  });

it('reactivates an inactive location from edit and restores it to the work selector', async () => {
  useAuthStore.setState(ADMIN_SESSION);
  useLocationStore.getState().reset();
  vi.mocked(locationService.listLocations).mockResolvedValueOnce([{ ...SAMPLE_LOCATION, active: false }]);
  vi.mocked(locationService.updateLocation).mockResolvedValueOnce(SAMPLE_LOCATION);
  const user = userEvent.setup();
  render(<LocationsPage />);
  await user.click(await screen.findByRole('button', { name: 'Editar' }));
  expect(screen.getByLabelText('Estado de la ubicación')).toHaveValue('false');
  await user.selectOptions(screen.getByLabelText('Estado de la ubicación'), 'true');
  await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));
  expect(locationService.updateLocation).not.toHaveBeenCalled();
  await user.click(screen.getByRole('button', { name: 'Confirmar reactivación' }));
  expect(await screen.findByText('Ubicación reactivada correctamente.')).toBeInTheDocument();
  expect(locationService.updateLocation).toHaveBeenCalledWith(SAMPLE_LOCATION.id, { active: true });
  expect(useLocationStore.getState().availableLocations).toContainEqual(SAMPLE_LOCATION);
});

it('preserves the draft when cancelling review and sends a confirmed change only once', async () => {
  vi.clearAllMocks();
  useAuthStore.setState(ADMIN_SESSION);
  vi.mocked(locationService.listLocations).mockResolvedValueOnce([SAMPLE_LOCATION]);
  let finish!: (value: typeof SAMPLE_LOCATION) => void;
  vi.mocked(locationService.updateLocation).mockReturnValueOnce(new Promise((resolve) => { finish = resolve; }));
  const user = userEvent.setup();
  render(<LocationsPage />);
  await user.click(await screen.findByRole('button', { name: 'Editar' }));
  await user.selectOptions(screen.getByLabelText('Estado de la ubicación'), 'false');
  await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));
  expect(screen.getByRole('heading', { name: 'Confirmar desactivación' })).toHaveFocus();
  await user.click(screen.getByRole('button', { name: 'Volver a editar' }));
  expect(screen.getByLabelText('Nombre')).toHaveFocus();
  expect(screen.getByLabelText('Estado de la ubicación')).toHaveValue('false');
  expect(locationService.updateLocation).not.toHaveBeenCalled();
  await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));
  await user.dblClick(screen.getByRole('button', { name: 'Confirmar desactivación' }));
  expect(locationService.updateLocation).toHaveBeenCalledTimes(1);
  expect(screen.getByRole('button', { name: 'Guardando…' })).toBeDisabled();
  await act(async () => finish({ ...SAMPLE_LOCATION, active: false }));
  expect(await screen.findByText('Ubicación desactivada correctamente.')).toBeInTheDocument();
});


it('finishes an outstanding reload before allowing the edited location to be saved', async () => {
  let finish!: (value: (typeof SAMPLE_LOCATION)[]) => void;
  vi.mocked(locationService.listLocations).mockResolvedValueOnce([SAMPLE_LOCATION]).mockReturnValueOnce(new Promise((resolve) => { finish = resolve; }));
  vi.mocked(locationService.updateLocation).mockResolvedValueOnce({ ...SAMPLE_LOCATION, name: 'Nuevo almacén' });
  const user = userEvent.setup();
  render(<LocationsPage />);
  await user.click(await screen.findByRole('button', { name: 'Editar' }));
  await user.clear(screen.getByLabelText('Nombre'));
  await user.type(screen.getByLabelText('Nombre'), 'Nuevo almacén');
  await user.click(screen.getByRole('button', { name: 'Recargar' }));
  expect(screen.getByRole('button', { name: 'Guardar cambios' })).toBeDisabled();
  await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));
  expect(locationService.updateLocation).not.toHaveBeenCalled();
  await act(async () => finish([SAMPLE_LOCATION]));
  expect(screen.getByLabelText('Nombre')).toHaveValue('Nuevo almacén');
  await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));
  expect(await screen.findByText('Ubicación actualizada correctamente.')).toBeInTheDocument();
  expect(useLocationStore.getState().availableLocations[0]?.name).toBe('Nuevo almacén');
});

});
