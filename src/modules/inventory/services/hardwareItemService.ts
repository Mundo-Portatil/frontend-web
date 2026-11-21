import { apiClient } from '../../../services/api/axiosInstance';
import type {
  ApproveUsedPayload,
  AvailableSerial,
  HardwareItem,
  HardwareLifecycleEntry,
  HardwareLifecycleResponse,
  SerialValidationResponse,
} from '../hardwareModels';

export async function scanHardware(code: string, signal?: AbortSignal): Promise<HardwareItem> {
  const { data } = await apiClient.get<HardwareItem>(`/hardware-items/scan/${encodeURIComponent(code)}`, { signal });
  return data;
}

export async function validateSerials(serialNumbers: string[]): Promise<SerialValidationResponse> {
  const { data } = await apiClient.post<SerialValidationResponse>('/hardware-items/validate-serials', {
    serialNumbers,
  });
  return data;
}

export async function getAvailableSerials(
  params: { catalogId: string; locationId?: string },
  signal?: AbortSignal,
): Promise<AvailableSerial[]> {
  const { data } = await apiClient.get<unknown>('/hardware-items/available-serials', {
    params,
    signal,
  });
  if (Array.isArray(data)) return data as AvailableSerial[];
  if (data && typeof data === 'object' && Array.isArray((data as { items?: unknown[] }).items)) {
    return (data as { items: AvailableSerial[] }).items;
  }
  return [];
}

export async function getHardwareLifecycle(id: string, signal?: AbortSignal): Promise<HardwareLifecycleResponse> {
  const { data } = await apiClient.get<Record<string, unknown>>(`/hardware-items/${encodeURIComponent(id)}/lifecycle`, {
    signal,
  });

  const item = (data?.hardwareItem ?? data?.item ?? data) as HardwareItem;
  const rawEvents = Array.isArray(data?.lifecycle)
    ? data.lifecycle
    : Array.isArray(data?.events)
    ? data.events
    : Array.isArray(data?.logs)
    ? data.logs
    : Array.isArray(data)
    ? data
    : [];

  const lifecycle: HardwareLifecycleEntry[] = (rawEvents as Record<string, unknown>[]).map((entry, index) => {
    const user = entry.user as { name?: string } | undefined;
    const location = entry.location as { name?: string } | undefined;
    return {
      id: typeof entry.id === 'string' ? entry.id : `entry-${index}`,
      action: typeof entry.action === 'string' ? entry.action : 'EVENT',
      description: typeof entry.description === 'string' ? entry.description : undefined,
      details: typeof entry.details === 'object' ? (entry.details as Record<string, unknown>) : undefined,
      userName: typeof entry.userName === 'string' ? entry.userName : user?.name,
      locationName: typeof entry.locationName === 'string' ? entry.locationName : location?.name,
      createdAt: typeof entry.createdAt === 'string' ? entry.createdAt : undefined,
      timestamp: typeof entry.timestamp === 'string' ? entry.timestamp : typeof entry.createdAt === 'string' ? entry.createdAt : undefined,
    };
  });

  return {
    hardwareItem: item,
    lifecycle,
  };
}

export async function decommissionHardwareItem(id: string, reason: string): Promise<HardwareItem> {
  const { data } = await apiClient.patch<HardwareItem>(`/hardware-items/${encodeURIComponent(id)}/decommission`, {
    reason,
  });
  return data;
}

export async function updateHardwareItem(
  id: string,
  payload: { salePrice?: number; locationId?: string },
): Promise<HardwareItem> {
  const { data } = await apiClient.patch<HardwareItem>(`/hardware-items/${encodeURIComponent(id)}`, payload);
  return data;
}

export async function listHardwareItems(
  params: { catalogItemId?: string; status?: string; locationId?: string; limit?: number },
  signal?: AbortSignal,
): Promise<HardwareItem[]> {
  const { data } = await apiClient.get<unknown>('/hardware-items', {
    params,
    signal,
  });
  if (Array.isArray(data)) return data as HardwareItem[];
  if (data && typeof data === 'object' && Array.isArray((data as { items?: unknown[] }).items)) {
    return (data as { items: HardwareItem[] }).items;
  }
  return [];
}

export async function listPendingSecondHand(signal?: AbortSignal): Promise<HardwareItem[]> {
  const { data } = await apiClient.get<unknown>('/hardware-items', {
    params: { status: 'SEGUNDA_MANO_PENDIENTE' },
    signal,
  });
  if (Array.isArray(data)) return data as HardwareItem[];
  if (data && typeof data === 'object' && Array.isArray((data as { items?: unknown[] }).items)) {
    return (data as { items: HardwareItem[] }).items;
  }
  return [];
}

/**
 * Approve used component/hardware item.
 * NOTE: Mandatory contract requirement: payload must use `itemId`, NOT `hardwareItemId`.
 */
export async function approveUsedItem(payload: ApproveUsedPayload): Promise<HardwareItem> {
  const { data } = await apiClient.post<HardwareItem>('/hardware-items/approve-used', payload);
  return data;
}
