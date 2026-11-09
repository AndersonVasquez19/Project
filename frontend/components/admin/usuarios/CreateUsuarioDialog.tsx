"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useState } from "react";
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
import { createUser } from "@/services/usuariosService";

function errorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const body: unknown = error.response?.data;
    if (typeof body === "object" && body !== null && "message" in body) {
      const { message } = body;
      if (typeof message === "string") return message;
      if (Array.isArray(message) && message.every((item) => typeof item === "string")) {
        return message.join(" ");
      }
    }
  }
  return "No fue posible crear el usuario. Inténtalo nuevamente.";
}

export function CreateUsuarioDialog({
  open,
  onOpenChange,
  roleOptions,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roleOptions: string[];
}) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [roles, setRoles] = useState<string[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const mutation = useMutation({
    mutationFn: createUser,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["usuarios"] });
      setName("");
      setEmail("");
      setPassword("");
      setRoles([]);
      setFormError(null);
      onOpenChange(false);
    },
    onError: (error: unknown) => setFormError(errorMessage(error)),
  });

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (roles.length === 0) {
      setFormError("Selecciona al menos un rol para esta cuenta.");
      return;
    }
    setFormError(null);
    mutation.mutate({ name, email, password, roles });
  }

  function setOpen(next: boolean) {
    if (!mutation.isPending) {
      onOpenChange(next);
      if (!next) setFormError(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Crear cuenta de usuario</DialogTitle>
          <DialogDescription>
            La contraseña inicial debe tener al menos 12 caracteres. Entrégala
            al usuario por un canal seguro.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={submit}>
          <div className="space-y-2">
            <Label htmlFor="usuario-new-name">Nombre</Label>
            <Input id="usuario-new-name" value={name} onChange={(event) => setName(event.currentTarget.value)} maxLength={255} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="usuario-new-email">Correo electrónico</Label>
            <Input id="usuario-new-email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.currentTarget.value)} maxLength={255} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="usuario-new-password">Contraseña inicial</Label>
            <Input id="usuario-new-password" type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.currentTarget.value)} minLength={12} maxLength={72} required />
          </div>
          <fieldset className="space-y-2">
            <legend className="admin-label">Roles</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {roleOptions.map((role) => (
                <label key={role} className="flex items-center gap-2 rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm">
                  <input
                    type="checkbox"
                    checked={roles.includes(role)}
                    onChange={(event) => {
                      const checked = event.currentTarget.checked;
                      setRoles((current) =>
                        checked
                          ? [...current, role]
                          : current.filter((value) => value !== role),
                      );
                    }}
                  />
                  {role}
                </label>
              ))}
            </div>
          </fieldset>
          {formError && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
              {formError}
            </p>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Creando…" : "Crear usuario"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
