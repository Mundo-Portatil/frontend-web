import { apiClient } from '../../../services/api/axiosInstance';
import type { HardwareLifecycle, HardwareListQuery, HardwareListResult } from '../hardwareReadModels';

export interface AvailableSerialItem {
  id: string;
  serialNumber: string;
  catalogId: string;
  locationId: string;
  salePrice: number | null;
  createdAt: string;
}

export async function listHardwareUnits(query: HardwareListQuery, signal?: AbortSignal): Promise<HardwareListResult> {
  const { data } = await apiClient.get<HardwareListResult>('/hardware-items', { params: query, signal });
  return data;
}

export async function getHardwareLifecycle(id: string, signal?: AbortSignal): Promise<HardwareLifecycle> {
  const { data } = await apiClient.get<HardwareLifecycle>(`/hardware-items/${encodeURIComponent(id)}/lifecycle`, { signal });
  return data;
}

export async function getAvailableSerials(catalogId: string, locationId?: string, signal?: AbortSignal): Promise<AvailableSerialItem[]> {
  const { data } = await apiClient.get<AvailableSerialItem[]>('/hardware-items/available-serials', {
    params: { catalogId, locationId },
    signal,
  });
  return data;
}
