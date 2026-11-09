export type EstadoEstudiante = "activo" | "inactivo";

export interface Estudiante {
  id: string;
  dni: string;
  nombres: string;
  apellidos: string;
  email: string | null;
  telefono: string | null;
  fecha_nacimiento: string | null;
  direccion: string | null;
  estado: EstadoEstudiante;
  created_at: string | null;
  updated_at: string | null;
  deleted_at: string | null;
}

export type EstudianteInput = Omit<
  Estudiante,
  "id" | "created_at" | "updated_at" | "deleted_at"
>;

export interface EstudiantesQuery {
  page: number;
  limit: number;
  search?: string;
  estado?: EstadoEstudiante;
  eliminados?: boolean;
}

export interface EstudiantesPage {
  data: Estudiante[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
