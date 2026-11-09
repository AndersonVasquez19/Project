import { describe, expect, it } from "vitest";
import { buildListQuery, parseListUrl, type ListUrlConfig } from "./list-url";

const config: ListUrlConfig<{ estado: string; vista: string }> = {
  limit: 10,
  limits: [10, 20, 50],
  filters: { estado: "", vista: "activos" },
};

const parse = (query: string) =>
  parseListUrl(new URLSearchParams(query), config);

describe("parseListUrl", () => {
  it("usa los valores por defecto con una URL vacía", () => {
    expect(parse("")).toEqual({
      page: 1,
      limit: 10,
      q: "",
      sort: undefined,
      order: undefined,
      filters: { estado: "", vista: "activos" },
    });
  });

  it("lee página, búsqueda, orden y filtros", () => {
    expect(parse("page=3&limit=20&q=ana&sort=dni&order=desc&estado=activo&vista=eliminados")).toEqual({
      page: 3,
      limit: 20,
      q: "ana",
      sort: "dni",
      order: "desc",
      filters: { estado: "activo", vista: "eliminados" },
    });
  });

  it("descarta valores inválidos en vez de fallar", () => {
    const state = parse("page=-4&limit=999&sort=DROP TABLE&order=sideways");
    expect(state.page).toBe(1);
    expect(state.limit).toBe(10);
    expect(state.sort).toBeUndefined();
    expect(state.order).toBeUndefined();
    expect(parse("page=abc").page).toBe(1);
    expect(parse("page=1.5").page).toBe(1);
  });

  it("ignora order si no hay sort y recorta la búsqueda", () => {
    expect(parse("order=desc").order).toBeUndefined();
    expect(parse(`q=${"a".repeat(500)}`).q).toHaveLength(120);
  });
});

describe("buildListQuery", () => {
  it("omite todo lo que coincide con el valor por defecto", () => {
    expect(buildListQuery(parse(""), config)).toBe("");
    expect(buildListQuery(parse("page=1&limit=10&vista=activos"), config)).toBe("");
  });

  it("serializa solo lo distinto y es reversible", () => {
    const state = parse("page=2&q=ana&sort=dni&order=desc&vista=eliminados");
    const query = buildListQuery(state, config);

    expect(query).toBe("page=2&q=ana&sort=dni&order=desc&vista=eliminados");
    expect(parse(query)).toEqual(state);
  });

  it("escribe order=asc cuando solo hay sort", () => {
    expect(buildListQuery({ ...parse(""), sort: "dni" }, config)).toBe(
      "sort=dni&order=asc",
    );
  });
});
