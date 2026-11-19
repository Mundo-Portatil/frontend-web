import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useLocationStore } from '../../../../stores/locationStore';
import { LocationSelector } from './LocationSelector';
import * as locationService from '../services/locationService';

vi.mock('../services/locationService', () => ({
  listActiveLocations: vi.fn(),
  listLocations: vi.fn(),
  createLocation: vi.fn(),
  updateLocation: vi.fn(),
}));

const LOCATION = {
  id: 'location-1',
  name: 'Almacén Central',
  type: 'ALMACEN_CENTRAL' as const,
  active: true,
  createdAt: '2026-11-14T20:00:00.000Z',
};

describe('LocationSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useLocationStore.getState().reset();
  });

  it('shows a loading state while active locations are being fetched', () => {
    vi.mocked(locationService.listActiveLocations).mockReturnValueOnce(new Promise(() => {}));

    render(<LocationSelector />);

    expect(screen.getByRole('status')).toHaveTextContent('Cargando ubicaciones…');
  });

  it('shows an empty state when there are no active locations', async () => {
    vi.mocked(locationService.listActiveLocations).mockResolvedValueOnce([]);

    render(<LocationSelector />);

    expect(await screen.findByText('Sin ubicaciones activas')).toBeInTheDocument();
  });

  it('keeps the selected location synchronized with the location store', async () => {
    vi.mocked(locationService.listActiveLocations).mockResolvedValueOnce([LOCATION]);

    render(<LocationSelector />);
    const user = userEvent.setup();
    const select = await screen.findByRole('combobox', { name: 'Ubicación operativa' });

    await user.selectOptions(select, LOCATION.id);

    expect(useLocationStore.getState().activeLocation).toEqual(LOCATION);
  });

  it('clears a stale selection that is no longer an active location', async () => {
    useLocationStore.getState().selectLocation({ ...LOCATION, id: 'inactive-location' });
    vi.mocked(locationService.listActiveLocations).mockResolvedValueOnce([LOCATION]);

    render(<LocationSelector />);

    await waitFor(() => {
      expect(useLocationStore.getState().activeLocation).toBeNull();
    });
  });

  it('allows clearing the operative location with the all-locations option', async () => {
    useLocationStore.getState().selectLocation(LOCATION);
    useLocationStore.getState().setAvailableLocations([LOCATION]);
    vi.mocked(locationService.listActiveLocations).mockResolvedValueOnce([LOCATION]);

    render(<LocationSelector />);
    const user = userEvent.setup();
    const select = await screen.findByRole('combobox', { name: 'Ubicación operativa' });

    await user.selectOptions(select, '');

    expect(useLocationStore.getState().activeLocation).toBeNull();
  });

  it('reflects a newly available location without fetching again', async () => {
    vi.mocked(locationService.listActiveLocations).mockResolvedValueOnce([LOCATION]);

    render(<LocationSelector />);
    await screen.findByRole('combobox', { name: 'Ubicación operativa' });

    const created = { ...LOCATION, id: 'location-2', name: 'Puesto 105' };
    act(() => {
      useLocationStore.getState().upsertLocation(created);
    });

    expect(screen.getByRole('option', { name: 'Puesto 105' })).toBeInTheDocument();
    expect(locationService.listActiveLocations).toHaveBeenCalledTimes(1);
  });

  it('shows the error state when active locations cannot be loaded', async () => {
    vi.mocked(locationService.listActiveLocations).mockRejectedValueOnce({
      kind: 'network',
      message: 'No se pudo establecer comunicación con el servidor. Verifica tu conexión.',
    });

    render(<LocationSelector />);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No se pudo establecer comunicación con el servidor. Verifica tu conexión.',
    );
  });
});
