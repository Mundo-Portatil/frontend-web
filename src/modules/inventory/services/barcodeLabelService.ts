import { apiClient } from '../../../services/api/axiosInstance';
import type { BarcodeLabel } from '../hardwareModels';
export async function getBatchLabels(hardwareItemIds: string[]): Promise<BarcodeLabel[]> { return (await apiClient.post<BarcodeLabel[]>('/hardware-items/barcode-labels/batch', { hardwareItemIds })).data; }
