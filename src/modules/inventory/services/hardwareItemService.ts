import { apiClient } from '../../../services/api/axiosInstance';
import type { BatchInboundInput, HardwareItem, SerialValidation } from '../hardwareModels';
export async function batchInbound(payload: BatchInboundInput): Promise<HardwareItem[]> { return (await apiClient.post<HardwareItem[]>('/hardware-items/batch-inbound', payload)).data; }
export async function validateSerials(serialNumbers: string[]): Promise<SerialValidation> { return (await apiClient.post<SerialValidation>('/hardware-items/validate-serials', { serialNumbers })).data; }
export async function scanHardware(code: string, signal?: AbortSignal): Promise<HardwareItem> { return (await apiClient.get<HardwareItem>(`/hardware-items/scan/${encodeURIComponent(code)}`, { signal })).data; }
export async function attachChildren(id: string, childIds: string[]): Promise<HardwareItem> { return (await apiClient.post<HardwareItem>(`/hardware-items/${encodeURIComponent(id)}/children`, { childIds })).data; }
export async function detachChild(id: string, childId: string): Promise<HardwareItem> { return (await apiClient.delete<HardwareItem>(`/hardware-items/${encodeURIComponent(id)}/children/${encodeURIComponent(childId)}`)).data; }
