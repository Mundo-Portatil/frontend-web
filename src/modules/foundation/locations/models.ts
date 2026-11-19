export type LocationType = 'ALMACEN_CENTRAL' | 'PUESTO';

export interface Location {
  id: string;
  name: string;
  type: LocationType;
  active: boolean;
  createdAt: string;
}

export interface CreateLocationInput {
  name: string;
  type?: LocationType;
}

export interface UpdateLocationInput {
  name?: string;
  active?: boolean;
}
