"use client";

import type {
  OnChangeFn,
  PaginationState,
  SortingState,
} from "@tanstack/react-table";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import {
  buildListQuery,
  parseListUrl,
  type ListUrlConfig,
  type ListUrlState,
} from "@/lib/list-url";

const PAGE_SIZES = [10, 20, 50] as const;

type Options<F extends Record<string, string>> = {
  pageSize?: number;
  /** Valor por defecto de cada filtro (define también sus nombres en la URL). */
  filters: F;
  debounceMs?: number;
};

/**
 * Estado de un listado guardado en la URL: página, tamaño, búsqueda, orden y
 * filtros. Permite compartir el enlace, recargar y volver atrás sin perder la
 * vista. La búsqueda se escribe con debounce; cualquier cambio de búsqueda,
 * filtro u orden vuelve a la página 1.
 */
export function useUrlListState<F extends Record<string, string>>({
  pageSize = 10,
  filters: defaultFilters,
  debounceMs = 300,
}: Options<F>) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Los defaults son constantes del módulo que llama: se comparan por contenido
  // para que un objeto literal nuevo en cada render no invalide el estado.
  const filtersKey = JSON.stringify(defaultFilters);
  const config = useMemo<ListUrlConfig<F>>(
    () => ({
      limit: pageSize,
      limits: PAGE_SIZES,
      filters: JSON.parse(filtersKey) as F,
    }),
    [pageSize, filtersKey],
  );

  const state = useMemo(
    () => parseListUrl(searchParams, config),
    [searchParams, config],
  );

  // Último estado conocido: varias actualizaciones seguidas parten de él aunque
  // la URL aún no se haya re-renderizado.
  const latest = useRef<ListUrlState<F>>(state);
  useEffect(() => {
    latest.current = state;
  }, [state]);

  const replace = useCallback(
    (patch: Partial<ListUrlState<F>>) => {
      const next = { ...latest.current, ...patch };
      latest.current = next;
      const query = buildListQuery(next, config);
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [config, pathname, router],
  );

  // Búsqueda: el input responde al instante y la URL se actualiza tras el debounce.
  const [searchInput, setSearchInput] = useState(state.q);
  const debouncedQuery = useDebouncedValue(searchInput.trim(), debounceMs);
  const pushedQuery = useRef(state.q);

  useEffect(() => {
    if (debouncedQuery !== pushedQuery.current) {
      pushedQuery.current = debouncedQuery;
      replace({ q: debouncedQuery, page: 1 });
    }
  }, [debouncedQuery, replace]);

  // Cambios externos de la URL (botón atrás, enlace) actualizan el input.
  useEffect(() => {
    if (state.q !== pushedQuery.current) {
      pushedQuery.current = state.q;
      setSearchInput(state.q);
    }
  }, [state.q]);

  const pagination: PaginationState = {
    pageIndex: state.page - 1,
    pageSize: state.limit,
  };

  const setPagination: OnChangeFn<PaginationState> = (updater) => {
    const next = typeof updater === "function" ? updater(pagination) : updater;
    const sizeChanged = next.pageSize !== state.limit;
    replace({
      limit: next.pageSize,
      page: sizeChanged ? 1 : next.pageIndex + 1,
    });
  };

  const sorting: SortingState = state.sort
    ? [{ id: state.sort, desc: state.order === "desc" }]
    : [];

  const setSorting: OnChangeFn<SortingState> = (updater) => {
    const next = typeof updater === "function" ? updater(sorting) : updater;
    const first = next[0];
    replace({
      sort: first?.id,
      order: first ? (first.desc ? "desc" : "asc") : undefined,
      page: 1,
    });
  };

  const setFilter = (key: keyof F & string, value: string) =>
    replace({ filters: { ...latest.current.filters, [key]: value }, page: 1 });

  return {
    /** Texto del input de búsqueda (actualizado en cada tecla). */
    searchInput,
    setSearch: setSearchInput,
    filters: state.filters,
    setFilter,
    pagination,
    setPagination,
    sorting,
    setSorting,
    /** Parámetros listos para la API (la búsqueda ya está "asentada"). */
    params: {
      page: state.page,
      limit: state.limit,
      search: state.q || undefined,
      sort: state.sort,
      order: state.order,
    },
  };
}
