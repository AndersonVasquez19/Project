export type EstadoCotizacion =
  | "recibida"
  | "en_seguimiento"
  | "cotizada"
  | "cerrada"
  | "descartada";

export interface Cotizacion {
  id: string;
  codigo: string;
  recibida_at: string;
  servicio: string;
  necesidad_cliente: string;
  contacto_nombre: string;
  contacto_email: string | null;
  contacto_telefono: string | null;
  estado: EstadoCotizacion;
  responsable_id: string | null;
  responsable: { id: string; nombre: string } | null;
  ultimo_seguimiento_at: string | null;
  proximo_seguimiento: string | null;
  revision: number;
  origen: string;
}

export interface CotizacionesResponse {
  data: Cotizacion[];
  total: number;
  limite: number;
}

export interface CreateCotizacionInput {
  contacto_nombre: string;
  contacto_email?: string | null;
  contacto_telefono?: string | null;
  necesidad_cliente: string;
}

export interface UpdateCotizacionInput {
  revision: number;
  estado: EstadoCotizacion;
  nota?: string | null;
}
