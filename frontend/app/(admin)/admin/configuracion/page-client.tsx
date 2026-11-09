"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Save, Settings2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getApiErrorMessage } from "@/lib/api-error";
import { getAll, save } from "@/services/configuracionService";
import type { ConfiguracionKey } from "@/types/configuracion";

export function ConfiguracionPageClient({
  canView,
  canEdit,
}: {
  canView: boolean;
  canEdit: boolean;
}) {
  const queryClient = useQueryClient();
  const settings = useQuery({
    queryKey: ["configuracion"],
    queryFn: getAll,
    enabled: canView,
  });
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});
  const [savedKey, setSavedKey] = useState<string | null>(null);
  const mutation = useMutation({
    mutationFn: ({ key, value }: { key: ConfiguracionKey; value: string }) =>
      save(key, value),
    onSuccess: async (result) => {
      setSavedKey(result.key);
      setEditedValues((current) => ({
        ...current,
        [result.key]: result.value,
      }));
      await queryClient.invalidateQueries({ queryKey: ["configuracion"] });
    },
  });
  const error = settings.error ?? mutation.error;

  if (!canView) {
    return (
      <section className="rounded-2xl border border-[#E2E8F0] bg-white p-8 text-center">
        <h1 className="text-xl font-bold text-[#172B3A]">Acceso restringido</h1>
        <p className="mt-2 text-sm text-[#64748B]">
          No tienes permiso para consultar la configuración.
        </p>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-4xl space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#176B9A]">
          Sistema y seguridad
        </p>
        <h1 className="mt-1 flex items-center gap-2 text-2xl font-bold tracking-tight text-[#172B3A] sm:text-3xl">
          <Settings2 aria-hidden="true" /> Configuración
        </h1>
        <p className="mt-2 text-sm leading-6 text-[#64748B]">
          Ajusta opciones de presentación seguras. Las credenciales y secretos del servidor no se muestran aquí.
        </p>
      </header>

      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {getApiErrorMessage(error, "No fue posible cargar o guardar la configuración.")}
        </p>
      )}

      {settings.isPending ? (
        <p className="rounded-2xl border border-[#E2E8F0] bg-white px-4 py-10 text-center text-sm text-[#64748B]" role="status">
          Cargando configuración…
        </p>
      ) : (
        <div className="space-y-3">
          {settings.data?.data.map((item) => (
            <form
              key={item.key}
              className="flex flex-col gap-4 rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-[0_2px_10px_rgba(10,37,64,0.04)] sm:flex-row sm:items-end"
              onSubmit={(event) => {
                event.preventDefault();
                setSavedKey(null);
                mutation.mutate({
                  key: item.key,
                  value: editedValues[item.key] ?? item.value,
                });
              }}
            >
              <div className="min-w-0 flex-1 space-y-2">
                <Label htmlFor={`setting-${item.key}`}>{item.label}</Label>
                <p className="text-xs text-[#64748B]">{item.description}</p>
                {item.key === "system.timezone" || item.key === "system.currency" ? (
                  <select
                    id={`setting-${item.key}`}
                    className="admin-select"
                    disabled={!canEdit}
                      value={editedValues[item.key] ?? item.value}
                    onChange={(event) =>
                        setEditedValues((current) => ({
                        ...current,
                        [item.key]: event.currentTarget.value,
                      }))
                    }
                  >
                    {(item.key === "system.timezone"
                      ? ["America/Lima", "UTC"]
                      : ["PEN", "USD"]
                    ).map((value) => (
                      <option key={value} value={value}>{value}</option>
                    ))}
                  </select>
                ) : (
                  <Input
                    id={`setting-${item.key}`}
                    maxLength={255}
                    disabled={!canEdit}
                    value={editedValues[item.key] ?? item.value}
                    onChange={(event) =>
                      setEditedValues((current) => ({
                        ...current,
                        [item.key]: event.currentTarget.value,
                      }))
                    }
                  />
                )}
              </div>
              {canEdit && (
                <Button
                  type="submit"
                  variant="outline"
                  disabled={mutation.isPending}
                >
                  <Save aria-hidden="true" />
                  {mutation.isPending
                    ? "Guardando…"
                    : savedKey === item.key
                      ? "Guardado"
                      : "Guardar"}
                </Button>
              )}
            </form>
          ))}
        </div>
      )}
    </section>
  );
}
