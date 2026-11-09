import { z } from "zod";

/** La API respondió con un formato distinto al contrato que espera el panel. */
export class ApiContractError extends Error {
  constructor(
    readonly resource: string,
    readonly issues: string,
  ) {
    super(`La respuesta de ${resource} no tiene el formato esperado.`);
    this.name = "ApiContractError";
  }
}

/**
 * Valida una respuesta de la API contra su esquema. Si no coincide, lanza
 * ApiContractError (se ve como error de carga) en vez de dejar que un campo
 * ausente rompa la pantalla más adelante con un undefined.
 */
export function parseResponse<S extends z.ZodType>(
  schema: S,
  data: unknown,
  resource: string,
): z.output<S> {
  const result = schema.safeParse(data);
  if (result.success) {
    return result.data;
  }

  const issues = result.error.issues
    .slice(0, 5)
    .map((issue) => `${issue.path.join(".") || "(raíz)"}: ${issue.message}`)
    .join("; ");
  console.error(`Contrato de ${resource} incumplido: ${issues}`);
  throw new ApiContractError(resource, issues);
}

/** Metadatos de paginación comunes a los listados del backend. */
export const pageMetaSchema = z.object({
  page: z.number(),
  limit: z.number(),
  total: z.number(),
  totalPages: z.number(),
});

/** Respuesta paginada estándar: { data, meta }. */
export function pageSchema<T extends z.ZodType>(item: T) {
  return z.object({
    data: z.array(item),
    meta: pageMetaSchema,
  });
}

/** Fecha o fecha-hora como texto ISO, o null. */
export const nullableText = z.string().nullable();
