export interface Notificacion {
  id: string;
  titulo: string;
  mensaje: string;
  tipo: string;
  leida: boolean;
  vinculo: string | null;
  created_at: string | null;
}

export interface NotificacionesResponse {
  data: Notificacion[];
  no_leidas: number;
}
