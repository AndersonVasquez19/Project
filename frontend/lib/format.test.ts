import { describe, expect, it } from "vitest";
import { formatDate, formatDateTime, formatMoney } from "./format";

describe("format", () => {
  it("formatDate no desplaza el día de fechas sin hora", () => {
    expect(formatDate("2026-11-08")).toMatch(/08/);
    expect(formatDate("2026-01-01")).toMatch(/01/);
  });

  it("devuelve un guion para valores vacíos o inválidos", () => {
    expect(formatDate(null)).toBe("—");
    expect(formatDate("no-es-fecha")).toBe("—");
    expect(formatDateTime(undefined)).toBe("—");
    expect(formatMoney("")).toBe("—");
    expect(formatMoney("abc")).toBe("—");
  });

  it("formatMoney acepta texto decimal o número", () => {
    const text = formatMoney("1250.5");
    expect(text).toContain("1,250.50");
    expect(formatMoney(1250.5)).toBe(text);
  });
});
