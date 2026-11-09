"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { ErrorBanner } from "@/components/admin/error-banner";
import { METODOS_PAGO, PagoForm } from "@/components/admin/matriculas/PagoForm";
import { PageHeader } from "@/components/admin/page-header";
import { getApiErrorMessage } from "@/lib/api-error";
import { formatDateTime, formatMoney } from "@/lib/format";
import { notify } from "@/lib/toast";
import { createPayment, getPayments } from "@/services/matriculasService";

function metodoLabel(value: string): string {
  return METODOS_PAGO.find((item) => item.value === value)?.label ?? value;
}

export function MatriculaPagosPageClient({
  matriculaId,
  canRegister,
}: {
  matriculaId: string;
  canRegister: boolean;
}) {
  const queryClient = useQueryClient();
  // Cambiar la clave vacía el formulario solo cuando el pago se registró.
  const [formKey, setFormKey] = useState(0);
  const paymentsQuery = useQuery({
    queryKey: ["matricula-pagos", matriculaId],
    queryFn: () => getPayments(matriculaId),
  });
  const paymentMutation = useMutation({
    mutationFn: (input: Parameters<typeof createPayment>[1]) =>
      createPayment(matriculaId, input),
    onSuccess: async () => {
      setFormKey((key) => key + 1);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["matricula-pagos", matriculaId] }),
        queryClient.invalidateQueries({ queryKey: ["matriculas"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
      ]);
      notify.success("Pago registrado.");
    },
  });
  const snapshot = paymentsQuery.data;

  return (
    <section className="mx-auto max-w-5xl space-y-6">
      <Link
        className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 text-sm font-medium hover:bg-muted"
        href="/admin/matriculas"
      >
        <ArrowLeft aria-hidden="true" /> Volver a matrículas
      </Link>

      {paymentsQuery.error && (
        <ErrorBanner
          message={getApiErrorMessage(paymentsQuery.error, "No se pudieron cargar los pagos.")}
          onRetry={() => void paymentsQuery.refetch()}
        />
      )}
      {paymentMutation.error && (
        <ErrorBanner
          message={getApiErrorMessage(paymentMutation.error, "No se pudo registrar el pago.")}
        />
      )}

      {paymentsQuery.isPending ? (
        <div
          className="rounded-2xl border border-horus-line bg-white px-4 py-12 text-center text-sm text-horus-muted"
          role="status"
        >
          Cargando cuenta de matrícula…
        </div>
      ) : snapshot ? (
        <>
          <PageHeader
            eyebrow={"Matrícula · " + snapshot.matricula.curso.codigo}
            title="Pagos y saldo"
            description={
              snapshot.matricula.estudiante.nombres +
              " " +
              snapshot.matricula.estudiante.apellidos +
              " · " +
              snapshot.matricula.curso.nombre
            }
          />

          <dl className="grid gap-3 sm:grid-cols-3">
            {[
              ["Costo", snapshot.resumen.total],
              ["Pagado", snapshot.resumen.pagado],
              ["Saldo", snapshot.resumen.saldo],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-2xl border border-horus-line bg-white p-5 shadow-[0_2px_10px_rgba(10,37,64,0.04)]"
              >
                <dt className="text-sm text-horus-muted">{label}</dt>
                <dd className="mt-1 text-2xl font-bold text-horus-ink">
                  {formatMoney(value)}
                </dd>
              </div>
            ))}
          </dl>

          {snapshot.resumen.credito !== "0" && (
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              El historial registra un crédito de {formatMoney(snapshot.resumen.credito)}.
              No se aceptan nuevos pagos mientras exista este excedente.
            </p>
          )}

          {canRegister && Number(snapshot.resumen.saldo) > 0 && (
            <PagoForm
              key={formKey}
              saldo={Number(snapshot.resumen.saldo)}
              pending={paymentMutation.isPending}
              onSubmit={(input) => paymentMutation.mutate(input)}
            />
          )}

          <section className="overflow-hidden rounded-2xl border border-horus-line bg-white shadow-[0_2px_10px_rgba(10,37,64,0.04)]">
            <div className="border-b border-horus-line px-5 py-4">
              <h2 className="font-semibold text-horus-ink">Historial de pagos</h2>
            </div>
            {snapshot.data.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-horus-muted">
                Aún no hay pagos registrados.
              </p>
            ) : (
              <ul className="divide-y divide-horus-line">
                {snapshot.data.map((payment) => (
                  <li
                    key={payment.id}
                    className="flex flex-col gap-1 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-medium text-horus-ink">
                        {metodoLabel(payment.metodo)} · {formatDateTime(payment.pagado_at)}
                      </p>
                      <p className="text-sm text-horus-muted">
                        {[payment.referencia, payment.nota].filter(Boolean).join(" · ") ||
                          "Sin referencia"}
                      </p>
                    </div>
                    <span className="font-semibold text-horus-ink">
                      {formatMoney(payment.monto)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      ) : null}
    </section>
  );
}
