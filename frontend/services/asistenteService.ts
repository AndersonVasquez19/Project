import { apiClient } from "@/services/apiClient";
import type {
  AsistenteHistoryItem,
  AsistenteResponse,
  AsistenteStatus,
} from "@/types/asistente";

export async function getStatus(): Promise<AsistenteStatus> {
  const { data } = await apiClient.get<AsistenteStatus>("/asistente/estado");
  return data;
}

export async function sendMessage(input: {
  message: string;
  session_id: string;
  history: AsistenteHistoryItem[];
}): Promise<AsistenteResponse> {
  const { data } = await apiClient.post<AsistenteResponse>(
    "/asistente/chat",
    input,
  );
  return data;
}
