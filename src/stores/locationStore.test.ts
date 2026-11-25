import { beforeEach, describe, expect, it } from 'vitest';
import type { Location } from '../modules/foundation/locations/models';
import { useLocationStore } from './locationStore';

const LOCATION: Location = {
  id: 'location-1',
  name: 'Almacén Central',
  type: 'ALMACEN_CENTRAL',
  active: true,
  createdAt: '2026-11-14T20:00:00.000Z',
};

describe('locationStore', () => {
  beforeEach(() => {
    useLocationStore.getState().reset();
  });

  it('starts without an active location', () => {
    expect(useLocationStore.getState().activeLocation).toBeNull();
  });

  it('exposes the selected location to other modules', () => {
    useLocationStore.getState().selectLocation(LOCATION);

    expect(useLocationStore.getState().activeLocation).toEqual(LOCATION);
  });

  it('updates the active location', () => {
    useLocationStore.getState().selectLocation(LOCATION);
    const updated = { ...LOCATION, name: 'Almacén Central Renombrado' };

    useLocationStore.getState().selectLocation(updated);

    expect(useLocationStore.getState().activeLocation).toEqual(updated);
  });

  it('clears the active location', () => {
    useLocationStore.getState().selectLocation(LOCATION);

    useLocationStore.getState().clearLocation();

    expect(useLocationStore.getState().activeLocation).toBeNull();
  });

  it('keeps a valid active location when the available list is refreshed', () => {
    useLocationStore.getState().selectLocation(LOCATION);

    useLocationStore.getState().setAvailableLocations([
      { ...LOCATION, name: 'Almacén Central Renombrado' },
    ]);

    expect(useLocationStore.getState().activeLocation?.name).toBe('Almacén Central Renombrado');
  });

  it('clears a stale active location when it is not available anymore', () => {
    useLocationStore.getState().selectLocation(LOCATION);

    useLocationStore.getState().setAvailableLocations([]);

    expect(useLocationStore.getState().activeLocation).toBeNull();
  });

  it('adds and updates an available location without reloading the selector', () => {
    useLocationStore.getState().upsertLocation(LOCATION);
    expect(useLocationStore.getState().availableLocations).toEqual([LOCATION]);

    const renamed = { ...LOCATION, name: 'Almacén Renombrado' };
    useLocationStore.getState().upsertLocation(renamed);

    expect(useLocationStore.getState().availableLocations).toEqual([renamed]);
  });

  it('removes an inactive location and clears it when selected', () => {
    useLocationStore.getState().upsertLocation(LOCATION);
    useLocationStore.getState().selectLocation(LOCATION);

    useLocationStore.getState().upsertLocation({ ...LOCATION, active: false });

    expect(useLocationStore.getState().availableLocations).toEqual([]);
    expect(useLocationStore.getState().activeLocation).toBeNull();
  });
});
