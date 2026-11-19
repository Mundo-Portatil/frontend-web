export interface AuditLog {
  id: string;
  userId: string | null;
  action: string;
  module: string;
  payload: Record<string, unknown>;
  ipAddress: string | null;
  createdAt: string;
}

export interface AuditLogPage {
  items: AuditLog[];
  total: number;
  page: number;
  limit: number;
}

export interface AuditLogFilters {
  module?: string;
  userId?: string;
  page?: number;
  limit?: number;
}
