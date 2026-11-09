"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useDeferredValue, useState } from "react";
import { MatriculaActionConfirm } from "@/components/admin/matriculas/MatriculaActionConfirm";
import { MatriculaForm } from "@/components/admin/matriculas/MatriculaForm";
import { MatriculaTable } from "@/components/admin/matriculas/MatriculaTable";
import { SearchInput } from "@/components/admin/search-input";
import { Button } from "@/components/ui/button";
import { getApiErrorMessage } from "@/lib/api-error";
import { getAll as getCursos } from "@/services/cursosService";
import {
  annul,
  archive,
  getAll,
  restore,
} from "@/services/matriculasService";
import type { EstadoMatricula, Matricula } from "@/types/matricula";

type Props = { permissions: string[] };
type ConfirmAction = { type: "annul" | "archive"; matricula: Matricula };

export function MatriculasPageClient({ permissions }: Props) {
  const queryClient = useQueryClient();
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [search, setSearch] = useState("");
  const [estado, setEstado] = useState<EstadoMatricula | "">("");
  const [cursoId, setCursoId] = useState("");
  const [eliminados, setEliminados] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Matricula>();
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>();
  const deferredSearch = useDeferredValue(search.trim());

  const matriculasQuery = useQuery({
    queryKey: [
      "matriculas",
      pagination.pageIndex,
      pagination.pageSize,
      deferredSearch,
      estado,
      cursoId,
      eliminados,
    ],
    queryFn: () =>
      getAll({
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
        search: deferredSearch || undefined,
        estado: estado || undefined,
        curso_id: cursoId || undefined,
        eliminados,
      }),
    placeholderData: keepPreviousData,
  });
  const cursosQuery = useQuery({
    queryKey: ["matriculas-filtros-cursos"],
    queryFn: () => getCursos({ page: 1, limit: 100 }),
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
      setConfirmAction(undefined);
    },
  });
  const archiveMutation = useMutation({
    mutationFn: archive,
    onSuccess: async () => {
      await invalidateRelated();
      setConfirmAction(undefined);
    },
  });
  const restoreMutation = useMutation({
    mutationFn: restore,
    onSuccess: async () => {
      await invalidateRelated();
    },
  });

  function resetPage() {
    setPagination((current) => ({ ...current, pageIndex: 0 }));
  }

  function openCreate() {
    setEditing(undefined);
    setFormOpen(true);
  }

  function openEdit(matricula: Matricula) {
    setEditing(matricula);
    setFormOpen(true);
  }

  function confirm() {
    if (!confirmAction) return;
    if (confirmAction.type === "annul") {
      annulMutation.mutate(confirmAction.matricula.id);
    } else {
      archiveMutation.mutate(confirmAction.matricula.id);
    }
  }

  const data = matriculasQuery.data?.data ?? [];
  const total = matriculasQuery.data?.meta.total ?? 0;
  const pageCount = matriculasQuery.data?.meta.totalPages ?? 0;
  const error =
    matriculasQuery.error ??
    cursosQuery.error ??
    annulMutation.error ??
    archiveMutation.error ??
    restoreMutation.error;
  const pending = annulMutation.isPending || archiveMutation.isPending;

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#176B9A]">
            Gestión académica
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#172B3A] sm:text-3xl">
            Matrículas
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#64748B]">
            Controla las inscripciones y los cupos de los cursos.
          </p>
        </div>
        {!eliminados && permissions.includes("matriculas.crear") && (
          <Button type="button" className="admin-btn-primary" onClick={openCreate}>
            <Plus aria-hidden="true" /> Nueva matrícula
          </Button>
        )}
      </header>

      <div className="rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-[0_2px_10px_rgba(10,37,64,0.04)]">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Button type="button" variant={eliminados ? "outline" : "default"} onClick={() => { setEliminados(false); resetPage(); }}>
            Vigentes
          </Button>
          <Button type="button" variant={eliminados ? "default" : "outline"} onClick={() => { setEliminados(true); resetPage(); }}>
            Eliminadas
          </Button>
        </div>
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_190px_220px]">
          <SearchInput
            aria-label="Buscar matrículas por estudiante o curso"
            placeholder="Buscar por estudiante, DNI o curso"
            value={search}
            onChange={(event) => { setSearch(event.currentTarget.value); resetPage(); }}
          />
          <label>
            <span className="sr-only">Filtrar por estado</span>
            <select className="admin-select" value={estado} onChange={(event) => { setEstado(event.currentTarget.value as EstadoMatricula | ""); resetPage(); }}>
              <option value="">Todos los estados</option>
              <option value="pendiente">Pendiente</option>
              <option value="pagada">Pagada</option>
              <option value="anulada">Anulada</option>
            </select>
          </label>
          <label>
            <span className="sr-only">Filtrar por curso</span>
            <select className="admin-select" value={cursoId} onChange={(event) => { setCursoId(event.currentTarget.value); resetPage(); }}>
              <option value="">Todos los cursos</option>
              {(cursosQuery.data?.data ?? []).map((curso) => (
                <option key={curso.id} value={curso.id}>{curso.codigo} · {curso.nombre}</option>
              ))}
            </select>
          </label>
        </div>
        {matriculasQuery.isFetching && (
          <p className="mt-3 text-xs text-[#64748B]" role="status">Actualizando resultados…</p>
        )}
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {getApiErrorMessage(error, "No fue posible cargar las matrículas.")}
          {matriculasQuery.error && (
            <button type="button" className="ml-2 font-semibold underline" onClick={() => void matriculasQuery.refetch()}>
              Reintentar
            </button>
          )}
        </div>
      )}

      {matriculasQuery.isPending ? (
        <div className="rounded-2xl border border-[#E2E8F0] bg-white px-4 py-12 text-center text-sm text-[#64748B]">
          Cargando matrículas…
        </div>
      ) : (
        <MatriculaTable
          data={data}
          total={total}
          pageCount={pageCount}
          pagination={pagination}
          eliminados={eliminados}
          canEdit={permissions.includes("matriculas.editar")}
          canAnnul={permissions.includes("matriculas.anular")}
          canArchive={permissions.includes("matriculas.eliminar")}
          canRestore={permissions.includes("matriculas.restaurar")}
          onPaginationChange={setPagination}
          onEdit={openEdit}
          onAnnul={(matricula) => setConfirmAction({ type: "annul", matricula })}
          onArchive={(matricula) => setConfirmAction({ type: "archive", matricula })}
          onRestore={(matricula) => restoreMutation.mutate(matricula.id)}
        />
      )}

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
        pending={pending}
        action={confirmAction?.type ?? "annul"}
        onOpenChange={(open) => { if (!open) setConfirmAction(undefined); }}
        onConfirm={confirm}
      />
    </section>
  );
}
