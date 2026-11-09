const LOCALE = "es-PE";

function toDate(value: string | Date): Date | null {
  // Las fechas sin hora (YYYY-MM-DD) se fijan a mediodía para evitar saltos de día por zona horaria.
  const date =
    typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? new Date(`${value}T12:00:00`)
      : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** 08 nov 2026 */
export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const date = toDate(value);
  return date
    ? new Intl.DateTimeFormat(LOCALE, {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(date)
    : "—";
}

/** 08 nov 2026, 10:37 p. m. */
export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const date = toDate(value);
  return date
    ? new Intl.DateTimeFormat(LOCALE, {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(date)
    : "—";
}

/** S/ 1,250.50 — acepta número o texto decimal ("1250.50"). */
export function formatMoney(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return "—";
  const amount = typeof value === "number" ? value : Number(value);
  return Number.isFinite(amount)
    ? new Intl.NumberFormat(LOCALE, {
        style: "currency",
        currency: "PEN",
      }).format(amount)
    : "—";
}
