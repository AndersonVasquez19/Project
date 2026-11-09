// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const nav = vi.hoisted(() => ({
  replace: vi.fn(),
  search: "",
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: nav.replace }),
  usePathname: () => "/admin/estudiantes",
  useSearchParams: () => new URLSearchParams(nav.search),
}));

import { useUrlListState } from "./use-url-list-state";

const FILTERS = { estado: "", vista: "activos" };

function setup(search = "") {
  nav.search = search;
  return renderHook(() => useUrlListState({ filters: FILTERS }));
}

describe("useUrlListState", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    nav.replace.mockReset();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("lee el estado inicial de la URL", () => {
    const { result } = setup("page=3&limit=20&q=ana&sort=dni&order=desc&vista=eliminados");

    expect(result.current.params).toEqual({
      page: 3,
      limit: 20,
      search: "ana",
      sort: "dni",
      order: "desc",
    });
    expect(result.current.filters.vista).toBe("eliminados");
    expect(result.current.pagination).toEqual({ pageIndex: 2, pageSize: 20 });
    expect(result.current.sorting).toEqual([{ id: "dni", desc: true }]);
    expect(result.current.searchInput).toBe("ana");
  });

  it("escribe la búsqueda en la URL solo tras el debounce y vuelve a la página 1", () => {
    const { result } = setup("page=4");

    act(() => result.current.setSearch("  web "));
    expect(result.current.searchInput).toBe("  web ");
    expect(nav.replace).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(nav.replace).toHaveBeenCalledWith("/admin/estudiantes?q=web", {
      scroll: false,
    });
  });

  it("al cambiar un filtro vuelve a la página 1 y omite los valores por defecto", () => {
    const { result } = setup("page=4&estado=activo");

    act(() => result.current.setFilter("vista", "eliminados"));
    expect(nav.replace).toHaveBeenLastCalledWith(
      "/admin/estudiantes?estado=activo&vista=eliminados",
      { scroll: false },
    );

    act(() => result.current.setFilter("estado", ""));
    expect(nav.replace).toHaveBeenLastCalledWith(
      "/admin/estudiantes?vista=eliminados",
      { scroll: false },
    );
  });

  it("al ordenar escribe sort y order; sin orden los quita", () => {
    const { result } = setup();

    act(() => result.current.setSorting([{ id: "dni", desc: true }]));
    expect(nav.replace).toHaveBeenLastCalledWith(
      "/admin/estudiantes?sort=dni&order=desc",
      { scroll: false },
    );

    act(() => result.current.setSorting([]));
    expect(nav.replace).toHaveBeenLastCalledWith("/admin/estudiantes", {
      scroll: false,
    });
  });

  it("al cambiar el tamaño de página vuelve a la primera", () => {
    const { result } = setup("page=5");

    act(() => result.current.setPagination({ pageIndex: 4, pageSize: 50 }));
    expect(nav.replace).toHaveBeenLastCalledWith("/admin/estudiantes?limit=50", {
      scroll: false,
    });
  });

  it("al paginar conserva el resto del estado", () => {
    const { result } = setup("q=ana&vista=eliminados");

    act(() => result.current.setPagination({ pageIndex: 2, pageSize: 10 }));
    expect(nav.replace).toHaveBeenLastCalledWith(
      "/admin/estudiantes?page=3&q=ana&vista=eliminados",
      { scroll: false },
    );
  });
});
