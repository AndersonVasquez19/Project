"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { FormDialog } from "@/components/admin/form-dialog";
import { FormField } from "@/components/admin/form-field";
import { RolePicker } from "@/components/admin/usuarios/RolePicker";
import { Input } from "@/components/ui/input";
import { getApiErrorMessage } from "@/lib/api-error";
import { notify } from "@/lib/toast";
import { createUser } from "@/services/usuariosService";

/** Mismas reglas que CreateUsuarioDto del backend. */
export const createUsuarioSchema = z.object({
  name: z.string().trim().min(2, "Escribe al menos 2 caracteres.").max(255),
  email: z.string().trim().email("Ingresa un correo válido.").max(255),
  password: z
    .string()
    .min(12, "La contraseña debe tener al menos 12 caracteres.")
    .max(72, "La contraseña no debe superar 72 caracteres."),
  roles: z.array(z.string()).min(1, "Selecciona al menos un rol para esta cuenta."),
});

type FormValues = z.infer<typeof createUsuarioSchema>;

const EMPTY: FormValues = { name: "", email: "", password: "", roles: [] };

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roleOptions: string[];
};

export function CreateUsuarioDialog({ open, onOpenChange, roleOptions }: Props) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: createUser,
    onSuccess: async (usuario) => {
      await queryClient.invalidateQueries({ queryKey: ["usuarios"] });
      notify.success("Usuario " + usuario.name + " creado.");
      onOpenChange(false);
    },
  });
  const resetMutation = mutation.reset;
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(createUsuarioSchema),
    defaultValues: EMPTY,
  });

  useEffect(() => {
    reset(EMPTY);
    resetMutation();
  }, [open, reset, resetMutation]);

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Crear cuenta de usuario"
      description="La contraseña inicial debe tener al menos 12 caracteres. Entrégala al usuario por un canal seguro."
      submitLabel="Crear usuario"
      pendingLabel="Creando…"
      className="max-h-[90vh] overflow-y-auto sm:max-w-lg"
      pending={mutation.isPending}
      error={
        mutation.error
          ? getApiErrorMessage(mutation.error, "No fue posible crear el usuario.")
          : null
      }
      onSubmit={handleSubmit((values) => mutation.mutate(values))}
    >
      <FormField label="Nombre" required error={errors.name?.message}>
        {(control) => <Input maxLength={255} {...control} {...register("name")} />}
      </FormField>
      <FormField label="Correo electrónico" required error={errors.email?.message}>
        {(control) => (
          <Input
            type="email"
            autoComplete="email"
            maxLength={255}
            {...control}
            {...register("email")}
          />
        )}
      </FormField>
      <FormField label="Contraseña inicial" required error={errors.password?.message}>
        {(control) => (
          <Input
            type="password"
            autoComplete="new-password"
            maxLength={72}
            {...control}
            {...register("password")}
          />
        )}
      </FormField>
      <Controller
        control={control}
        name="roles"
        render={({ field }) => (
          <RolePicker
            options={roleOptions}
            value={field.value}
            onChange={field.onChange}
            error={errors.roles?.message}
          />
        )}
      />
    </FormDialog>
  );
}
