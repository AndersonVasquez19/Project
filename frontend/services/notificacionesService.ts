import { apiClient } from "@/services/apiClient";
import type { NotificacionesResponse } from "@/types/notificacion";

export async function getAll(): Promise<NotificacionesResponse> {
  const { data } =
    await apiClient.get<NotificacionesResponse>("/notificaciones");
  return data;
}

export async function markRead(id: string): Promise<{ id: string; leida: true }> {
  const { data } = await apiClient.patch<{ id: string; leida: true }>(
    `/notificaciones/${encodeURIComponent(id)}/leer`,
  );
  return data;
}

export async function markAllRead(): Promise<{ actualizadas: number }> {
  const { data } = await apiClient.patch<{ actualizadas: number }>(
    "/notificaciones/leer-todas",
  );
  return data;
}
