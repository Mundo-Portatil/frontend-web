import { create } from 'zustand';
import type { Location } from '../modules/foundation/locations/models';

interface LocationState {
  activeLocation: Location | null;
  /** Active locations available to the operational context selector. */
  availableLocations: Location[];
  selectLocation: (location: Location | null) => void;
  clearLocation: () => void;
  /** Replaces the available list, preserving a still-valid selection. */
  setAvailableLocations: (locations: Location[]) => void;
  /** Adds or updates one location; removes it when it is no longer active. */
  upsertLocation: (location: Location) => void;
  /** Clears the session-scoped location context. */
  reset: () => void;
}

function normalizeAvailableLocations(locations: Location[]): Location[] {
  const unique = new Map<string, Location>();
  for (const location of locations) {
    if (location.active) {
      unique.set(location.id, location);
    }
  }
  return [...unique.values()];
}

function resolveActiveLocation(
  activeLocation: Location | null,
  availableLocations: Location[],
): Location | null {
  if (!activeLocation) {
    return null;
  }
  return availableLocations.find((location) => location.id === activeLocation.id) ?? null;
}

/** In-memory operational location context; persistence is explicitly out of scope. */
export const useLocationStore = create<LocationState>()((set) => ({
  activeLocation: null,
  availableLocations: [],

  selectLocation: (location) => set({ activeLocation: location }),

  clearLocation: () => set({ activeLocation: null }),

  setAvailableLocations: (locations) =>
    set((state) => {
      const availableLocations = normalizeAvailableLocations(locations);
      return {
        availableLocations,
        activeLocation: resolveActiveLocation(state.activeLocation, availableLocations),
      };
    }),

  upsertLocation: (location) =>
    set((state) => {
      const existingIndex = state.availableLocations.findIndex((item) => item.id === location.id);
      let availableLocations: Location[];

      if (!location.active) {
        availableLocations = state.availableLocations.filter((item) => item.id !== location.id);
      } else if (existingIndex === -1) {
        availableLocations = [...state.availableLocations, location];
      } else {
        availableLocations = state.availableLocations.map((item) =>
          item.id === location.id ? location : item,
        );
      }

      return {
        availableLocations,
        activeLocation:
          state.activeLocation?.id === location.id
            ? location.active
              ? location
              : null
            : state.activeLocation,
      };
    }),

  reset: () => set({ activeLocation: null, availableLocations: [] }),
}));
