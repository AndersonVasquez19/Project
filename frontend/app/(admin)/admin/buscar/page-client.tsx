"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { useDeferredValue, useState } from "react";
import { Input } from "@/components/ui/input";
import { getApiErrorMessage } from "@/lib/api-error";
import { getAll as getCursos } from "@/services/cursosService";
import { getAll as getEstudiantes } from "@/services/estudiantesService";
import { getAll as getMatriculas } from "@/services/matriculasService";
import { getAll as getServicios } from "@/services/serviciosService";

export function BuscarPageClient({
  permissions,
}: {
  permissions: string[];
}) {
  const [search, setSearch] = useState("");
  const term = useDeferredValue(search.trim());
  const enabled = term.length >= 2;
  const students = useQuery({
    queryKey: ["global-search-students", term],
    queryFn: () =>
      getEstudiantes({ page: 1, limit: 5, search: term }),
    enabled: enabled && permissions.includes("estudiantes.ver"),
  });
  const courses = useQuery({
    queryKey: ["global-search-courses", term],
    queryFn: () => getCursos({ page: 1, limit: 5, search: term }),
    enabled: enabled && permissions.includes("cursos.ver"),
  });
  const enrollments = useQuery({
    queryKey: ["global-search-enrollments", term],
    queryFn: () => getMatriculas({ page: 1, limit: 5, search: term }),
    enabled: enabled && permissions.includes("matriculas.ver"),
  });
  const services = useQuery({
    queryKey: ["global-search-services", term],
    queryFn: () => getServicios({ page: 1, limit: 5, search: term }),
    enabled: enabled && permissions.includes("servicios.ver"),
  });
  const errors = [students.error, courses.error, enrollments.error, services.error].filter(Boolean);
  const fetching =
    students.isFetching ||
    courses.isFetching ||
    enrollments.isFetching ||
    services.isFetching;
  const resultCount =
    (students.data?.data.length ?? 0) +
    (courses.data?.data.length ?? 0) +
    (enrollments.data?.data.length ?? 0) +
    (services.data?.data.length ?? 0);

  return (
    <section className="mx-auto max-w-5xl space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#176B9A]">
          Herramientas
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#172B3A] sm:text-3xl">
          Búsqueda global
        </h1>
        <p className="mt-2 text-sm leading-6 text-[#64748B]">
          Busca por DNI, nombre, curso, matrícula o servicio dentro de los módulos a los que tienes acceso.
        </p>
      </header>

      <div className="relative">
        <Search
          aria-hidden="true"
          className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#64748B]"
        />
        <Input
          aria-label="Buscar en el sistema"
          autoComplete="off"
          className="h-12 pl-10 text-base"
          placeholder="Escribe al menos dos caracteres…"
          value={search}
          onChange={(event) => setSearch(event.currentTarget.value)}
        />
      </div>

      {!enabled ? (
        <p className="rounded-2xl border border-dashed border-[#CBD5E1] bg-white px-4 py-10 text-center text-sm text-[#64748B]">
          Ingresa al menos dos caracteres para iniciar la búsqueda.
        </p>
      ) : (
        <>
          {errors.length > 0 && (
            <div className="space-y-2" role="alert">
              {errors.map((error, index) => (
                <p
                  key={index}
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
                >
                  {getApiErrorMessage(error, "No se pudo consultar uno de los módulos.")}
                </p>
              ))}
            </div>
          )}
          {fetching ? (
            <p className="rounded-2xl border border-[#E2E8F0] bg-white px-4 py-10 text-center text-sm text-[#64748B]" role="status">
              Buscando…
            </p>
          ) : resultCount === 0 ? (
            <p className="rounded-2xl border border-[#E2E8F0] bg-white px-4 py-10 text-center text-sm text-[#64748B]">
              No se encontraron coincidencias en los módulos disponibles.
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {(students.data?.data.length ?? 0) > 0 && (
                <ResultGroup title="Estudiantes">
                  {(students.data?.data ?? []).map((student) => (
                    <ResultItem
                      key={student.id}
                      href="/admin/estudiantes"
                      title={`${student.nombres} ${student.apellidos}`}
                      description={`${student.dni}${student.email ? ` · ${student.email}` : ""}`}
                    />
                  ))}
                </ResultGroup>
              )}
              {(courses.data?.data.length ?? 0) > 0 && (
                <ResultGroup title="Cursos">
                  {(courses.data?.data ?? []).map((course) => (
                    <ResultItem
                      key={course.id}
                      href="/admin/cursos"
                      title={course.nombre}
                      description={`${course.codigo} · ${course.modalidad} · ${course.estado}`}
                    />
                  ))}
                </ResultGroup>
              )}
              {(enrollments.data?.data.length ?? 0) > 0 && (
                <ResultGroup title="Matrículas">
                  {(enrollments.data?.data ?? []).map((enrollment) => (
                    <ResultItem
                      key={enrollment.id}
                      href={`/admin/matriculas/${encodeURIComponent(enrollment.id)}/pagos`}
                      title={`${enrollment.estudiante?.nombres ?? ""} ${enrollment.estudiante?.apellidos ?? ""}`.trim() || "Matrícula"}
                      description={`${enrollment.curso?.codigo ?? ""} · ${enrollment.estado}`}
                    />
                  ))}
                </ResultGroup>
              )}
              {(services.data?.data.length ?? 0) > 0 && (
                <ResultGroup title="Servicios">
                  {(services.data?.data ?? []).map((service) => (
                    <ResultItem
                      key={service.id}
                      href="/admin/servicios"
                      title={service.nombre}
                      description={`${service.codigo} · ${service.categoria ?? "Sin categoría"}`}
                    />
                  ))}
                </ResultGroup>
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
}

function ResultGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-[0_2px_10px_rgba(10,37,64,0.04)]">
      <h2 className="border-b border-[#E2E8F0] px-4 py-3 text-sm font-semibold text-[#172B3A]">
        {title}
      </h2>
      <ul className="divide-y divide-[#E2E8F0]">{children}</ul>
    </section>
  );
}

function ResultItem({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description: string;
}) {
  return (
    <li>
      <Link
        className="block px-4 py-3 hover:bg-[#F8FAFC] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#176B9A]"
        href={href}
      >
        <span className="block font-medium text-[#172B3A]">{title}</span>
        <span className="mt-0.5 block text-xs text-[#64748B]">{description}</span>
      </Link>
    </li>
  );
}
