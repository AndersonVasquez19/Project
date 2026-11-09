import { apiClient } from "@/services/apiClient";
import type {
  ReporteMatriculaQuery,
  ReporteMatriculas,
} from "@/types/reporte";

export async function getMatriculas(
  query: ReporteMatriculaQuery,
): Promise<ReporteMatriculas> {
  const { data } = await apiClient.get<ReporteMatriculas>(
    "/reportes/matriculas",
    { params: query },
  );
  return data;
}
