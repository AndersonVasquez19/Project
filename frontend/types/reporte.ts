export type EstadoReporteMatricula = "pendiente" | "pagada" | "anulada";

export interface ReporteMatriculaQuery {
  desde?: string;
  hasta?: string;
  curso_id?: string;
  estado?: EstadoReporteMatricula;
}

export interface ReporteMatriculaRow {
  id: string;
  fecha_matricula: string;
  estado: EstadoReporteMatricula;
  estudiante_dni: string;
  estudiante: string;
  curso_codigo: string;
  curso: string;
  total: string;
  pagado: string;
  saldo: string;
  credito: string;
}

export interface ReporteMatriculas {
  presentacion: {
    nombre: string;
    nombre_reportes: string;
    pie: string;
    moneda: "PEN" | "USD";
  };
  filtros: {
    desde: string | null;
    hasta: string | null;
    curso_id: string | null;
    estado: EstadoReporteMatricula | null;
  };
  resumen: {
    matriculas: number;
    total: string;
    pagado: string;
    saldo: string;
  };
  data: ReporteMatriculaRow[];
}
