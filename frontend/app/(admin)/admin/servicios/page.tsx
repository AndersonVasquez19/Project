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
import { ConfirmModal } from "@/components/admin/servicios/ConfirmModal";
import { ServicioForm } from "@/components/admin/servicios/ServicioForm";
import { ServicioTable } from "@/components/admin/servicios/ServicioTable";
import { SearchInput } from "@/components/admin/search-input";
import { Button } from "@/components/ui/button";
import { archive, getAll } from "@/services/serviciosService";
import type { ServicioTecnologico } from "@/types/servicio";

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data: unknown = error.response?.data;
    if (typeof data === "object" && data !== null && "message" in data) {
      const { message } = data;
      if (typeof message === "string") {
        return message;
      }
      if (Array.isArray(message) && message.every((item) => typeof item === "string")) {
        return message.join(" ");
      }
    }
  }

  return "No fue posible cargar los servicios. Inténtalo nuevamente.";
}

export default function ServiciosPage() {
  const queryClient = useQueryClient();
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search.trim());
  const [formOpen, setFormOpen] = useState(false);
  const [editingServicio, setEditingServicio] =
    useState<ServicioTecnologico>();
  const [serviceToArchive, setServiceToArchive] =
    useState<ServicioTecnologico>();

  const serviciosQuery = useQuery({
    queryKey: [
      "servicios-tecnologicos",
      pagination.pageIndex,
      pagination.pageSize,
      deferredSearch,
    ],
    queryFn: () =>
      getAll({
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
        search: deferredSearch || undefined,
      }),
    placeholderData: keepPreviousData,
  });

  const archiveMutation = useMutation({
    mutationFn: archive,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["servicios-tecnologicos"],
      });
      setServiceToArchive(undefined);
    },
  });

  function openCreateForm() {
    setEditingServicio(undefined);
    setFormOpen(true);
  }

  function openEditForm(servicio: ServicioTecnologico) {
    setEditingServicio(servicio);
    setFormOpen(true);
  }

  function changeFormOpen(open: boolean) {
    setFormOpen(open);
    if (!open) {
      setEditingServicio(undefined);
    }
  }

  const servicios = serviciosQuery.data?.data ?? [];
  const total = serviciosQuery.data?.meta.total ?? 0;
  const pageCount = serviciosQuery.data?.meta.totalPages ?? 0;

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#176B9A]">
            Gestión comercial
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#172B3A] sm:text-3xl">
            Servicios tecnológicos
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#64748B]">
            Administra el catálogo de servicios tecnológicos de Horus Group.
          </p>
        </div>
        <Button
          type="button"
          className="admin-btn-primary"
          onClick={openCreateForm}
        >
          <Plus aria-hidden="true" />
          Nuevo servicio
        </Button>
      </header>

      <div className="flex flex-col gap-3 rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-[0_2px_10px_rgba(10,37,64,0.04)] sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full sm:max-w-sm">
          <SearchInput
            aria-label="Buscar servicios por código, nombre o categoría"
            placeholder="Buscar servicios..."
            value={search}
            onChange={(event) => {
              setSearch(event.currentTarget.value);
              setPagination((current) => ({ ...current, pageIndex: 0 }));
            }}
          />
        </div>
        {serviciosQuery.isFetching && (
          <p className="text-xs text-[#64748B]" role="status">
            Actualizando resultados…
          </p>
        )}
      </div>

      {serviciosQuery.error && (
        <div
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          role="alert"
        >
          {getErrorMessage(serviciosQuery.error)}
          <button
            type="button"
            className="ml-2 font-semibold underline underline-offset-2"
            onClick={() => void serviciosQuery.refetch()}
          >
            Reintentar
          </button>
        </div>
      )}

      {archiveMutation.error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {getErrorMessage(archiveMutation.error)}
        </div>
      )}

      {serviciosQuery.isPending ? (
        <div className="rounded-2xl border border-[#E2E8F0] bg-white px-4 py-12 text-center text-sm text-[#64748B]">
          Cargando servicios tecnológicos…
        </div>
      ) : (
        <ServicioTable
          data={servicios}
          total={total}
          pageCount={pageCount}
          pagination={pagination}
          onPaginationChange={setPagination}
          onEdit={openEditForm}
          onArchive={setServiceToArchive}
        />
      )}

      <ServicioForm
        open={formOpen}
        onOpenChange={changeFormOpen}
        servicio={editingServicio}
      />

      <ConfirmModal
        open={Boolean(serviceToArchive)}
        onOpenChange={(open) => {
          if (!open && !archiveMutation.isPending) {
            setServiceToArchive(undefined);
          }
        }}
        pending={archiveMutation.isPending}
        onConfirm={() => {
          if (serviceToArchive) {
            archiveMutation.mutate(serviceToArchive.id);
          }
        }}
      />
    </section>
  );
}
