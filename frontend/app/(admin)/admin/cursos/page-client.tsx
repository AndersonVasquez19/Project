"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import axios from "axios";
import { Plus } from "lucide-react";
import { useDeferredValue, useState } from "react";
import { CursoArchiveConfirm } from "@/components/admin/cursos/CursoArchiveConfirm";
import { CursoForm } from "@/components/admin/cursos/CursoForm";
import { CursoTable } from "@/components/admin/cursos/CursoTable";
import { SearchInput } from "@/components/admin/search-input";
import { Button } from "@/components/ui/button";
import { archive, getAll, restore } from "@/services/cursosService";
import type { Curso, CursoCategoria, CursoEstado } from "@/types/curso";

type CursosPageClientProps = { permissions: string[] };

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
  return "No fue posible cargar los cursos. Inténtalo nuevamente.";
}

export function CursosPageClient({ permissions }: CursosPageClientProps) {
  const queryClient = useQueryClient();
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [search, setSearch] = useState("");
  const [categoria, setCategoria] = useState<CursoCategoria | "">("");
  const [estado, setEstado] = useState<CursoEstado | "">("");
  const [eliminados, setEliminados] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingCurso, setEditingCurso] = useState<Curso>();
  const [cursoToArchive, setCursoToArchive] = useState<Curso>();
  const deferredSearch = useDeferredValue(search.trim());

  const cursosQuery = useQuery({
    queryKey: [
      "cursos",
      pagination.pageIndex,
      pagination.pageSize,
      deferredSearch,
      categoria,
      estado,
      eliminados,
    ],
    queryFn: () =>
      getAll({
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
        search: deferredSearch || undefined,
        categoria: categoria || undefined,
        estado: estado || undefined,
        eliminados,
      }),
    placeholderData: keepPreviousData,
  });
  const archiveMutation = useMutation({
    mutationFn: archive,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["cursos"] });
      setCursoToArchive(undefined);
    },
  });
  const restoreMutation = useMutation({
    mutationFn: restore,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["cursos"] });
    },
  });

  function resetPage() {
    setPagination((current) => ({ ...current, pageIndex: 0 }));
  }

  function openCreateForm() {
    setEditingCurso(undefined);
    setFormOpen(true);
  }

  function openEditForm(curso: Curso) {
    setEditingCurso(curso);
    setFormOpen(true);
  }

  function changeFormOpen(open: boolean) {
    setFormOpen(open);
    if (!open) setEditingCurso(undefined);
  }

  const data = cursosQuery.data?.data ?? [];
  const total = cursosQuery.data?.meta.total ?? 0;
  const pageCount = cursosQuery.data?.meta.totalPages ?? 0;

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#176B9A]">
            Gestión académica
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#172B3A] sm:text-3xl">
            Cursos
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#64748B]">
            Administra la oferta de cursos, modalidades y cupos disponibles.
          </p>
        </div>
        {!eliminados && permissions.includes("cursos.crear") && (
          <Button type="button" className="admin-btn-primary" onClick={openCreateForm}>
            <Plus aria-hidden="true" />
            Nuevo curso
          </Button>
        )}
      </header>

      <div className="rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-[0_2px_10px_rgba(10,37,64,0.04)]">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant={eliminados ? "outline" : "default"}
            onClick={() => {
              setEliminados(false);
              resetPage();
            }}
          >
            Activos y vigentes
          </Button>
          <Button
            type="button"
            variant={eliminados ? "default" : "outline"}
            onClick={() => {
              setEliminados(true);
              resetPage();
            }}
          >
            Eliminados
          </Button>
        </div>
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_170px]">
          <SearchInput
            aria-label="Buscar cursos por código o nombre"
            placeholder="Buscar por código o nombre"
            value={search}
            onChange={(event) => {
              setSearch(event.currentTarget.value);
              resetPage();
            }}
          />
          <label>
            <span className="sr-only">Filtrar por categoría</span>
            <select
              className="admin-select"
              value={categoria}
              onChange={(event) => {
                setCategoria(event.currentTarget.value as CursoCategoria | "");
                resetPage();
              }}
            >
              <option value="">Todas las categorías</option>
              <option value="tecnologia">Tecnología</option>
              <option value="educacion">Educación</option>
              <option value="salud">Salud</option>
              <option value="gestion">Gestión</option>
              <option value="otros">Otros</option>
            </select>
          </label>
          <label>
            <span className="sr-only">Filtrar por estado</span>
            <select
              className="admin-select"
              value={estado}
              onChange={(event) => {
                setEstado(event.currentTarget.value as CursoEstado | "");
                resetPage();
              }}
            >
              <option value="">Todos los estados</option>
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
              <option value="archivado">Archivado</option>
            </select>
          </label>
        </div>
        {cursosQuery.isFetching && (
          <p className="mt-3 text-xs text-[#64748B]" role="status">Actualizando resultados…</p>
        )}
      </div>

      {(cursosQuery.error || archiveMutation.error || restoreMutation.error) && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {getErrorMessage(cursosQuery.error ?? archiveMutation.error ?? restoreMutation.error)}
          {cursosQuery.error && (
            <button type="button" className="ml-2 font-semibold underline" onClick={() => void cursosQuery.refetch()}>
              Reintentar
            </button>
          )}
        </div>
      )}

      {cursosQuery.isPending ? (
        <div className="rounded-2xl border border-[#E2E8F0] bg-white px-4 py-12 text-center text-sm text-[#64748B]">
          Cargando cursos…
        </div>
      ) : (
        <CursoTable
          data={data}
          total={total}
          pageCount={pageCount}
          pagination={pagination}
          eliminados={eliminados}
          canEdit={permissions.includes("cursos.editar")}
          canArchive={permissions.includes("cursos.eliminar")}
          canRestore={permissions.includes("cursos.restaurar")}
          onPaginationChange={setPagination}
          onEdit={openEditForm}
          onArchive={setCursoToArchive}
          onRestore={(curso) => restoreMutation.mutate(curso.id)}
        />
      )}

      <CursoForm open={formOpen} onOpenChange={changeFormOpen} curso={editingCurso} />
      <CursoArchiveConfirm
        open={Boolean(cursoToArchive)}
        onOpenChange={(open) => {
          if (!open && !archiveMutation.isPending) setCursoToArchive(undefined);
        }}
        cursoName={cursoToArchive?.nombre}
        pending={archiveMutation.isPending}
        onConfirm={() => {
          if (cursoToArchive) archiveMutation.mutate(cursoToArchive.id);
        }}
      />
    </section>
  );
}
