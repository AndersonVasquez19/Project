export interface AuditLog {
  id: string;
  action: string;
  model_type: string | null;
  model_id: string | null;
  created_at: string;
  actor: string;
}

export interface AuditLogsResponse {
  data: AuditLog[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
