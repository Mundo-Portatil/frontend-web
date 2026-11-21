import { apiClient } from '../../../services/api/axiosInstance';
import type { BarcodeLabelItem } from '../hardwareModels';

export async function getBatchLabels(hardwareItemIds: string[]): Promise<BarcodeLabelItem[]> {
  const { data } = await apiClient.post<BarcodeLabelItem[]>('/hardware-items/barcode-labels/batch', {
    hardwareItemIds,
  });
  return data;
}

export async function getSingleBarcodeLabel(id: string, signal?: AbortSignal): Promise<BarcodeLabelItem> {
  const { data } = await apiClient.get<BarcodeLabelItem>(`/hardware-items/${encodeURIComponent(id)}/barcode-label`, {
    signal,
  });
  return data;
}
