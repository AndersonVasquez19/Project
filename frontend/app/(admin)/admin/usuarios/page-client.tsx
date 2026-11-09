"use client";

import {
  keepPreviousData,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import axios from "axios";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useDeferredValue, useState } from "react";
import { UsuarioForm } from "@/components/admin/usuarios/UsuarioForm";
import { CreateUsuarioDialog } from "@/components/admin/usuarios/CreateUsuarioDialog";
import { UsuarioTable } from "@/components/admin/usuarios/UsuarioTable";
import { SearchInput } from "@/components/admin/search-input";
import { Button } from "@/components/ui/button";
import { getAll } from "@/services/usuariosService";
import type { Usuario, UsuarioUpdateResult } from "@/types/usuario";

type UsuariosPageClientProps = { permissions: string[] };

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data: unknown = error.response?.data;
    if (typeof data === "object" && data !== null && "message" in data) {
      const { message } = data;
      if (typeof message === "string") return message;
      if (Array.isArray(message) && message.every((item) => typeof item === "string")) {
        return message.join(" ");
      }
    }
  }
  return "No fue posible cargar los usuarios. Inténtalo nuevamente.";
}

export function UsuariosPageClient({ permissions }: UsuariosPageClientProps) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editingUsuario, setEditingUsuario] = useState<Usuario>();
  const deferredSearch = useDeferredValue(search.trim());

  const usuariosQuery = useQuery({
    queryKey: ["usuarios", pagination.pageIndex, pagination.pageSize, deferredSearch],
    queryFn: () =>
      getAll({
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
        search: deferredSearch || undefined,
      }),
    placeholderData: keepPreviousData,
  });

  function openEditForm(usuario: Usuario) {
    setEditingUsuario(usuario);
    setFormOpen(true);
  }

  function changeFormOpen(open: boolean) {
    setFormOpen(open);
    if (!open) setEditingUsuario(undefined);
  }

  function onSaved(result: UsuarioUpdateResult) {
    setFormOpen(false);
    setEditingUsuario(undefined);
    if (result.sessionRevoked) {
      router.replace("/login");
      router.refresh();
      return;
    }
    void queryClient.invalidateQueries({ queryKey: ["usuarios"] });
  }

  const data = usuariosQuery.data?.data ?? [];
  const total = usuariosQuery.data?.meta.total ?? 0;
  const pageCount = usuariosQuery.data?.meta.totalPages ?? 0;
  const canEditRoles =
    permissions.includes("usuarios.editar") &&
    permissions.includes("usuarios.asignar-roles");
  const canCreateUser =
    permissions.includes("usuarios.crear") &&
    permissions.includes("usuarios.asignar-roles");

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#176B9A]">
            Acceso
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#172B3A] sm:text-3xl">
            Usuarios del sistema
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#64748B]">
            Administra las cuentas internas y los roles asignados al personal.
          </p>
        </div>
        {canCreateUser && (
          <Button type="button" onClick={() => setCreateOpen(true)}>
            <Plus aria-hidden="true" />
            Crear usuario
          </Button>
        )}
      </header>

      <div className="rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-[0_2px_10px_rgba(10,37,64,0.04)]">
        <div className="w-full sm:max-w-sm">
          <SearchInput
            aria-label="Buscar usuarios por nombre o correo"
            placeholder="Buscar por nombre o correo"
            value={search}
            onChange={(event) => {
              setSearch(event.currentTarget.value);
              setPagination((current) => ({ ...current, pageIndex: 0 }));
            }}
          />
        </div>
        {usuariosQuery.isFetching && (
          <p className="mt-3 text-xs text-[#64748B]" role="status">Actualizando resultados…</p>
        )}
      </div>

      {usuariosQuery.error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {getErrorMessage(usuariosQuery.error)}
          <button type="button" className="ml-2 font-semibold underline" onClick={() => void usuariosQuery.refetch()}>
            Reintentar
          </button>
        </div>
      )}

      {usuariosQuery.isPending ? (
        <div className="rounded-2xl border border-[#E2E8F0] bg-white px-4 py-12 text-center text-sm text-[#64748B]">
          Cargando usuarios…
        </div>
      ) : (
        <UsuarioTable
          data={data}
          total={total}
          pageCount={pageCount}
          pagination={pagination}
          canEditRoles={canEditRoles}
          onPaginationChange={setPagination}
          onEdit={openEditForm}
        />
      )}

      <UsuarioForm
        open={formOpen}
        onOpenChange={changeFormOpen}
        usuario={editingUsuario}
        roleOptions={usuariosQuery.data?.assignableRoles ?? []}
        onSaved={onSaved}
      />
      <CreateUsuarioDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        roleOptions={usuariosQuery.data?.assignableRoles ?? []}
      />
    </section>
  );
}
