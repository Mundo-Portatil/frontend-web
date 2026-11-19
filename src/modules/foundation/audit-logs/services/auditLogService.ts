import { apiClient } from '../../../../services/api/axiosInstance';
import type { AuditLogFilters, AuditLogPage } from '../models';

/** GET /audit-logs (ADMIN, read-only). */
export async function listAuditLogs(filters: AuditLogFilters = {}): Promise<AuditLogPage> {
  const params = {
    ...(filters.module?.trim() ? { module: filters.module.trim() } : {}),
    ...(filters.userId?.trim() ? { userId: filters.userId.trim() } : {}),
    page: Math.max(1, filters.page ?? 1),
    limit: Math.min(100, Math.max(1, filters.limit ?? 20)),
  };
  const { data } = await apiClient.get<AuditLogPage>('/audit-logs', { params });
  return data;
}
