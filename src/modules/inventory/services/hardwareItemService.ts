import { apiClient } from '../../../services/api/axiosInstance';
import type { HardwareItem, SerialValidation } from '../hardwareModels';
export async function validateSerials(serialNumbers: string[]): Promise<SerialValidation> { return (await apiClient.post<SerialValidation>('/hardware-items/validate-serials', { serialNumbers })).data; }
export async function scanHardware(code: string, signal?: AbortSignal): Promise<HardwareItem> { return (await apiClient.get<HardwareItem>(`/hardware-items/scan/${encodeURIComponent(code)}`, { signal })).data; }
