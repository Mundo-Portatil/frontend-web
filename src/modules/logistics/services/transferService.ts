import { apiClient } from '../../../services/api/axiosInstance';
import type { CreateDirectTransferInput, Transfer, TransferDetail, TransferQuery } from '../models';
export async function listTransfers(query: TransferQuery = {}, signal?: AbortSignal): Promise<Transfer[]> {
  const { data } = await apiClient.get<Transfer[]>('/transfers', { params: query, signal, timeout: 15_000 });
  return data;
}
export async function getTransferDetail(idOrCode: string, signal?: AbortSignal): Promise<TransferDetail> {
  const { data } = await apiClient.get<TransferDetail>(`/transfers/${encodeURIComponent(idOrCode.trim())}`, { signal, timeout: 15_000 });
  return data;
}
export async function createDirectTransfer(input: CreateDirectTransferInput): Promise<TransferDetail> {
  const { data } = await apiClient.post<TransferDetail>('/transfers/direct', input, { timeout: 30_000 });
  return data;
}
