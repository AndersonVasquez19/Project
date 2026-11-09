"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { getApiErrorMessage } from "@/lib/api-error";
import { create, update } from "@/services/estudiantesService";
import type { Estudiante, EstudianteInput } from "@/types/estudiante";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const estudianteSchema = z.object({
  dni: z.string().regex(/^\d{8}$/, "El DNI debe tener exactamente 8 dígitos."),
  nombres: z.string().trim().min(1, "Ingresa los nombres.").max(100),
  apellidos: z.string().trim().min(1, "Ingresa los apellidos.").max(100),
  email: z.union([z.literal(""), z.string().trim().email("Ingresa un correo válido.").max(150)]),
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
    defaultValues: {
      dni: "",
      nombres: "",
      apellidos: "",
      email: "",
      telefono: "",
      fecha_nacimiento: "",
      direccion: "",
      estado: "activo",
    },
  });

  useEffect(() => {
    reset({
      dni: estudiante?.dni ?? "",
      nombres: estudiante?.nombres ?? "",
      apellidos: estudiante?.apellidos ?? "",
      email: estudiante?.email ?? "",
      telefono: estudiante?.telefono ?? "",
      fecha_nacimiento: estudiante?.fecha_nacimiento?.slice(0, 10) ?? "",
      direccion: estudiante?.direccion ?? "",
      estado: estudiante?.estado ?? "activo",
    });
    resetMutation();
  }, [estudiante, open, reset, resetMutation]);

  function onSubmit(values: FormValues) {
    mutation.mutate({
      ...values,
      email: values.email.trim() || null,
      telefono: values.telefono.trim() || null,
      fecha_nacimiento: values.fecha_nacimiento || null,
      direccion: values.direccion.trim() || null,
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!mutation.isPending) onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {estudiante ? "Editar estudiante" : "Nuevo estudiante"}
          </DialogTitle>
          <DialogDescription>
            Registra los datos personales y el estado del estudiante.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          {mutation.error && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
              {getApiErrorMessage(mutation.error, "No se pudo guardar el estudiante.")}
            </p>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="estudiante-dni">DNI</Label>
              <Input id="estudiante-dni" inputMode="numeric" maxLength={8} aria-invalid={Boolean(errors.dni)} {...register("dni")} />
              {errors.dni && <p className="text-sm text-red-700">{errors.dni.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="estudiante-estado">Estado</Label>
              <select id="estudiante-estado" className="admin-select" {...register("estado")}>
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="estudiante-nombres">Nombres</Label>
              <Input id="estudiante-nombres" maxLength={100} aria-invalid={Boolean(errors.nombres)} {...register("nombres")} />
              {errors.nombres && <p className="text-sm text-red-700">{errors.nombres.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="estudiante-apellidos">Apellidos</Label>
              <Input id="estudiante-apellidos" maxLength={100} aria-invalid={Boolean(errors.apellidos)} {...register("apellidos")} />
              {errors.apellidos && <p className="text-sm text-red-700">{errors.apellidos.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="estudiante-email">Correo electrónico</Label>
              <Input id="estudiante-email" type="email" maxLength={150} aria-invalid={Boolean(errors.email)} {...register("email")} />
              {errors.email && <p className="text-sm text-red-700">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="estudiante-telefono">Teléfono</Label>
              <Input id="estudiante-telefono" type="tel" maxLength={20} aria-invalid={Boolean(errors.telefono)} {...register("telefono")} />
              {errors.telefono && <p className="text-sm text-red-700">{errors.telefono.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="estudiante-fecha-nacimiento">Fecha de nacimiento</Label>
              <Input id="estudiante-fecha-nacimiento" type="date" max={todayUtc()} aria-invalid={Boolean(errors.fecha_nacimiento)} {...register("fecha_nacimiento")} />
              {errors.fecha_nacimiento && <p className="text-sm text-red-700">{errors.fecha_nacimiento.message}</p>}
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="estudiante-direccion">Dirección</Label>
              <Input id="estudiante-direccion" maxLength={255} aria-invalid={Boolean(errors.direccion)} {...register("direccion")} />
              {errors.direccion && <p className="text-sm text-red-700">{errors.direccion.message}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" disabled={mutation.isPending} onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="admin-btn-primary" disabled={mutation.isPending}>
              {mutation.isPending ? "Guardando..." : "Guardar estudiante"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
