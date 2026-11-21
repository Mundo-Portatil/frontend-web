import { apiClient } from '../../../services/api/axiosInstance';
import type { BarcodeLabelItem, UnifiedInboundPayload, UnifiedInboundResponse } from '../hardwareModels';

export async function inboundInventory(payload: UnifiedInboundPayload): Promise<UnifiedInboundResponse> {
  const { data } = await apiClient.post<UnifiedInboundResponse>('/inventory/inbound', payload);
  return data;
}

export async function getBarcodeLabelsByModel(payload: {
  catalogId: string;
  locationId?: string;
  copies: number;
}): Promise<BarcodeLabelItem[]> {
  const { data } = await apiClient.post<BarcodeLabelItem[]>('/inventory/barcode-labels/by-model', payload);
  return data;
}
