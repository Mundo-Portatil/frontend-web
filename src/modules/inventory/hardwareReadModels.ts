import type { HardwareItem, ItemStatus } from './hardwareModels';

/** Verified against the published hardware query DTO and use-case response. */
export interface HardwareListQuery {
  catalogItemId?: string;
  locationId?: string;
  categoryId?: string;
  search?: string;
  status?: ItemStatus;
  onlyParents?: boolean;
  page?: number;
  limit?: number;
}
export interface HardwareListResult {
  items: HardwareItem[];
  total: number;
  page: number;
  limit: number;
}

/** HardwareLifecycleEvent serialized over HTTP; payload intentionally remains unknown. */
export interface HardwareLifecycleEvent {
  id: string;
  action: string;
  module: string;
  timestamp: string;
  userId?: string | null;
  userName?: string | null;
  payload: unknown;
  ipAddress?: string | null;
}
export interface HardwareLifecycle {
  hardwareItemId: string;
  serialNumber: string;
  catalogName?: string;
  events: HardwareLifecycleEvent[];
}
