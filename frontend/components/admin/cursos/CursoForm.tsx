"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
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

type CursoFormValues = z.infer<typeof cursoSchema>;

type CursoFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  curso?: Curso;
};

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data: unknown = error.response?.data;
    if (typeof data === "object" && data !== null && "message" in data) {
      const { message } = data;
      if ("errors" in data && typeof data.errors === "object" && data.errors !== null) {
        const messages = Object.values(data.errors).flatMap((value) =>
          Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [],
        );
        if (messages.length > 0) return messages.join(" ");
      }
      if (typeof message === "string") return message;
      if (Array.isArray(message) && message.every((item) => typeof item === "string")) return message.join(" ");
    }
  }

  return "No se pudo guardar el curso. Inténtalo nuevamente.";
}

export function CursoForm({ open, onOpenChange, curso }: CursoFormProps) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (input: CursoInput) =>
      curso ? update(curso.id, input) : create(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["cursos"] });
      onOpenChange(false);
    },
  });
  const resetMutation = mutation.reset;
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CursoFormValues>({
    resolver: zodResolver(cursoSchema),
    defaultValues: {
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
    },
  });

  useEffect(() => {
    reset({
      codigo: curso?.codigo ?? "",
      nombre: curso?.nombre ?? "",
      descripcion: curso?.descripcion ?? "",
      categoria: curso?.categoria ?? "tecnologia",
      duracion_horas: curso ? String(curso.duracion_horas) : "",
      precio: curso?.precio ?? "",
      modalidad: curso?.modalidad ?? "presencial",
      horario: curso?.horario ?? "",
      cupos_maximos: curso ? String(curso.cupos_maximos) : "30",
      estado: curso?.estado ?? "activo",
    });
    resetMutation();
  }, [curso, open, reset, resetMutation]);

  function onSubmit(values: CursoFormValues) {
    mutation.mutate({
      ...values,
      duracion_horas: Number(values.duracion_horas),
      precio: Number(values.precio),
      cupos_maximos: Number(values.cupos_maximos),
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!mutation.isPending) {
          onOpenChange(nextOpen);
        }
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{curso ? "Editar curso" : "Nuevo curso"}</DialogTitle>
          <DialogDescription>
            Completa los datos administrativos del curso. Su publicación pública
            es un proceso separado.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          {mutation.error && (
            <p
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
              role="alert"
            >
              {getErrorMessage(mutation.error)}
            </p>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="curso-codigo">Código</Label>
              <Input id="curso-codigo" maxLength={20} aria-invalid={Boolean(errors.codigo)} {...register("codigo")} />
              {errors.codigo && <p className="text-sm text-red-700">{errors.codigo.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="curso-nombre">Nombre del curso</Label>
              <Input id="curso-nombre" maxLength={150} aria-invalid={Boolean(errors.nombre)} {...register("nombre")} />
              {errors.nombre && <p className="text-sm text-red-700">{errors.nombre.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="curso-categoria">Categoría</Label>
              <select id="curso-categoria" className="admin-select" {...register("categoria")}>
                <option value="tecnologia">Tecnología</option>
                <option value="educacion">Educación</option>
                <option value="salud">Salud</option>
                <option value="gestion">Gestión</option>
                <option value="otros">Otros</option>
              </select>
              {errors.categoria && <p className="text-sm text-red-700">{errors.categoria.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="curso-modalidad">Modalidad</Label>
              <select id="curso-modalidad" className="admin-select" {...register("modalidad")}>
                <option value="presencial">Presencial</option>
                <option value="virtual">Virtual</option>
                <option value="hibrido">Híbrido</option>
              </select>
              {errors.modalidad && <p className="text-sm text-red-700">{errors.modalidad.message}</p>}
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="curso-descripcion">Descripción</Label>
              <textarea
                id="curso-descripcion"
                rows={4}
                className="admin-textarea"
                aria-invalid={Boolean(errors.descripcion)}
                {...register("descripcion")}
              />
              {errors.descripcion && <p className="text-sm text-red-700">{errors.descripcion.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="curso-duracion">Duración (horas)</Label>
              <Input id="curso-duracion" inputMode="numeric" aria-invalid={Boolean(errors.duracion_horas)} {...register("duracion_horas")} />
              {errors.duracion_horas && <p className="text-sm text-red-700">{errors.duracion_horas.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="curso-precio">Precio (S/)</Label>
              <Input id="curso-precio" inputMode="decimal" aria-invalid={Boolean(errors.precio)} {...register("precio")} />
              {errors.precio && <p className="text-sm text-red-700">{errors.precio.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="curso-horario">Horario</Label>
              <Input id="curso-horario" maxLength={100} aria-invalid={Boolean(errors.horario)} {...register("horario")} />
              {errors.horario && <p className="text-sm text-red-700">{errors.horario.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="curso-cupos">Cupos máximos</Label>
              <Input id="curso-cupos" inputMode="numeric" aria-invalid={Boolean(errors.cupos_maximos)} {...register("cupos_maximos")} />
              {errors.cupos_maximos && <p className="text-sm text-red-700">{errors.cupos_maximos.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="curso-estado">Estado</Label>
              <select id="curso-estado" className="admin-select" {...register("estado")}>
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
                <option value="archivado">Archivado</option>
              </select>
              {errors.estado && <p className="text-sm text-red-700">{errors.estado.message}</p>}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" disabled={mutation.isPending} onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending || isSubmitting}>
              {mutation.isPending ? "Guardando..." : "Guardar curso"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
