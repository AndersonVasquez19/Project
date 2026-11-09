export type EstadoMatricula = "pendiente" | "pagada" | "anulada";

export interface MatriculaRelacionEstudiante {
  id: string;
  dni: string;
  nombres: string;
  apellidos: string;
  deleted_at: string | null;
}

export interface MatriculaRelacionCurso {
  id: string;
  codigo: string;
  nombre: string;
  estado: string;
  cupos_disponibles: number;
  deleted_at: string | null;
}

export interface Matricula {
  id: string;
  estudiante_id: string;
  curso_id: string;
  fecha_matricula: string;
  estado: EstadoMatricula;
  monto_pagado: string | null;
  monto_total: string | null;
  observaciones: string | null;
  created_at: string | null;
  updated_at: string | null;
  deleted_at: string | null;
  estudiante: MatriculaRelacionEstudiante | null;
  curso: MatriculaRelacionCurso | null;
}

export interface MatriculaInput {
  estudiante_id: string;
  curso_id: string;
  fecha_matricula: string;
  estado: EstadoMatricula;
  observaciones: string | null;
}

export interface MatriculasQuery {
  page: number;
  limit: number;
  search?: string;
  estado?: EstadoMatricula;
  curso_id?: string;
  eliminados?: boolean;
}

export interface MatriculasPage {
  data: Matricula[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export type MetodoPago =
  | "efectivo"
  | "transferencia"
  | "tarjeta"
  | "yape_plin"
  | "otro";

export interface MatriculaPago {
  id: string;
  matricula_id: string;
  monto: string;
  metodo: string;
  referencia: string | null;
  nota: string | null;
  pagado_at: string;
  registrado_por: string | null;
  created_at: string;
}

export interface MatriculaPagosResponse {
  matricula: {
    id: string;
    fecha_matricula: string;
    estado: EstadoMatricula;
    estudiante: {
      id: string;
      nombres: string;
      apellidos: string;
      dni: string;
    };
    curso: { id: string; codigo: string; nombre: string };
  };
  resumen: {
    total: string;
    pagado: string;
    saldo: string;
    credito: string;
  };
  data: MatriculaPago[];
}

export interface CreateMatriculaPagoInput {
  monto: string;
  metodo: MetodoPago;
  referencia?: string | null;
  nota?: string | null;
  fecha_pago?: string;
}
