import { apiClient } from '../../../services/api/axiosInstance';
import type { BarcodeLabel } from '../hardwareModels';
import type { ModelBarcodeLabel, ModelBarcodeLabelsInput } from '../barcodeLabelModels';
export async function getBatchLabels(hardwareItemIds: string[]): Promise<BarcodeLabel[]> { return (await apiClient.post<BarcodeLabel[]>('/hardware-items/barcode-labels/batch', { hardwareItemIds })).data; }
export async function getModelLabels(payload: ModelBarcodeLabelsInput): Promise<ModelBarcodeLabel[]> {
  return (await apiClient.post<ModelBarcodeLabel[]>('/inventory/barcode-labels/by-model', payload)).data;
}
