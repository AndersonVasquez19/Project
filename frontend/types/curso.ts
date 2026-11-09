export type CursoCategoria =
  | "tecnologia"
  | "educacion"
  | "salud"
  | "gestion"
  | "otros";

export type CursoModalidad = "presencial" | "virtual" | "hibrido";
export type CursoEstado = "activo" | "inactivo" | "archivado";

export interface Curso {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string;
  categoria: CursoCategoria;
  duracion_horas: number;
  precio: string;
  modalidad: CursoModalidad;
  horario: string;
  cupos_maximos: number;
  cupos_disponibles: number;
  estado: CursoEstado;
  created_at: string | null;
  updated_at: string | null;
  deleted_at: string | null;
}

export type CursoInput = Omit<
  Curso,
  | "id"
  | "created_at"
  | "updated_at"
  | "deleted_at"
  | "cupos_disponibles"
  | "precio"
> & { precio: number };

export interface CursosQuery {
  page: number;
  limit: number;
  search?: string;
  categoria?: CursoCategoria;
  estado?: CursoEstado;
  eliminados?: boolean;
}

export interface CursosPage {
  data: Curso[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
