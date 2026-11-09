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
import { create, update } from "@/services/cursosService";
import type { Curso, CursoInput } from "@/types/curso";

const integerField = z
  .string()
  .trim()
  .regex(/^[1-9]\d*$/, "Ingresa un número entero mayor que cero.")
  .refine((value) => Number(value) <= 2147483647, "El valor es demasiado grande.");

const cursoSchema = z.object({
  codigo: z.string().trim().min(1, "Ingresa el código.").max(20),
  nombre: z.string().trim().min(1, "Ingresa el nombre.").max(150),
  descripcion: z.string().trim().min(1, "Ingresa la descripción."),
  categoria: z.enum(["tecnologia", "educacion", "salud", "gestion", "otros"]),
  duracion_horas: integerField,
  precio: z
    .string()
    .trim()
    .regex(/^\d{1,8}(?:\.\d{1,2})?$/, "Usa un precio de hasta 8 enteros y 2 decimales.")
    .refine((value) => Number(value) <= 99999999.99, "El precio es demasiado alto."),
  modalidad: z.enum(["presencial", "virtual", "hibrido"]),
  horario: z.string().trim().min(1, "Ingresa el horario.").max(100),
  cupos_maximos: integerField,
  estado: z.enum(["activo", "inactivo", "archivado"]),
});

type FormValues = z.infer<typeof cursoSchema>;

const EMPTY: FormValues = {
  codigo: "",
  nombre: "",
  descripcion: "",
  categoria: "tecnologia",
  duracion_horas: "",
  precio: "",
  modalidad: "presencial",
  horario: "",
  cupos_maximos: "30",
  estado: "activo",
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  curso?: Curso;
};

export function CursoForm({ open, onOpenChange, curso }: Props) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (input: CursoInput) =>
      curso ? update(curso.id, input) : create(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["cursos"] });
      notify.success(curso ? "Curso actualizado." : "Curso creado.");
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
    resolver: zodResolver(cursoSchema),
    defaultValues: EMPTY,
  });

  useEffect(() => {
    reset(
      curso
        ? {
            codigo: curso.codigo,
            nombre: curso.nombre,
            descripcion: curso.descripcion,
            categoria: curso.categoria,
            duracion_horas: String(curso.duracion_horas),
            precio: curso.precio,
            modalidad: curso.modalidad,
            horario: curso.horario,
            cupos_maximos: String(curso.cupos_maximos),
            estado: curso.estado,
          }
        : EMPTY,
    );
    resetMutation();
  }, [curso, open, reset, resetMutation]);

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={curso ? "Editar curso" : "Nuevo curso"}
      description="Completa los datos administrativos del curso. Su publicación pública es un proceso separado."
      submitLabel="Guardar curso"
      className="max-h-[90vh] overflow-y-auto sm:max-w-2xl"
      pending={mutation.isPending}
      error={
        mutation.error
          ? getApiErrorMessage(mutation.error, "No se pudo guardar el curso.")
          : null
      }
      onSubmit={handleSubmit((values) =>
        mutation.mutate({
          ...values,
          duracion_horas: Number(values.duracion_horas),
          precio: Number(values.precio),
          cupos_maximos: Number(values.cupos_maximos),
        }),
      )}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Código" required error={errors.codigo?.message}>
          {(control) => <Input maxLength={20} {...control} {...register("codigo")} />}
        </FormField>
        <FormField label="Nombre del curso" required error={errors.nombre?.message}>
          {(control) => <Input maxLength={150} {...control} {...register("nombre")} />}
        </FormField>
        <FormField label="Categoría" error={errors.categoria?.message}>
          {(control) => (
            <select className="admin-select" {...control} {...register("categoria")}>
              <option value="tecnologia">Tecnología</option>
              <option value="educacion">Educación</option>
              <option value="salud">Salud</option>
              <option value="gestion">Gestión</option>
              <option value="otros">Otros</option>
            </select>
          )}
        </FormField>
        <FormField label="Modalidad" error={errors.modalidad?.message}>
          {(control) => (
            <select className="admin-select" {...control} {...register("modalidad")}>
              <option value="presencial">Presencial</option>
              <option value="virtual">Virtual</option>
              <option value="hibrido">Híbrido</option>
            </select>
          )}
        </FormField>
        <div className="sm:col-span-2">
          <FormField label="Descripción" required error={errors.descripcion?.message}>
            {(control) => (
              <textarea
                rows={4}
                className="admin-textarea"
                {...control}
                {...register("descripcion")}
              />
            )}
          </FormField>
        </div>
        <FormField label="Duración (horas)" required error={errors.duracion_horas?.message}>
          {(control) => (
            <Input inputMode="numeric" {...control} {...register("duracion_horas")} />
          )}
        </FormField>
        <FormField label="Precio (S/)" required error={errors.precio?.message}>
          {(control) => <Input inputMode="decimal" {...control} {...register("precio")} />}
        </FormField>
        <FormField label="Horario" required error={errors.horario?.message}>
          {(control) => <Input maxLength={100} {...control} {...register("horario")} />}
        </FormField>
        <FormField label="Cupos máximos" required error={errors.cupos_maximos?.message}>
          {(control) => (
            <Input inputMode="numeric" {...control} {...register("cupos_maximos")} />
          )}
        </FormField>
        <FormField label="Estado" error={errors.estado?.message}>
          {(control) => (
            <select className="admin-select" {...control} {...register("estado")}>
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
              <option value="archivado">Archivado</option>
            </select>
          )}
        </FormField>
      </div>
    </FormDialog>
  );
}
