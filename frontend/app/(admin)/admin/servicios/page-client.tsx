"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { DataTable } from "@/components/admin/data-table";
import { ErrorBanner } from "@/components/admin/error-banner";
import { PageHeader } from "@/components/admin/page-header";
import { SearchInput } from "@/components/admin/search-input";
import { servicioColumns } from "@/components/admin/servicios/columns";
import { ServicioForm } from "@/components/admin/servicios/ServicioForm";
import { Button } from "@/components/ui/button";
import { useListState } from "@/hooks/use-list-state";
import { getApiErrorMessage } from "@/lib/api-error";
import { can } from "@/lib/permissions";
import { notify } from "@/lib/toast";
import { archive, getAll } from "@/services/serviciosService";
import type { ServicioTecnologico } from "@/types/servicio";

export function ServiciosPageClient({
  permissions,
}: {
  permissions: readonly string[];
}) {
  const canCreate = can(permissions, "servicios.crear");
  const canEdit = can(permissions, "servicios.editar");
  const queryClient = useQueryClient();
  const list = useListState();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ServicioTecnologico>();
  const [toArchive, setToArchive] = useState<ServicioTecnologico>();

  const serviciosQuery = useQuery({
    queryKey: ["servicios-tecnologicos", list.params],
    queryFn: () => getAll(list.params),
    placeholderData: keepPreviousData,
  });

  const archiveMutation = useMutation({
    mutationFn: archive,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["servicios-tecnologicos"] });
      notify.success("Servicio archivado.");
      setToArchive(undefined);
    },
  });

  const columns = useMemo(
    () =>
      servicioColumns({
        onEdit: canEdit
          ? (servicio) => {
              setEditing(servicio);
              setFormOpen(true);
            }
          : undefined,
        onArchive: canEdit ? setToArchive : undefined,
      }),
    [canEdit],
  );

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Gestión comercial"
        title="Servicios tecnológicos"
        description="Administra el catálogo de servicios tecnológicos de Horus Group."
        actions={
          canCreate && (
            <Button
              type="button"
              className="admin-btn-primary"
              onClick={() => {
                setEditing(undefined);
                setFormOpen(true);
              }}
            >
              <Plus aria-hidden="true" />
              Nuevo servicio
            </Button>
          )
        }
      />

      <div className="flex flex-col gap-3 rounded-2xl border border-horus-line bg-white p-4 shadow-[0_2px_10px_rgba(10,37,64,0.04)] sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full sm:max-w-sm">
          <SearchInput
            aria-label="Buscar servicios por código, nombre o categoría"
            placeholder="Buscar servicios..."
            value={list.search}
            onChange={(event) => list.setSearch(event.currentTarget.value)}
          />
        </div>
        {serviciosQuery.isFetching && !serviciosQuery.isPending && (
          <p className="text-xs text-horus-muted" role="status">
            Actualizando resultados…
          </p>
        )}
      </div>

      {serviciosQuery.error && (
        <ErrorBanner
          message={getApiErrorMessage(
            serviciosQuery.error,
            "No fue posible cargar los servicios. Inténtalo nuevamente.",
          )}
          onRetry={() => void serviciosQuery.refetch()}
        />
      )}
      {archiveMutation.error && (
        <ErrorBanner
          message={getApiErrorMessage(
            archiveMutation.error,
            "No se pudo archivar el servicio. Inténtalo nuevamente.",
          )}
        />
      )}

      <DataTable
        columns={columns}
        data={serviciosQuery.data?.data ?? []}
        caption="Servicios tecnológicos"
        total={serviciosQuery.data?.meta.total ?? 0}
        pageCount={serviciosQuery.data?.meta.totalPages ?? 0}
        pagination={list.pagination}
        onPaginationChange={list.setPagination}
        sorting={list.sorting}
        onSortingChange={list.setSorting}
        isLoading={serviciosQuery.isPending}
        emptyMessage="No se encontraron servicios tecnológicos."
        itemLabel={{ singular: "servicio", plural: "servicios" }}
        getRowId={(servicio) => servicio.id}
      />

      <ServicioForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditing(undefined);
        }}
        servicio={editing}
      />

      <ConfirmDialog
        open={Boolean(toArchive)}
        onOpenChange={(open) => {
          if (!open) setToArchive(undefined);
        }}
        title="¿Archivar este servicio?"
        description="El servicio dejará de mostrarse como activo. Podrás conservar su registro para referencia administrativa."
        confirmLabel="Archivar"
        pendingLabel="Archivando..."
        pending={archiveMutation.isPending}
        destructive
        onConfirm={() => {
          if (toArchive) archiveMutation.mutate(toArchive.id);
        }}
      />
    </section>
  );
}
