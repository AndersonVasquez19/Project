"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { cursoColumns } from "@/components/admin/cursos/columns";
import { CursoArchiveConfirm } from "@/components/admin/cursos/CursoArchiveConfirm";
import { CursoForm } from "@/components/admin/cursos/CursoForm";
import { DataTable } from "@/components/admin/data-table";
import { ErrorBanner } from "@/components/admin/error-banner";
import { PageHeader } from "@/components/admin/page-header";
import { SearchInput } from "@/components/admin/search-input";
import { Button } from "@/components/ui/button";
import { useUrlListState } from "@/hooks/use-url-list-state";
import { getApiErrorMessage } from "@/lib/api-error";
import { can } from "@/lib/permissions";
import { notify } from "@/lib/toast";
import { archive, getAll, restore } from "@/services/cursosService";
import type { Curso, CursoCategoria, CursoEstado } from "@/types/curso";

const LIST_FILTERS = { categoria: "", estado: "", vista: "activos" };

type Props = { permissions: readonly string[] };

export function CursosPageClient({ permissions }: Props) {
  const canCreate = can(permissions, "cursos.crear");
  const canEdit = can(permissions, "cursos.editar");
  const canArchive = can(permissions, "cursos.eliminar");
  const canRestore = can(permissions, "cursos.restaurar");

  const queryClient = useQueryClient();
  const list = useUrlListState({ filters: LIST_FILTERS });
  const eliminados = list.filters.vista === "eliminados";
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Curso>();
  const [toArchive, setToArchive] = useState<Curso>();

  const cursosQuery = useQuery({
    queryKey: ["cursos", list.params, list.filters],
    queryFn: () =>
      getAll({
        ...list.params,
        categoria: (list.filters.categoria || undefined) as CursoCategoria | undefined,
        estado: (list.filters.estado || undefined) as CursoEstado | undefined,
        eliminados,
      }),
    placeholderData: keepPreviousData,
  });

  const archiveMutation = useMutation({
    mutationFn: archive,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["cursos"] });
      notify.success("Curso desactivado.");
      setToArchive(undefined);
    },
  });
  const restoreMutation = useMutation({
    mutationFn: restore,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["cursos"] });
      notify.success("Curso restaurado.");
    },
  });

  const columns = useMemo(
    () =>
      cursoColumns({
        eliminados,
        onEdit: canEdit
          ? (curso) => {
              setEditing(curso);
              setFormOpen(true);
            }
          : undefined,
        onArchive: canArchive ? setToArchive : undefined,
        onRestore: canRestore ? (curso) => restoreMutation.mutate(curso.id) : undefined,
        restoringId: restoreMutation.isPending ? restoreMutation.variables : undefined,
      }),
    [canArchive, canEdit, canRestore, eliminados, restoreMutation],
  );

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Gestión académica"
        title="Cursos"
        description="Administra la oferta de cursos, modalidades y cupos disponibles."
        actions={
          !eliminados &&
          canCreate && (
            <Button
              type="button"
              className="admin-btn-primary"
              onClick={() => {
                setEditing(undefined);
                setFormOpen(true);
              }}
            >
              <Plus aria-hidden="true" /> Nuevo curso
            </Button>
          )
        }
      />

      <div className="rounded-2xl border border-horus-line bg-white p-4 shadow-[0_2px_10px_rgba(10,37,64,0.04)]">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Button
            type="button"
            aria-pressed={!eliminados}
            variant={eliminados ? "outline" : "default"}
            onClick={() => list.setFilter("vista", "activos")}
          >
            Activos y vigentes
          </Button>
          <Button
            type="button"
            aria-pressed={eliminados}
            variant={eliminados ? "default" : "outline"}
            onClick={() => list.setFilter("vista", "eliminados")}
          >
            Eliminados
          </Button>
        </div>
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_170px]">
          <SearchInput
            aria-label="Buscar cursos por código o nombre"
            placeholder="Buscar por código o nombre"
            value={list.searchInput}
            onChange={(event) => list.setSearch(event.currentTarget.value)}
          />
          <label>
            <span className="sr-only">Filtrar por categoría</span>
            <select
              className="admin-select"
              value={list.filters.categoria}
              onChange={(event) => list.setFilter("categoria", event.currentTarget.value)}
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
              value={list.filters.estado}
              onChange={(event) => list.setFilter("estado", event.currentTarget.value)}
            >
              <option value="">Todos los estados</option>
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
              <option value="archivado">Archivado</option>
            </select>
          </label>
        </div>
        {cursosQuery.isFetching && !cursosQuery.isPending && (
          <p className="mt-3 text-xs text-horus-muted" role="status">
            Actualizando resultados…
          </p>
        )}
      </div>

      {cursosQuery.error && (
        <ErrorBanner
          message={getApiErrorMessage(cursosQuery.error, "No fue posible cargar los cursos.")}
          onRetry={() => void cursosQuery.refetch()}
        />
      )}
      {(archiveMutation.error || restoreMutation.error) && (
        <ErrorBanner
          message={getApiErrorMessage(
            archiveMutation.error ?? restoreMutation.error,
            "No se pudo completar la acción.",
          )}
        />
      )}

      <DataTable
        columns={columns}
        data={cursosQuery.data?.data ?? []}
        caption={eliminados ? "Cursos eliminados" : "Cursos"}
        total={cursosQuery.data?.meta.total ?? 0}
        pageCount={cursosQuery.data?.meta.totalPages ?? 0}
        pagination={list.pagination}
        onPaginationChange={list.setPagination}
        sorting={list.sorting}
        onSortingChange={list.setSorting}
        isLoading={cursosQuery.isPending}
        emptyMessage={eliminados ? "No hay cursos eliminados." : "No se encontraron cursos."}
        itemLabel={{ singular: "curso", plural: "cursos" }}
        getRowId={(curso) => curso.id}
      />

      <CursoForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditing(undefined);
        }}
        curso={editing}
      />
      <CursoArchiveConfirm
        open={Boolean(toArchive)}
        onOpenChange={(open) => {
          if (!open && !archiveMutation.isPending) setToArchive(undefined);
        }}
        cursoName={toArchive?.nombre}
        pending={archiveMutation.isPending}
        onConfirm={() => {
          if (toArchive) archiveMutation.mutate(toArchive.id);
        }}
      />
    </section>
  );
}
