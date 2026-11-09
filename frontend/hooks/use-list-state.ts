"use client";

import type {
  OnChangeFn,
  PaginationState,
  SortingState,
} from "@tanstack/react-table";
import { useCallback, useState } from "react";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

type Options = {
  pageSize?: number;
  debounceMs?: number;
};

/**
 * Estado común de las pantallas de listado: paginación, búsqueda con debounce
 * y orden. Cualquier cambio de búsqueda u orden vuelve a la primera página.
 */
export function useListState({ pageSize = 10, debounceMs = 300 }: Options = {}) {
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize,
  });
  const [search, setSearchValue] = useState("");
  const [sorting, setSortingValue] = useState<SortingState>([]);
  const debouncedSearch = useDebouncedValue(search.trim(), debounceMs);

  const resetPage = useCallback(
    () => setPagination((current) => ({ ...current, pageIndex: 0 })),
    [],
  );

  const setSearch = useCallback(
    (value: string) => {
      setSearchValue(value);
      resetPage();
    },
    [resetPage],
  );

  const setSorting: OnChangeFn<SortingState> = useCallback(
    (updater) => {
      setSortingValue(updater);
      resetPage();
    },
    [resetPage],
  );

  const activeSort = sorting[0];

  return {
    pagination,
    setPagination,
    resetPage,
    search,
    setSearch,
    /** Texto ya "asentado": úsalo en la queryKey y en la petición. */
    debouncedSearch,
    sorting,
    setSorting,
    /** Parámetros listos para la API (`sort` y `order`). */
    params: {
      page: pagination.pageIndex + 1,
      limit: pagination.pageSize,
      search: debouncedSearch || undefined,
      sort: activeSort?.id,
      order: activeSort ? (activeSort.desc ? ("desc" as const) : ("asc" as const)) : undefined,
    },
  };
}
