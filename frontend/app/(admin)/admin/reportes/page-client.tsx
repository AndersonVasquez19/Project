"use client";

import { strToU8, zipSync } from "fflate";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getApiErrorMessage } from "@/lib/api-error";
import { getAll as getCursos } from "@/services/cursosService";
import { getMatriculas } from "@/services/reportesService";
import type {
  EstadoReporteMatricula,
  ReporteMatriculaQuery,
  ReporteMatriculas,
  ReporteMatriculaRow,
} from "@/types/reporte";

function money(value: string, currency: "PEN" | "USD" = "PEN"): string {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency,
  }).format(Number(value));
}

function fileDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function filterDescription(
  filters: ReporteMatriculaQuery,
  courseName?: string,
): string {
  return [
    filters.desde ? `Desde ${filters.desde}` : null,
    filters.hasta ? `Hasta ${filters.hasta}` : null,
    filters.estado ? `Estado ${filters.estado}` : null,
    courseName ? `Curso ${courseName}` : null,
  ]
    .filter(Boolean)
    .join(" · ") || "Sin filtros";
}

function xmlEscape(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function columnName(index: number): string {
  let value = index;
  let result = "";
  while (value > 0) {
    const remainder = (value - 1) % 26;
    result = String.fromCharCode(65 + remainder) + result;
    value = Math.floor((value - 1) / 26);
  }
  return result;
}

function xlsxCell(
  reference: string,
  value: string | number,
  styleId = 0,
): string {
  if (typeof value === "number") {
    return `<c r="${reference}" s="${styleId}" t="n"><v>${value}</v></c>`;
  }
  return `<c r="${reference}" s="${styleId}" t="inlineStr"><is><t xml:space="preserve">${xmlEscape(value)}</t></is></c>`;
}

async function exportExcel(
  rows: ReporteMatriculaRow[],
  summary: { matriculas: number; total: string; pagado: string; saldo: string },
  filters: ReporteMatriculaQuery,
  courseName?: string,
  presentation?: ReporteMatriculas["presentacion"],
) {
  const sheetRows: (string | number)[][] = [
    [`${presentation?.nombre_reportes ?? "Horus"} | REPORTE DE MATRÍCULAS Y PAGOS`],
    ["Generado", new Date().toLocaleString("es-PE")],
    [
    "Filtros",
    filterDescription(filters, courseName),
    ],
    [],
    ["RESUMEN", "Matrículas", "Costo total", "Pagado", "Saldo"],
    [
    "Resultado",
    summary.matriculas,
    Number(summary.total),
    Number(summary.pagado),
    Number(summary.saldo),
    ],
    [],
    [
    "Fecha",
    "Estado",
    "DNI",
    "Estudiante",
    "Código",
    "Curso",
    "Costo (S/)",
    "Pagado (S/)",
    "Saldo (S/)",
    "Crédito (S/)",
    "ID matrícula",
    ],
    ...rows.map((item) => [
      item.fecha_matricula,
      item.estado,
      item.estudiante_dni,
      item.estudiante,
      item.curso_codigo,
      item.curso,
      Number(item.total),
      Number(item.pagado),
      Number(item.saldo),
      Number(item.credito),
      item.id,
    ]),
  ];
  const xmlRows = sheetRows
    .map((row, rowIndex) => {
      const excelRow = rowIndex + 1;
      const styleId = excelRow === 1 ? 1 : excelRow === 5 || excelRow === 8 ? 2 : 0;
      const cells = row
        .map((value, columnIndex) => {
          const excelColumn = columnIndex + 1;
          const isMoney =
            (excelRow === 6 && excelColumn >= 3 && excelColumn <= 5) ||
            (excelRow >= 9 && excelColumn >= 7 && excelColumn <= 10);
          return xlsxCell(
            `${columnName(excelColumn)}${excelRow}`,
            value,
            isMoney ? 3 : styleId,
          );
        })
        .join("");
      const height = excelRow === 1 ? ' ht="30" customHeight="1"' : "";
      return `<row r="${excelRow}"${height}>${cells}</row>`;
    })
    .join("");
  const lastRow = sheetRows.length;
  const columnWidths = [14, 14, 14, 28, 14, 32, 16, 16, 16, 16, 16];
  const cols = columnWidths
    .map(
      (width, index) =>
        `<col min="${index + 1}" max="${index + 1}" width="${width}" customWidth="1"/>`,
    )
    .join("");
  const sheetXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <dimension ref="A1:K${lastRow}"/>
  <sheetViews><sheetView workbookViewId="0"><pane ySplit="8" topLeftCell="A9" activePane="bottomLeft" state="frozen"/><selection pane="bottomLeft" activeCell="A9" sqref="A9"/></sheetView></sheetViews>
  <sheetFormatPr defaultRowHeight="18"/>
  <cols>${cols}</cols>
  <sheetData>${xmlRows}</sheetData>
  <autoFilter ref="A8:K${lastRow}"/>
  <mergeCells count="1"><mergeCell ref="A1:K1"/></mergeCells>
  <pageMargins left="0.3" right="0.3" top="0.5" bottom="0.5" header="0.2" footer="0.2"/>
</worksheet>`;
  const currencyLabel = presentation?.moneda === "USD" ? "$" : "S/";
  const currencyFormat = xmlEscape(
    `"${currencyLabel} "#,##0.00;[Red]-"${currencyLabel} "#,##0.00`,
  );
  const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <numFmts count="1"><numFmt numFmtId="164" formatCode="${currencyFormat}"/></numFmts>
  <fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><color rgb="FFFFFFFF"/><sz val="14"/><name val="Calibri"/></font></fonts>
  <fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF0A2540"/><bgColor indexed="64"/></patternFill></fill></fills>
  <borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="4"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment vertical="center"/></xf><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/><xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/></cellXfs>
  <cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`;
  const workbookXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <bookViews><workbookView/></bookViews>
  <sheets><sheet name="Matrículas y pagos" sheetId="1" r:id="rId1"/></sheets>
</workbook>`;
  const workbookRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;
  const rootRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;
  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`;
  const buffer = zipSync({
    "[Content_Types].xml": strToU8(contentTypes),
    "_rels/.rels": strToU8(rootRels),
    "xl/workbook.xml": strToU8(workbookXml),
    "xl/_rels/workbook.xml.rels": strToU8(workbookRels),
    "xl/worksheets/sheet1.xml": strToU8(sheetXml),
    "xl/styles.xml": strToU8(stylesXml),
  });
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `horus-reporte-matriculas-${fileDate()}.xlsx`;
  anchor.click();
  // Diferido: revocar de inmediato puede cancelar la descarga en algunos navegadores.
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

function exportPdf(
  rows: ReporteMatriculaRow[],
  summary: { matriculas: number; total: string; pagado: string; saldo: string },
  filters: ReporteMatriculaQuery,
  courseName?: string,
  presentation?: ReporteMatriculas["presentacion"],
) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  doc.setFillColor(10, 37, 64);
  doc.rect(0, 0, 297, 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(15);
  doc.text(
    `${presentation?.nombre_reportes ?? "Horus"} | REPORTE DE MATRÍCULAS Y PAGOS`,
    14,
    12,
  );
  doc.setFontSize(8);
  doc.text(`Generado: ${new Date().toLocaleString("es-PE")}  ·  ${filterDescription(filters, courseName)}`, 14, 21);
  doc.setTextColor(23, 43, 58);
  doc.setFontSize(9);
  doc.text(
    `Matrículas: ${summary.matriculas}     Costo: ${money(summary.total, presentation?.moneda)}     Pagado: ${money(summary.pagado, presentation?.moneda)}     Saldo: ${money(summary.saldo, presentation?.moneda)}`,
    14,
    36,
  );

  autoTable(doc, {
    startY: 41,
    head: [[
      "Fecha",
      "Estado",
      "DNI",
      "Estudiante",
      "Código",
      "Curso",
      "Costo",
      "Pagado",
      "Saldo",
      "Crédito",
    ]],
    body: rows.map((row) => [
      row.fecha_matricula,
      row.estado,
      row.estudiante_dni,
      row.estudiante,
      row.curso_codigo,
      row.curso,
      money(row.total, presentation?.moneda),
      money(row.pagado, presentation?.moneda),
      money(row.saldo, presentation?.moneda),
      money(row.credito, presentation?.moneda),
    ]),
    theme: "grid",
    styles: { fontSize: 7, cellPadding: 2, textColor: [23, 43, 58] },
    headStyles: { fillColor: [10, 37, 64], textColor: [255, 255, 255] },
    alternateRowStyles: { fillColor: [245, 248, 251] },
    margin: { left: 14, right: 14 },
  });
  const pageCount = doc.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    const footer = [
      presentation?.pie || null,
      `Página ${page} de ${pageCount}`,
    ]
      .filter(Boolean)
      .join(" · ");
    doc.text(footer, 14, doc.internal.pageSize.getHeight() - 6);
  }
  doc.save(`horus-reporte-matriculas-${fileDate()}.pdf`);
}

export function ReportesPageClient({ canView }: { canView: boolean }) {
  const [filters, setFilters] = useState<ReporteMatriculaQuery>({});
  const [draftFilters, setDraftFilters] =
    useState<ReporteMatriculaQuery>(filters);
  const [exportError, setExportError] = useState<string | null>(null);
  const courseQuery = useQuery({
    queryKey: ["report-courses"],
    queryFn: async () => {
      // La API pagina de 100 en 100: se leen todas las páginas para que ningún
      // curso quede fuera del filtro (tope de seguridad: 20 páginas).
      const first = await getCursos({ page: 1, limit: 100 });
      const extraPages = Math.max(0, Math.min(first.meta.totalPages, 20) - 1);
      const rest = await Promise.all(
        Array.from({ length: extraPages }, (_, index) =>
          getCursos({ page: index + 2, limit: 100 }),
        ),
      );
      return [first, ...rest].flatMap((page) => page.data);
    },
    enabled: canView,
  });
  const reportQuery = useQuery({
    queryKey: ["report-matriculas", filters],
    queryFn: () => getMatriculas(filters),
    enabled: canView,
  });
  const report = reportQuery.data;
  const loading = reportQuery.isPending;
  const exportsDisabled = !report || report.data.length === 0;
  const filterStatus = useMemo(
    () => reportQuery.error ?? courseQuery.error,
    [courseQuery.error, reportQuery.error],
  );
  const selectedCourse = (courseQuery.data ?? []).find(
    (course) => course.id === filters.curso_id,
  );

  function downloadExcel() {
    if (!report) return;
    setExportError(null);
    void exportExcel(
      report.data,
      report.resumen,
      filters,
      selectedCourse?.nombre,
      report.presentacion,
    )
      .catch(() => setExportError("No se pudo generar el archivo Excel. Inténtalo nuevamente."));
  }

  function downloadPdf() {
    if (!report) return;
    setExportError(null);
    try {
      exportPdf(
        report.data,
        report.resumen,
        filters,
        selectedCourse?.nombre,
        report.presentacion,
      );
    } catch {
      setExportError("No se pudo generar el archivo PDF. Inténtalo nuevamente.");
    }
  }

  if (!canView) {
    return (
      <section className="rounded-2xl border border-[#E2E8F0] bg-white p-8 text-center">
        <h1 className="text-xl font-bold text-[#172B3A]">Acceso restringido</h1>
        <p className="mt-2 text-sm text-[#64748B]">
          No tienes permiso para consultar reportes.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#176B9A]">
            Operación interna
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#172B3A] sm:text-3xl">
            Reportes
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#64748B]">
            Revisa matrículas, pagos y saldos con filtros y exporta un informe listo para compartir.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={exportsDisabled}
            onClick={downloadExcel}
          >
            <FileSpreadsheet aria-hidden="true" /> Excel
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={exportsDisabled}
            onClick={downloadPdf}
          >
            <FileText aria-hidden="true" /> PDF
          </Button>
        </div>
      </header>

      {exportError && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {exportError}
        </p>
      )}

      <form
        className="grid gap-3 rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-[0_2px_10px_rgba(10,37,64,0.04)] sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1.5fr_1fr_auto]"
        onSubmit={(event) => {
          event.preventDefault();
          setFilters(draftFilters);
          setExportError(null);
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="reporte-desde">Desde</Label>
          <Input
            id="reporte-desde"
            type="date"
            value={draftFilters.desde ?? ""}
            onChange={(event) =>
              setDraftFilters((current) => ({
                ...current,
                desde: event.currentTarget.value || undefined,
              }))
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="reporte-hasta">Hasta</Label>
          <Input
            id="reporte-hasta"
            type="date"
            value={draftFilters.hasta ?? ""}
            onChange={(event) =>
              setDraftFilters((current) => ({
                ...current,
                hasta: event.currentTarget.value || undefined,
              }))
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="reporte-curso">Curso</Label>
          <select
            id="reporte-curso"
            className="admin-select"
            value={draftFilters.curso_id ?? ""}
            onChange={(event) =>
              setDraftFilters((current) => ({
                ...current,
                curso_id: event.currentTarget.value || undefined,
              }))
            }
          >
            <option value="">Todos los cursos</option>
            {(courseQuery.data ?? []).map((course) => (
              <option key={course.id} value={course.id}>
                {course.codigo} · {course.nombre}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="reporte-estado">Estado</Label>
          <select
            id="reporte-estado"
            className="admin-select"
            value={draftFilters.estado ?? ""}
            onChange={(event) =>
              setDraftFilters((current) => ({
                ...current,
                estado:
                  (event.currentTarget.value as EstadoReporteMatricula) ||
                  undefined,
              }))
            }
          >
            <option value="">Todos los estados</option>
            <option value="pendiente">Pendiente</option>
            <option value="pagada">Pagada</option>
            <option value="anulada">Anulada</option>
          </select>
        </div>
        <div className="flex items-end">
          <Button type="submit" className="admin-btn-primary w-full">
            <Download aria-hidden="true" /> Aplicar
          </Button>
        </div>
      </form>

      {filterStatus && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {getApiErrorMessage(filterStatus, "No fue posible cargar el reporte.")}
          <button
            type="button"
            className="ml-2 font-semibold underline"
            onClick={() => void reportQuery.refetch()}
          >
            Reintentar
          </button>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Matrículas", String(report?.resumen.matriculas ?? "—")],
          ["Costo total", report ? money(report.resumen.total, report.presentacion.moneda) : "—"],
          ["Pagado", report ? money(report.resumen.pagado, report.presentacion.moneda) : "—"],
          ["Saldo pendiente", report ? money(report.resumen.saldo, report.presentacion.moneda) : "—"],
        ].map(([label, value]) => (
          <div
            key={label}
            className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-[0_2px_10px_rgba(10,37,64,0.04)]"
          >
            <p className="text-sm text-[#64748B]">{label}</p>
            <p className="mt-1 text-xl font-bold text-[#172B3A]">{value}</p>
          </div>
        ))}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-[#E2E8F0] bg-white shadow-[0_2px_10px_rgba(10,37,64,0.04)]">
        <table className="w-full min-w-[1000px] border-collapse text-left text-sm">
          <thead className="bg-[#F8FAFC] text-xs uppercase tracking-wide text-[#64748B]">
            <tr>
              {["Fecha", "Estado", "Estudiante", "Curso", "Costo", "Pagado", "Saldo"].map((item) => (
                <th key={item} className="px-4 py-3 font-semibold">{item}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="px-4 py-10 text-center text-[#64748B]" colSpan={7}>Cargando reporte…</td></tr>
            ) : !report?.data.length ? (
              <tr><td className="px-4 py-10 text-center text-[#64748B]" colSpan={7}>No hay matrículas para los filtros seleccionados.</td></tr>
            ) : report.data.map((row) => (
              <tr key={row.id} className="border-t border-[#E2E8F0]">
                <td className="px-4 py-3">{row.fecha_matricula}</td>
                <td className="px-4 py-3 capitalize">{row.estado}</td>
                <td className="px-4 py-3">
                  <span className="block font-medium text-[#172B3A]">{row.estudiante}</span>
                  <span className="text-xs text-[#64748B]">{row.estudiante_dni}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="block font-medium text-[#172B3A]">{row.curso}</span>
                  <span className="text-xs text-[#64748B]">{row.curso_codigo}</span>
                </td>
                <td className="px-4 py-3">{money(row.total, report.presentacion.moneda)}</td>
                <td className="px-4 py-3">{money(row.pagado, report.presentacion.moneda)}</td>
                <td className="px-4 py-3 font-medium">{money(row.saldo, report.presentacion.moneda)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
