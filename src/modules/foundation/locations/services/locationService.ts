import { apiClient } from '../../../../services/api/axiosInstance';
import type { CreateLocationInput, Location, UpdateLocationInput } from '../models';

/** GET /locations, optionally limited to operational locations. */
export async function listLocations(active?: boolean, options?: { signal?: AbortSignal; timeout?: number }): Promise<Location[]> {
  const { data } = await apiClient.get<Location[]>('/locations', {
    params: active === undefined ? undefined : { active },
    ...options,
  });
  return data;
}

/** GET /locations?active=true. */
export function listActiveLocations(): Promise<Location[]> {
  return listLocations(true);
}

/** POST /locations (ADMIN). */
export async function createLocation(payload: CreateLocationInput): Promise<Location> {
  const { data } = await apiClient.post<Location>('/locations', payload);
  return data;
}

/** PATCH /locations/:id (ADMIN). */
export async function updateLocation(locationId: string, payload: UpdateLocationInput): Promise<Location> {
  const { data } = await apiClient.patch<Location>(`/locations/${locationId}`, payload);
  return data;
}
