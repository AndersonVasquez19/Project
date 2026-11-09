"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { DataTable } from "@/components/admin/data-table";
import { ErrorBanner } from "@/components/admin/error-banner";
import { estudianteColumns } from "@/components/admin/estudiantes/columns";
import { EstudianteArchiveConfirm } from "@/components/admin/estudiantes/EstudianteArchiveConfirm";
import { EstudianteForm } from "@/components/admin/estudiantes/EstudianteForm";
import { PageHeader } from "@/components/admin/page-header";
import { SearchInput } from "@/components/admin/search-input";
import { Button } from "@/components/ui/button";
import { useUrlListState } from "@/hooks/use-url-list-state";
import { getApiErrorMessage } from "@/lib/api-error";
import { can } from "@/lib/permissions";
import { notify } from "@/lib/toast";
import { archive, getAll, restore } from "@/services/estudiantesService";
import type { EstadoEstudiante, Estudiante } from "@/types/estudiante";

const LIST_FILTERS = { estado: "", vista: "activos" };

type Props = { permissions: readonly string[] };

export function EstudiantesPageClient({ permissions }: Props) {
  const canCreate = can(permissions, "estudiantes.crear");
  const canEdit = can(permissions, "estudiantes.editar");
  const canArchive = can(permissions, "estudiantes.eliminar");
  const canRestore = can(permissions, "estudiantes.restaurar");

  const queryClient = useQueryClient();
  const list = useUrlListState({ filters: LIST_FILTERS });
  const eliminados = list.filters.vista === "eliminados";
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Estudiante>();
  const [toArchive, setToArchive] = useState<Estudiante>();

  const estudiantesQuery = useQuery({
    queryKey: ["estudiantes", list.params, list.filters],
    queryFn: () =>
      getAll({
        ...list.params,
        estado: (list.filters.estado || undefined) as EstadoEstudiante | undefined,
        eliminados,
      }),
    placeholderData: keepPreviousData,
  });

  const archiveMutation = useMutation({
    mutationFn: archive,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["estudiantes"] });
      notify.success("Estudiante desactivado.");
      setToArchive(undefined);
    },
  });
  const restoreMutation = useMutation({
    mutationFn: restore,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["estudiantes"] });
      notify.success("Estudiante restaurado.");
    },
  });

  const columns = useMemo(
    () =>
      estudianteColumns({
        eliminados,
        onEdit: canEdit
          ? (estudiante) => {
              setEditing(estudiante);
              setFormOpen(true);
            }
          : undefined,
        onArchive: canArchive ? setToArchive : undefined,
        onRestore: canRestore
          ? (estudiante) => restoreMutation.mutate(estudiante.id)
          : undefined,
        restoringId: restoreMutation.isPending ? restoreMutation.variables : undefined,
      }),
    [
      canArchive,
      canEdit,
      canRestore,
      eliminados,
      restoreMutation,
    ],
  );

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Gestión académica"
        title="Estudiantes"
        description="Consulta y administra los registros de estudiantes."
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
              <Plus aria-hidden="true" /> Nuevo estudiante
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
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_200px]">
          <SearchInput
            aria-label="Buscar estudiantes por DNI, nombre o apellido"
            placeholder="Buscar por DNI, nombre o apellido"
            value={list.searchInput}
            onChange={(event) => list.setSearch(event.currentTarget.value)}
          />
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
            </select>
          </label>
        </div>
        {estudiantesQuery.isFetching && !estudiantesQuery.isPending && (
          <p className="mt-3 text-xs text-horus-muted" role="status">
            Actualizando resultados…
          </p>
        )}
      </div>

      {estudiantesQuery.error && (
        <ErrorBanner
          message={getApiErrorMessage(
            estudiantesQuery.error,
            "No fue posible cargar los estudiantes.",
          )}
          onRetry={() => void estudiantesQuery.refetch()}
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
        data={estudiantesQuery.data?.data ?? []}
        caption={eliminados ? "Estudiantes eliminados" : "Estudiantes"}
        total={estudiantesQuery.data?.meta.total ?? 0}
        pageCount={estudiantesQuery.data?.meta.totalPages ?? 0}
        pagination={list.pagination}
        onPaginationChange={list.setPagination}
        sorting={list.sorting}
        onSortingChange={list.setSorting}
        isLoading={estudiantesQuery.isPending}
        emptyMessage="No se encontraron estudiantes."
        itemLabel={{ singular: "estudiante", plural: "estudiantes" }}
        getRowId={(estudiante) => estudiante.id}
      />

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
        onOpenChange={(open) => {
          if (!open) setToArchive(undefined);
        }}
        studentName={toArchive ? `${toArchive.nombres} ${toArchive.apellidos}` : undefined}
        pending={archiveMutation.isPending}
        onConfirm={() => {
          if (toArchive) archiveMutation.mutate(toArchive.id);
        }}
      />
    </section>
  );
}
