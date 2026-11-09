"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CreditCard } from "lucide-react";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { FormField } from "@/components/admin/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatMoney } from "@/lib/format";
import type { CreateMatriculaPagoInput, MetodoPago } from "@/types/matricula";

export const METODOS_PAGO: { value: MetodoPago; label: string }[] = [
  { value: "efectivo", label: "Efectivo" },
  { value: "transferencia", label: "Transferencia" },
  { value: "tarjeta", label: "Tarjeta" },
  { value: "yape_plin", label: "Yape / Plin" },
  { value: "otro", label: "Otro" },
];

function buildSchema(saldo: number) {
  return z.object({
    monto: z
      .string()
      .trim()
      .regex(/^\d{1,8}(?:\.\d{1,2})?$/, "Usa hasta 8 enteros y 2 decimales.")
      .refine((value) => Number(value) > 0, "El monto debe ser mayor que cero.")
      .refine(
        (value) => Number(value) <= saldo,
        "El monto no puede superar el saldo pendiente (" + formatMoney(saldo) + ").",
      ),
    metodo: z.enum(["efectivo", "transferencia", "tarjeta", "yape_plin", "otro"]),
    referencia: z.string().max(100, "La referencia no debe superar 100 caracteres."),
    nota: z.string().max(500, "La nota no debe superar 500 caracteres."),
  });
}

type Values = z.infer<ReturnType<typeof buildSchema>>;

type Props = {
  /** Saldo pendiente en soles (el backend rechaza abonos mayores). */
  saldo: number;
  pending: boolean;
  onSubmit: (input: CreateMatriculaPagoInput) => void;
};

const EMPTY: Values = { monto: "", metodo: "efectivo", referencia: "", nota: "" };

export function PagoForm({ saldo, pending, onSubmit }: Props) {
  const schema = useMemo(() => buildSchema(saldo), [saldo]);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: EMPTY });

  return (
    <form
      className="space-y-4 rounded-2xl border border-horus-line bg-white p-5 shadow-[0_2px_10px_rgba(10,37,64,0.04)]"
      noValidate
      onSubmit={handleSubmit((values) => {
        onSubmit({
          monto: values.monto,
          metodo: values.metodo,
          referencia: values.referencia.trim() || null,
          nota: values.nota.trim() || null,
        });
      })}
    >
      <div className="flex items-center gap-2">
        <CreditCard aria-hidden="true" className="text-horus-primary" />
        <h2 className="font-semibold text-horus-ink">Registrar abono</h2>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Monto (S/)" required error={errors.monto?.message}>
          {(control) => (
            <Input inputMode="decimal" {...control} {...register("monto")} />
          )}
        </FormField>
        <FormField label="Método">
          {(control) => (
            <select className="admin-select" {...control} {...register("metodo")}>
              {METODOS_PAGO.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          )}
        </FormField>
        <FormField label="Referencia (opcional)" error={errors.referencia?.message}>
          {(control) => (
            <Input maxLength={100} {...control} {...register("referencia")} />
          )}
        </FormField>
        <FormField label="Nota (opcional)" error={errors.nota?.message}>
          {(control) => <Input maxLength={500} {...control} {...register("nota")} />}
        </FormField>
      </div>
      <Button type="submit" className="admin-btn-primary" disabled={pending}>
        {pending ? "Registrando…" : "Registrar pago"}
      </Button>
    </form>
  );
}
