import { apiClient } from '../../../services/api/axiosInstance';
import type { UnifiedInboundInput, UnifiedInboundResult } from '../unifiedInboundModels';

/** No client location or legacy stock write: this endpoint owns the atomic receipt. */
export async function receiveInventory(payload: UnifiedInboundInput): Promise<UnifiedInboundResult> {
  const { data } = await apiClient.post<UnifiedInboundResult>('/inventory/inbound', payload);
  return data;
}
