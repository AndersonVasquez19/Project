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
import { create, update } from "@/services/serviciosService";
import type { ServicioInput, ServicioTecnologico } from "@/types/servicio";

const servicioSchema = z.object({
  codigo: z.string().trim().min(1, "Ingresa el código.").max(40),
  nombre: z.string().trim().min(1, "Ingresa el nombre.").max(120),
  categoria: z.string().max(80, "La categoría no debe superar 80 caracteres."),
});

type ServicioFormValues = z.infer<typeof servicioSchema>;

type ServicioFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  servicio?: ServicioTecnologico;
};

export function ServicioForm({ open, onOpenChange, servicio }: ServicioFormProps) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (input: ServicioInput) =>
      servicio ? update(servicio.id, input) : create(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["servicios-tecnologicos"] });
      notify.success(servicio ? "Servicio actualizado." : "Servicio creado.");
      onOpenChange(false);
    },
  });
  const resetMutation = mutation.reset;
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ServicioFormValues>({
    resolver: zodResolver(servicioSchema),
    defaultValues: { codigo: "", nombre: "", categoria: "" },
  });

  useEffect(() => {
    reset({
      codigo: servicio?.codigo ?? "",
      nombre: servicio?.nombre ?? "",
      categoria: servicio?.categoria ?? "",
    });
    resetMutation();
  }, [open, reset, resetMutation, servicio]);

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={servicio ? "Editar servicio tecnológico" : "Nuevo servicio tecnológico"}
      description="Completa la información del servicio. Los cambios se guardarán en el catálogo administrativo."
      submitLabel="Guardar servicio"
      pending={mutation.isPending}
      error={
        mutation.error
          ? getApiErrorMessage(
              mutation.error,
              "No se pudo guardar el servicio. Inténtalo nuevamente.",
            )
          : null
      }
      onSubmit={handleSubmit((values) =>
        mutation.mutate({ ...values, categoria: values.categoria.trim() || null }),
      )}
    >
      <FormField label="Código" required error={errors.codigo?.message}>
        {(control) => <Input maxLength={40} {...control} {...register("codigo")} />}
      </FormField>
      <FormField label="Nombre" required error={errors.nombre?.message}>
        {(control) => <Input maxLength={120} {...control} {...register("nombre")} />}
      </FormField>
      <FormField label="Categoría" error={errors.categoria?.message}>
        {(control) => <Input maxLength={80} {...control} {...register("categoria")} />}
      </FormField>
    </FormDialog>
  );
}
