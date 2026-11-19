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

    await user.click(await screen.findByRole('button', { name: 'Dar de baja' }));

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

    await user.click(await screen.findByRole('button', { name: 'Dar de baja' }));

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
});
