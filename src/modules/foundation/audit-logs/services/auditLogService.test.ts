import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '../../../../services/api/axiosInstance';
import { listAuditLogs } from './auditLogService';

vi.mock('../../../../services/api/axiosInstance', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

describe('auditLogService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('applies the contract defaults when no filters are provided', async () => {
    const expected = { items: [], total: 0, page: 1, limit: 20 };
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: expected });

    const result = await listAuditLogs();

    expect(apiClient.get).toHaveBeenCalledWith('/audit-logs', {
      params: { page: 1, limit: 20 },
    });
    expect(result).toEqual(expected);
  });

  it('trims filters and clamps pagination values to the contract limits', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: { items: [], total: 0, page: 1, limit: 100 },
    });

    await listAuditLogs({
      module: '  users  ',
      userId: '  59673086-e125-4a1c-b549-f243e19e42d4  ',
      page: 0,
      limit: 500,
    });

    expect(apiClient.get).toHaveBeenCalledWith('/audit-logs', {
      params: {
        module: 'users',
        userId: '59673086-e125-4a1c-b549-f243e19e42d4',
        page: 1,
        limit: 100,
      },
    });
  });

  it('omits blank filters', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: { items: [], total: 0, page: 2, limit: 10 },
    });

    await listAuditLogs({ module: '   ', userId: '', page: 2, limit: 10 });

    expect(apiClient.get).toHaveBeenCalledWith('/audit-logs', {
      params: { page: 2, limit: 10 },
    });
  });
});
