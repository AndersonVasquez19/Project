// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useListState } from "./use-list-state";

describe("useListState", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("empieza en la primera página sin búsqueda ni orden", () => {
    const { result } = renderHook(() => useListState());

    expect(result.current.params).toEqual({
      page: 1,
      limit: 10,
      search: undefined,
      sort: undefined,
      order: undefined,
    });
  });

  it("aplica la búsqueda con debounce y vuelve a la página 1", () => {
    const { result } = renderHook(() => useListState({ debounceMs: 300 }));

    act(() => result.current.setPagination({ pageIndex: 3, pageSize: 10 }));
    act(() => result.current.setSearch("  web "));

    // Aún no se asienta: no hay petición por cada tecla.
    expect(result.current.params.search).toBeUndefined();
    expect(result.current.params.page).toBe(1);

    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(result.current.params.search).toBe("web");
  });

  it("traduce el orden de la tabla a sort y order", () => {
    const { result } = renderHook(() => useListState());

    act(() => result.current.setSorting([{ id: "nombre", desc: true }]));
    expect(result.current.params).toMatchObject({ sort: "nombre", order: "desc" });

    act(() => result.current.setSorting([{ id: "codigo", desc: false }]));
    expect(result.current.params).toMatchObject({ sort: "codigo", order: "asc" });

    act(() => result.current.setSorting([]));
    expect(result.current.params.sort).toBeUndefined();
  });
});
