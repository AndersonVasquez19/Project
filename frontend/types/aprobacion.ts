export type EstadoAprobacion = "pendiente" | "aprobada" | "rechazada";

export interface Aprobacion {
  id: string;
  titulo: string;
  tipo: string;
  descripcion: string | null;
  estado: string;
  comentario: string | null;
  referencia: string | null;
  created_at: string | null;
  updated_at: string | null;
  solicitante: { id: string; nombre: string } | null;
  aprobador: { id: string; nombre: string } | null;
}

export interface AprobacionesResponse {
  data: Aprobacion[];
  limite: number;
}

export interface CreateAprobacionInput {
  titulo: string;
  tipo?: string;
  descripcion?: string | null;
  referencia?: string | null;
}

export interface DecisionAprobacionInput {
  estado: "aprobada" | "rechazada";
  comentario?: string | null;
}
