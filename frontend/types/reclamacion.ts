export interface ReclamacionHistorial {
  id: string;
  evento: string;
  actor: string;
  nota: string | null;
  created_at: string;
}

export interface Reclamacion {
  id: string;
  numero: string;
  estado: string;
  recibida_at: string;
  fecha_limite: string;
  nombres: string;
  apellidos: string;
  tipo_documento: string;
  numero_documento: string;
  telefono: string;
  email: string;
  canal_respuesta: string;
  tipo: string;
  bien_tipo: string | null;
  bien_descripcion: string | null;
  monto_bien: string | null;
  detalle: string;
  pedido: string;
  respuesta: string | null;
  respondida_at: string | null;
  responsable_id: string | null;
  responsable: { id: string; nombre: string } | null;
  historial: ReclamacionHistorial[];
}

export interface ReclamacionesResponse {
  data: Reclamacion[];
  total: number;
  limite: number;
}
