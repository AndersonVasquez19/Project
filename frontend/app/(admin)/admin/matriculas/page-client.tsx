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
import { matriculaColumns } from "@/components/admin/matriculas/columns";
import { MatriculaActionConfirm } from "@/components/admin/matriculas/MatriculaActionConfirm";
import { MatriculaForm } from "@/components/admin/matriculas/MatriculaForm";
import { PageHeader } from "@/components/admin/page-header";
import { SearchInput } from "@/components/admin/search-input";
import { Button } from "@/components/ui/button";
import { useUrlListState } from "@/hooks/use-url-list-state";
import { getApiErrorMessage } from "@/lib/api-error";
import { can } from "@/lib/permissions";
import { notify } from "@/lib/toast";
import { getAll as getCursos } from "@/services/cursosService";
import {
  annul,
  archive,
  getAll,
  restore,
} from "@/services/matriculasService";
import type { EstadoMatricula, Matricula } from "@/types/matricula";

const LIST_FILTERS = { estado: "", curso_id: "", vista: "vigentes" };

type Props = { permissions: readonly string[] };
type ConfirmAction = { type: "annul" | "archive"; matricula: Matricula };

export function MatriculasPageClient({ permissions }: Props) {
  const canCreate = can(permissions, "matriculas.crear");
  const canEdit = can(permissions, "matriculas.editar");
  const canAnnul = can(permissions, "matriculas.anular");
  const canArchive = can(permissions, "matriculas.eliminar");
  const canRestore = can(permissions, "matriculas.restaurar");

  const queryClient = useQueryClient();
  const list = useUrlListState({ filters: LIST_FILTERS });
  const eliminados = list.filters.vista === "eliminadas";
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Matricula>();
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>();

  const matriculasQuery = useQuery({
    queryKey: ["matriculas", list.params, list.filters],
    queryFn: () =>
      getAll({
        ...list.params,
        estado: (list.filters.estado || undefined) as EstadoMatricula | undefined,
        curso_id: list.filters.curso_id || undefined,
        eliminados,
      }),
    placeholderData: keepPreviousData,
  });
  const cursosQuery = useQuery({
    queryKey: ["matriculas-filtros-cursos"],
    queryFn: () => getCursos({ page: 1, limit: 100 }),
    staleTime: 60_000,
  });

  function invalidateRelated() {
    return Promise.all([
      queryClient.invalidateQueries({ queryKey: ["matriculas"] }),
      queryClient.invalidateQueries({ queryKey: ["cursos"] }),
    ]);
  }

  const annulMutation = useMutation({
    mutationFn: annul,
    onSuccess: async () => {
      await invalidateRelated();
      notify.success("Matrícula anulada.");
      setConfirmAction(undefined);
    },
  });
  const archiveMutation = useMutation({
    mutationFn: archive,
    onSuccess: async () => {
      await invalidateRelated();
      notify.success("Matrícula eliminada.");
      setConfirmAction(undefined);
    },
  });
  const restoreMutation = useMutation({
    mutationFn: restore,
    onSuccess: async () => {
      await invalidateRelated();
      notify.success("Matrícula restaurada.");
    },
  });

  const columns = useMemo(
    () =>
      matriculaColumns({
        eliminados,
        onEdit: canEdit
          ? (matricula) => {
              setEditing(matricula);
              setFormOpen(true);
            }
          : undefined,
        onAnnul: canAnnul
          ? (matricula) => setConfirmAction({ type: "annul", matricula })
          : undefined,
        onArchive: canArchive
          ? (matricula) => setConfirmAction({ type: "archive", matricula })
          : undefined,
        onRestore: canRestore
          ? (matricula) => restoreMutation.mutate(matricula.id)
          : undefined,
        restoringId: restoreMutation.isPending ? restoreMutation.variables : undefined,
      }),
    [canAnnul, canArchive, canEdit, canRestore, eliminados, restoreMutation],
  );

  const actionError =
    annulMutation.error ?? archiveMutation.error ?? restoreMutation.error;
  const target = confirmAction?.matricula;

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Gestión académica"
        title="Matrículas"
        description="Controla las inscripciones y los cupos de los cursos."
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
              <Plus aria-hidden="true" /> Nueva matrícula
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
            onClick={() => list.setFilter("vista", "vigentes")}
          >
            Vigentes
          </Button>
          <Button
            type="button"
            aria-pressed={eliminados}
            variant={eliminados ? "default" : "outline"}
            onClick={() => list.setFilter("vista", "eliminadas")}
          >
            Eliminadas
          </Button>
        </div>
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_190px_220px]">
          <SearchInput
            aria-label="Buscar matrículas por estudiante, DNI o curso"
            placeholder="Buscar por estudiante, DNI o curso"
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
              <option value="pendiente">Pendiente</option>
              <option value="pagada">Pagada</option>
              <option value="anulada">Anulada</option>
            </select>
          </label>
          <label>
            <span className="sr-only">Filtrar por curso</span>
            <select
              className="admin-select"
              value={list.filters.curso_id}
              onChange={(event) => list.setFilter("curso_id", event.currentTarget.value)}
            >
              <option value="">Todos los cursos</option>
              {(cursosQuery.data?.data ?? []).map((curso) => (
                <option key={curso.id} value={curso.id}>
                  {curso.codigo} · {curso.nombre}
                </option>
              ))}
            </select>
          </label>
        </div>
        {matriculasQuery.isFetching && !matriculasQuery.isPending && (
          <p className="mt-3 text-xs text-horus-muted" role="status">
            Actualizando resultados…
          </p>
        )}
      </div>

      {matriculasQuery.error && (
        <ErrorBanner
          message={getApiErrorMessage(
            matriculasQuery.error,
            "No fue posible cargar las matrículas.",
          )}
          onRetry={() => void matriculasQuery.refetch()}
        />
      )}
      {cursosQuery.error && (
        <ErrorBanner
          message={getApiErrorMessage(
            cursosQuery.error,
            "No se pudo cargar la lista de cursos para filtrar.",
          )}
          onRetry={() => void cursosQuery.refetch()}
        />
      )}
      {actionError && (
        <ErrorBanner
          message={getApiErrorMessage(actionError, "No se pudo completar la acción.")}
        />
      )}

      <DataTable
        columns={columns}
        data={matriculasQuery.data?.data ?? []}
        caption={eliminados ? "Matrículas eliminadas" : "Matrículas"}
        total={matriculasQuery.data?.meta.total ?? 0}
        pageCount={matriculasQuery.data?.meta.totalPages ?? 0}
        pagination={list.pagination}
        onPaginationChange={list.setPagination}
        sorting={list.sorting}
        onSortingChange={list.setSorting}
        isLoading={matriculasQuery.isPending}
        emptyMessage={
          eliminados ? "No hay matrículas eliminadas." : "No se encontraron matrículas."
        }
        itemLabel={{ singular: "matrícula", plural: "matrículas" }}
        getRowId={(matricula) => matricula.id}
      />

      <MatriculaForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditing(undefined);
        }}
        matricula={editing}
      />
      <MatriculaActionConfirm
        open={Boolean(confirmAction)}
        pending={annulMutation.isPending || archiveMutation.isPending}
        action={confirmAction?.type ?? "annul"}
        subject={
          target?.estudiante
            ? target.estudiante.nombres + " " + target.estudiante.apellidos
            : undefined
        }
        onOpenChange={(open) => {
          if (!open) setConfirmAction(undefined);
        }}
        onConfirm={() => {
          if (!confirmAction) return;
          if (confirmAction.type === "annul") {
            annulMutation.mutate(confirmAction.matricula.id);
          } else {
            archiveMutation.mutate(confirmAction.matricula.id);
          }
        }}
      />
    </section>
  );
}
