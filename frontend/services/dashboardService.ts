import { apiClient } from "@/services/apiClient";
import type { DashboardSummary } from "@/types/dashboard";

export async function getSummary(): Promise<DashboardSummary> {
  const { data } = await apiClient.get<DashboardSummary>("/dashboard");
  return data;
}
