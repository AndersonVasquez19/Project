"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useDeferredValue, useState } from "react";
import { EstudianteArchiveConfirm } from "@/components/admin/estudiantes/EstudianteArchiveConfirm";
import { EstudianteForm } from "@/components/admin/estudiantes/EstudianteForm";
import { EstudianteTable } from "@/components/admin/estudiantes/EstudianteTable";
import { SearchInput } from "@/components/admin/search-input";
import { Button } from "@/components/ui/button";
import { archive, getAll, restore } from "@/services/estudiantesService";
import type { EstadoEstudiante, Estudiante } from "@/types/estudiante";
import { getApiErrorMessage } from "@/lib/api-error";

type Props = { permissions: string[] };

export function EstudiantesPageClient({ permissions }: Props) {
  const queryClient = useQueryClient();
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [search, setSearch] = useState("");
  const [estado, setEstado] = useState<EstadoEstudiante | "">("");
  const [eliminados, setEliminados] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Estudiante>();
  const [toArchive, setToArchive] = useState<Estudiante>();
  const deferredSearch = useDeferredValue(search.trim());

  const estudiantesQuery = useQuery({
    queryKey: [
      "estudiantes",
      pagination.pageIndex,
      pagination.pageSize,
      deferredSearch,
      estado,
      eliminados,
    ],
    queryFn: () =>
      getAll({
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
        search: deferredSearch || undefined,
        estado: estado || undefined,
        eliminados,
      }),
    placeholderData: keepPreviousData,
  });
  const archiveMutation = useMutation({
    mutationFn: archive,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["estudiantes"] });
      setToArchive(undefined);
    },
  });
  const restoreMutation = useMutation({
    mutationFn: restore,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["estudiantes"] });
    },
  });

  function resetPage() {
    setPagination((current) => ({ ...current, pageIndex: 0 }));
  }

  function openCreate() {
    setEditing(undefined);
    setFormOpen(true);
  }

  function openEdit(estudiante: Estudiante) {
    setEditing(estudiante);
    setFormOpen(true);
  }

  const data = estudiantesQuery.data?.data ?? [];
  const total = estudiantesQuery.data?.meta.total ?? 0;
  const pageCount = estudiantesQuery.data?.meta.totalPages ?? 0;
  const error = estudiantesQuery.error ?? archiveMutation.error ?? restoreMutation.error;

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#176B9A]">
            Gestión académica
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#172B3A] sm:text-3xl">
            Estudiantes
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#64748B]">
            Consulta y administra los registros de estudiantes.
          </p>
        </div>
        {!eliminados && permissions.includes("estudiantes.crear") && (
          <Button type="button" className="admin-btn-primary" onClick={openCreate}>
            <Plus aria-hidden="true" /> Nuevo estudiante
          </Button>
        )}
      </header>

      <div className="rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-[0_2px_10px_rgba(10,37,64,0.04)]">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Button type="button" aria-pressed={!eliminados} variant={eliminados ? "outline" : "default"} onClick={() => { setEliminados(false); resetPage(); }}>
            Activos y vigentes
          </Button>
          <Button type="button" aria-pressed={eliminados} variant={eliminados ? "default" : "outline"} onClick={() => { setEliminados(true); resetPage(); }}>
            Eliminados
          </Button>
        </div>
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_200px]">
          <SearchInput
            aria-label="Buscar estudiantes por DNI, nombre o apellido"
            placeholder="Buscar por DNI, nombre o apellido"
            value={search}
            onChange={(event) => { setSearch(event.currentTarget.value); resetPage(); }}
          />
          <label>
            <span className="sr-only">Filtrar por estado</span>
            <select className="admin-select" value={estado} onChange={(event) => { setEstado(event.currentTarget.value as EstadoEstudiante | ""); resetPage(); }}>
              <option value="">Todos los estados</option>
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
            </select>
          </label>
        </div>
        {estudiantesQuery.isFetching && (
          <p className="mt-3 text-xs text-[#64748B]" role="status">Actualizando resultados…</p>
        )}
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {getApiErrorMessage(error, "No fue posible cargar los estudiantes.")}
          {estudiantesQuery.error && (
            <button type="button" className="ml-2 font-semibold underline" onClick={() => void estudiantesQuery.refetch()}>
              Reintentar
            </button>
          )}
        </div>
      )}

      {estudiantesQuery.isPending ? (
        <div className="rounded-2xl border border-[#E2E8F0] bg-white px-4 py-12 text-center text-sm text-[#64748B]">
          Cargando estudiantes…
        </div>
      ) : (
        <EstudianteTable
          data={data}
          total={total}
          pageCount={pageCount}
          pagination={pagination}
          eliminados={eliminados}
          canEdit={permissions.includes("estudiantes.editar")}
          canArchive={permissions.includes("estudiantes.eliminar")}
          canRestore={permissions.includes("estudiantes.restaurar")}
          onPaginationChange={setPagination}
          onEdit={openEdit}
          onArchive={setToArchive}
          onRestore={(estudiante) => restoreMutation.mutate(estudiante.id)}
        />
      )}

      <EstudianteForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditing(undefined);
        }}
        estudiante={editing}
      />
      <EstudianteArchiveConfirm
        open={Boolean(toArchive)}
        onOpenChange={(open) => { if (!open) setToArchive(undefined); }}
        studentName={toArchive ? `${toArchive.nombres} ${toArchive.apellidos}` : undefined}
        pending={archiveMutation.isPending}
        onConfirm={() => { if (toArchive) archiveMutation.mutate(toArchive.id); }}
      />
    </section>
  );
}
