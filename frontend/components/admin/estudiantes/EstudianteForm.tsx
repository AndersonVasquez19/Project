"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { FormDialog } from "@/components/admin/form-dialog";
import { FormField } from "@/components/admin/form-field";
import { Input } from "@/components/ui/input";
import { getApiErrorMessage } from "@/lib/api-error";
import { notify } from "@/lib/toast";
import { create, update } from "@/services/estudiantesService";
import type { Estudiante, EstudianteInput } from "@/types/estudiante";

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

function isCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

const estudianteSchema = z.object({
  dni: z.string().regex(/^\d{8}$/, "El DNI debe tener exactamente 8 dígitos."),
  nombres: z.string().trim().min(1, "Ingresa los nombres.").max(100),
  apellidos: z.string().trim().min(1, "Ingresa los apellidos.").max(100),
  email: z.union([
    z.literal(""),
    z.string().trim().email("Ingresa un correo válido.").max(150),
  ]),
  telefono: z.string().max(20, "El teléfono no debe superar 20 caracteres."),
  fecha_nacimiento: z
    .string()
    .refine(
      (value) => !value || (isCalendarDate(value) && value <= todayUtc()),
      "La fecha de nacimiento no puede ser futura.",
    ),
  direccion: z.string().max(255, "La dirección no debe superar 255 caracteres."),
  estado: z.enum(["activo", "inactivo"]),
});

type FormValues = z.infer<typeof estudianteSchema>;

const EMPTY: FormValues = {
  dni: "",
  nombres: "",
  apellidos: "",
  email: "",
  telefono: "",
  fecha_nacimiento: "",
  direccion: "",
  estado: "activo",
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  estudiante?: Estudiante;
};

export function EstudianteForm({ open, onOpenChange, estudiante }: Props) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (input: EstudianteInput) =>
      estudiante ? update(estudiante.id, input) : create(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["estudiantes"] });
      notify.success(estudiante ? "Estudiante actualizado." : "Estudiante registrado.");
      onOpenChange(false);
    },
  });
  const resetMutation = mutation.reset;
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(estudianteSchema),
    defaultValues: EMPTY,
  });

  useEffect(() => {
    reset(
      estudiante
        ? {
            dni: estudiante.dni,
            nombres: estudiante.nombres,
            apellidos: estudiante.apellidos,
            email: estudiante.email ?? "",
            telefono: estudiante.telefono ?? "",
            fecha_nacimiento: estudiante.fecha_nacimiento?.slice(0, 10) ?? "",
            direccion: estudiante.direccion ?? "",
            estado: estudiante.estado,
          }
        : EMPTY,
    );
    resetMutation();
  }, [estudiante, open, reset, resetMutation]);

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={estudiante ? "Editar estudiante" : "Nuevo estudiante"}
      description="Registra los datos personales y el estado del estudiante."
      submitLabel="Guardar estudiante"
      className="max-h-[90vh] overflow-y-auto sm:max-w-2xl"
      pending={mutation.isPending}
      error={
        mutation.error
          ? getApiErrorMessage(mutation.error, "No se pudo guardar el estudiante.")
          : null
      }
      onSubmit={handleSubmit((values) =>
        mutation.mutate({
          ...values,
          email: values.email.trim() || null,
          telefono: values.telefono.trim() || null,
          fecha_nacimiento: values.fecha_nacimiento || null,
          direccion: values.direccion.trim() || null,
        }),
      )}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="DNI" required error={errors.dni?.message}>
          {(control) => (
            <Input inputMode="numeric" maxLength={8} {...control} {...register("dni")} />
          )}
        </FormField>
        <FormField label="Estado">
          {(control) => (
            <select className="admin-select" {...control} {...register("estado")}>
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
            </select>
          )}
        </FormField>
        <FormField label="Nombres" required error={errors.nombres?.message}>
          {(control) => <Input maxLength={100} {...control} {...register("nombres")} />}
        </FormField>
        <FormField label="Apellidos" required error={errors.apellidos?.message}>
          {(control) => <Input maxLength={100} {...control} {...register("apellidos")} />}
        </FormField>
        <FormField label="Correo electrónico" error={errors.email?.message}>
          {(control) => (
            <Input type="email" maxLength={150} {...control} {...register("email")} />
          )}
        </FormField>
        <FormField label="Teléfono" error={errors.telefono?.message}>
          {(control) => (
            <Input type="tel" maxLength={20} {...control} {...register("telefono")} />
          )}
        </FormField>
        <FormField label="Fecha de nacimiento" error={errors.fecha_nacimiento?.message}>
          {(control) => (
            <Input
              type="date"
              max={todayUtc()}
              {...control}
              {...register("fecha_nacimiento")}
            />
          )}
        </FormField>
        <div className="sm:col-span-2">
          <FormField label="Dirección" error={errors.direccion?.message}>
            {(control) => (
              <Input maxLength={255} {...control} {...register("direccion")} />
            )}
          </FormField>
        </div>
      </div>
    </FormDialog>
  );
}
