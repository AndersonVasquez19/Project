import type { Prisma } from '@prisma/client';

type AuditClient = Pick<Prisma.TransactionClient, 'audit_logs'>;

export type AuditEntry = {
  userId: bigint;
  action: string;
  modelType: string;
  modelId?: bigint | null;
  /** Valores JSON-serializables; los BigInt deben pasarse como texto. */
  changes?: Prisma.InputJsonObject;
};

/**
 * Registra un evento en `audit_logs`. Pásale el cliente de la transacción en
 * curso para que el evento y el cambio se confirmen (o se revierten) juntos.
 * Nunca incluyas contraseñas, tokens ni datos personales innecesarios.
 */
export async function writeAudit(
  client: AuditClient,
  entry: AuditEntry,
): Promise<void> {
  await client.audit_logs.create({
    data: {
      user_id: entry.userId,
      action: entry.action,
      model_type: entry.modelType,
      model_id: entry.modelId ?? null,
      ...(entry.changes === undefined ? {} : { changes: entry.changes }),
      created_at: new Date(),
    },
  });
}
