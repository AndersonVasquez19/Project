/** Estado de un listado serializado en la URL (?page=2&q=ana&sort=dni&order=desc&estado=activo). */
export type ListUrlState<F extends Record<string, string>> = {
  page: number;
  limit: number;
  q: string;
  sort?: string;
  order?: "asc" | "desc";
  filters: F;
};

export type ListUrlConfig<F extends Record<string, string>> = {
  limit: number;
  limits: readonly number[];
  /** Valores por defecto de cada filtro; un filtro igual a su defecto no se escribe en la URL. */
  filters: F;
};

type Params = { get(name: string): string | null };

const MAX_QUERY = 120;

export function parseListUrl<F extends Record<string, string>>(
  params: Params,
  config: ListUrlConfig<F>,
): ListUrlState<F> {
  const page = Number(params.get("page"));
  const limit = Number(params.get("limit"));
  const sort = params.get("sort");
  const order = params.get("order");

  const filters = Object.fromEntries(
    Object.entries(config.filters).map(([key, fallback]) => {
      const value = params.get(key);
      return [key, value ? value.slice(0, 60) : fallback];
    }),
  ) as F;

  return {
    page: Number.isInteger(page) && page >= 1 ? page : 1,
    limit: config.limits.includes(limit) ? limit : config.limit,
    q: (params.get("q") ?? "").trim().slice(0, MAX_QUERY),
    sort: sort && /^[a-z_]{1,30}$/.test(sort) ? sort : undefined,
    order:
      sort && (order === "asc" || order === "desc") ? order : undefined,
    filters,
  };
}

/** Query string (sin "?") con solo lo que difiere de los valores por defecto. */
export function buildListQuery<F extends Record<string, string>>(
  state: ListUrlState<F>,
  config: ListUrlConfig<F>,
): string {
  const query = new URLSearchParams();

  if (state.page > 1) query.set("page", String(state.page));
  if (state.limit !== config.limit) query.set("limit", String(state.limit));
  if (state.q) query.set("q", state.q);
  if (state.sort) {
    query.set("sort", state.sort);
    query.set("order", state.order ?? "asc");
  }
  for (const [key, fallback] of Object.entries(config.filters)) {
    const value = state.filters[key];
    if (value && value !== fallback) query.set(key, value);
  }

  return query.toString();
}
