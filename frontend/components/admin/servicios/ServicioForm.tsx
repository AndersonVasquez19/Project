"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data: unknown = error.response?.data;
    if (typeof data === "object" && data !== null && "message" in data) {
      const { message } = data;
      if (typeof message === "string") {
        return message;
      }
      if (Array.isArray(message) && message.every((item) => typeof item === "string")) {
        return message.join(" ");
      }
    }
  }

  return "No se pudo guardar el servicio. Inténtalo nuevamente.";
}

export function ServicioForm({
  open,
  onOpenChange,
  servicio,
}: ServicioFormProps) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (input: ServicioInput) =>
      servicio ? update(servicio.id, input) : create(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["servicios-tecnologicos"],
      });
      onOpenChange(false);
    },
  });
  const resetMutation = mutation.reset;
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
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

  function onSubmit(values: ServicioFormValues) {
    mutation.mutate({
      ...values,
      categoria: values.categoria.trim() || null,
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {servicio ? "Editar servicio tecnológico" : "Nuevo servicio tecnológico"}
          </DialogTitle>
          <DialogDescription>
            Completa la información del servicio. Los cambios se guardarán en el
            catálogo administrativo.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          {mutation.error && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
              {getErrorMessage(mutation.error)}
            </p>
          )}

          <div className="space-y-2">
            <Label htmlFor="servicio-codigo">Código</Label>
            <Input
              id="servicio-codigo"
              maxLength={40}
              aria-invalid={Boolean(errors.codigo)}
              {...register("codigo")}
            />
            {errors.codigo && (
              <p className="text-sm text-red-700">{errors.codigo.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="servicio-nombre">Nombre</Label>
            <Input
              id="servicio-nombre"
              maxLength={120}
              aria-invalid={Boolean(errors.nombre)}
              {...register("nombre")}
            />
            {errors.nombre && (
              <p className="text-sm text-red-700">{errors.nombre.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="servicio-categoria">Categoría</Label>
            <Input
              id="servicio-categoria"
              maxLength={80}
              aria-invalid={Boolean(errors.categoria)}
              {...register("categoria")}
            />
            {errors.categoria && (
              <p className="text-sm text-red-700">{errors.categoria.message}</p>
            )}
          </div>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              disabled={mutation.isPending}
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending || isSubmitting}>
              {mutation.isPending ? "Guardando..." : "Guardar servicio"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
