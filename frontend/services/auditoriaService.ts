import { apiClient } from "@/services/apiClient";
import type { AuditLogsResponse } from "@/types/audit-log";

export async function getAll(
  query: { page: number; limit: number; search?: string },
): Promise<AuditLogsResponse> {
  const { data } = await apiClient.get<AuditLogsResponse>("/auditoria", {
    params: query,
  });
  return data;
}
