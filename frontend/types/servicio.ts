export interface ServicioTecnologico {
  id: string;
  identificador_publico: string;
  codigo: string;
  nombre: string;
  categoria: string | null;
  estado: string;
  revision: number;
  created_at: string | null;
  updated_at: string | null;
}

export interface ServiciosPage {
  data: ServicioTecnologico[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ServiciosQuery {
  page: number;
  limit: number;
  search?: string;
}

export interface ServicioInput {
  codigo: string;
  nombre: string;
  categoria: string | null;
}
