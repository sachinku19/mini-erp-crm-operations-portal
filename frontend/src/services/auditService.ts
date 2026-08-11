import { api } from "./api";

export interface AuditLog {
  id: string;
  user_id: string | null;
  user_email: string;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  description: string;
  metadata: any | null;
  created_at: string;
}

export interface GetAuditLogsQuery {
  page?: number;
  limit?: number;
  search?: string;
  action?: string;
  userEmail?: string;
}

export const auditService = {
  async getAuditLogs(query: GetAuditLogsQuery = {}) {
    const params = new URLSearchParams();
    if (query.page) params.append("page", String(query.page));
    if (query.limit) params.append("limit", String(query.limit));
    if (query.search) params.append("search", query.search);
    if (query.action) params.append("action", query.action);
    if (query.userEmail) params.append("userEmail", query.userEmail);

    const queryString = params.toString() ? `?${params.toString()}` : "";
    return api.get<AuditLog[]>(`/v1/audit-logs${queryString}`);
  },
};
