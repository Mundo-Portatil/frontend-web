import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '../../../../services/api/axiosInstance';
import {
  createLocation,
  listActiveLocations,
  listLocations,
  updateLocation,
} from './locationService';

vi.mock('../../../../services/api/axiosInstance', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}));

describe('locationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lists every location without an active filter', async () => {
    const expected = [{ id: 'location-1' }];
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: expected });

    const result = await listLocations();

    expect(apiClient.get).toHaveBeenCalledWith('/locations', { params: undefined });
    expect(result).toEqual(expected);
  });

  it('lists only active locations through GET /locations?active=true', async () => {
    const expected = [{ id: 'location-1', active: true }];
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: expected });

    const result = await listActiveLocations();

    expect(apiClient.get).toHaveBeenCalledWith('/locations', { params: { active: true } });
    expect(result).toEqual(expected);
  });

  it('creates locations with POST /locations', async () => {
    const payload = { name: 'Puesto 105', type: 'PUESTO' as const };
    const expected = { id: 'location-2', ...payload, active: true };
    vi.mocked(apiClient.post).mockResolvedValueOnce({ data: expected });

    const result = await createLocation(payload);

    expect(apiClient.post).toHaveBeenCalledWith('/locations', payload);
    expect(result).toEqual(expected);
  });

  it('updates locations with PATCH /locations/:id', async () => {
    const payload = { name: 'Puesto Renombrado' };
    const expected = { id: 'location-3', name: payload.name, active: true };
    vi.mocked(apiClient.patch).mockResolvedValueOnce({ data: expected });

    const result = await updateLocation('location-3', payload);

    expect(apiClient.patch).toHaveBeenCalledWith('/locations/location-3', payload);
    expect(result).toEqual(expected);
  });

  it('deactivates locations through PATCH active=false', async () => {
    const expected = { id: 'location-4', active: false };
    vi.mocked(apiClient.patch).mockResolvedValueOnce({ data: expected });

    const result = await updateLocation('location-4', { active: false });

    expect(apiClient.patch).toHaveBeenCalledWith('/locations/location-4', { active: false });
    expect(result).toEqual(expected);
  });
});


it('bounds and cancels optional location lookups used by inventory', async () => {
  const signal = new AbortController().signal;
  vi.mocked(apiClient.get).mockResolvedValueOnce({ data: [] });
  await listLocations(undefined, { signal, timeout: 10_000 });
  expect(apiClient.get).toHaveBeenCalledWith('/locations', { params: undefined, signal, timeout: 10_000 });
});
