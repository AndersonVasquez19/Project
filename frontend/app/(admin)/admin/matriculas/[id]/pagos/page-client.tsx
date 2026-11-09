"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CreditCard } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getApiErrorMessage } from "@/lib/api-error";
import {
  createPayment,
  getPayments,
} from "@/services/matriculasService";
import type { MetodoPago } from "@/types/matricula";

const METHODS: { value: MetodoPago; label: string }[] = [
  { value: "efectivo", label: "Efectivo" },
  { value: "transferencia", label: "Transferencia" },
  { value: "tarjeta", label: "Tarjeta" },
  { value: "yape_plin", label: "Yape / Plin" },
  { value: "otro", label: "Otro" },
];

function money(value: string): string {
  return `S/ ${Number(value).toFixed(2)}`;
}

function displayDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString("es-PE", { dateStyle: "medium", timeStyle: "short" });
}

export function MatriculaPagosPageClient({
  matriculaId,
  canRegister,
}: {
  matriculaId: string;
  canRegister: boolean;
}) {
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<MetodoPago>("efectivo");
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const paymentsQuery = useQuery({
    queryKey: ["matricula-pagos", matriculaId],
    queryFn: () => getPayments(matriculaId),
  });
  const paymentMutation = useMutation({
    mutationFn: () =>
      createPayment(matriculaId, {
        monto: amount,
        metodo: method,
        referencia: reference.trim() || null,
        nota: note.trim() || null,
      }),
    onSuccess: async () => {
      setAmount("");
      setReference("");
      setNote("");
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["matricula-pagos", matriculaId],
        }),
        queryClient.invalidateQueries({ queryKey: ["matriculas"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
      ]);
    },
  });
  const recordError = paymentMutation.error;
  const queryError = paymentsQuery.error;
  const snapshot = paymentsQuery.data;

  return (
    <section className="mx-auto max-w-5xl space-y-6">
      <Link
        className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 text-sm font-medium hover:bg-muted"
        href="/admin/matriculas"
      >
          <ArrowLeft aria-hidden="true" /> Volver a matrículas
      </Link>

      {queryError && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {getApiErrorMessage(queryError, "No se pudieron cargar los pagos.")}
        </p>
      )}
      {recordError && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {getApiErrorMessage(recordError, "No se pudo registrar el pago.")}
        </p>
      )}

      {paymentsQuery.isPending ? (
        <div className="rounded-2xl border border-[#E2E8F0] bg-white px-4 py-12 text-center text-sm text-[#64748B]">
          Cargando cuenta de matrícula…
        </div>
      ) : snapshot ? (
        <>
          <header>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#176B9A]">
              Matrícula · {snapshot.matricula.curso.codigo}
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#172B3A] sm:text-3xl">
              Pagos y saldo
            </h1>
            <p className="mt-2 text-sm text-[#64748B]">
              {snapshot.matricula.estudiante.nombres}{" "}
              {snapshot.matricula.estudiante.apellidos} ·{" "}
              {snapshot.matricula.curso.nombre}
            </p>
          </header>

          <div className="grid gap-3 sm:grid-cols-3">
            {[
              ["Costo", snapshot.resumen.total],
              ["Pagado", snapshot.resumen.pagado],
              ["Saldo", snapshot.resumen.saldo],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-[0_2px_10px_rgba(10,37,64,0.04)]"
              >
                <p className="text-sm text-[#64748B]">{label}</p>
                <p className="mt-1 text-2xl font-bold text-[#172B3A]">
                  {money(value)}
                </p>
              </div>
            ))}
          </div>

          {snapshot.resumen.credito !== "0" && (
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              El historial registra un crédito de {money(snapshot.resumen.credito)}.
              No se aceptan nuevos pagos mientras exista este excedente.
            </p>
          )}

          {canRegister && Number(snapshot.resumen.saldo) > 0 && (
            <form
              className="space-y-4 rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-[0_2px_10px_rgba(10,37,64,0.04)]"
              onSubmit={(event) => {
                event.preventDefault();
                paymentMutation.mutate();
              }}
            >
              <div className="flex items-center gap-2">
                <CreditCard aria-hidden="true" className="text-[#176B9A]" />
                <h2 className="font-semibold text-[#172B3A]">Registrar abono</h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="pago-monto">Monto (S/)</Label>
                  <Input
                    id="pago-monto"
                    type="number"
                    min="0.01"
                    max={snapshot.resumen.saldo}
                    step="0.01"
                    required
                    value={amount}
                    onChange={(event) => setAmount(event.currentTarget.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pago-metodo">Método</Label>
                  <select
                    id="pago-metodo"
                    className="admin-select"
                    value={method}
                    onChange={(event) =>
                      setMethod(event.currentTarget.value as MetodoPago)
                    }
                  >
                    {METHODS.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pago-referencia">Referencia (opcional)</Label>
                  <Input
                    id="pago-referencia"
                    maxLength={100}
                    value={reference}
                    onChange={(event) => setReference(event.currentTarget.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pago-nota">Nota (opcional)</Label>
                  <Input
                    id="pago-nota"
                    maxLength={500}
                    value={note}
                    onChange={(event) => setNote(event.currentTarget.value)}
                  />
                </div>
              </div>
              <Button
                type="submit"
                className="admin-btn-primary"
                disabled={paymentMutation.isPending || !amount}
              >
                {paymentMutation.isPending ? "Registrando…" : "Registrar pago"}
              </Button>
            </form>
          )}

          <section className="overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-[0_2px_10px_rgba(10,37,64,0.04)]">
            <div className="border-b border-[#E2E8F0] px-5 py-4">
              <h2 className="font-semibold text-[#172B3A]">Historial de pagos</h2>
            </div>
            {snapshot.data.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-[#64748B]">
                Aún no hay pagos registrados.
              </p>
            ) : (
              <ul className="divide-y divide-[#E2E8F0]">
                {snapshot.data.map((payment) => (
                  <li
                    key={payment.id}
                    className="flex flex-col gap-1 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-medium text-[#172B3A]">
                        {payment.metodo.replace("_", " ")} ·{" "}
                        {displayDate(payment.pagado_at)}
                      </p>
                      <p className="text-sm text-[#64748B]">
                        {[payment.referencia, payment.nota]
                          .filter(Boolean)
                          .join(" · ") || "Sin referencia"}
                      </p>
                    </div>
                    <span className="font-semibold text-[#172B3A]">
                      {money(payment.monto)}
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
