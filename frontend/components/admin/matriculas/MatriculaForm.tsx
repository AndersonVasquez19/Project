"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getApiErrorMessage } from "@/lib/api-error";
import { getAll as getCursos } from "@/services/cursosService";
import { create, update } from "@/services/matriculasService";
import { getAll as getEstudiantes } from "@/services/estudiantesService";
import type { Matricula, MatriculaInput } from "@/types/matricula";

const matriculaSchema = z.object({
  estudiante_id: z.string().min(1, "Selecciona un estudiante."),
  curso_id: z.string().min(1, "Selecciona un curso."),
  fecha_matricula: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Ingresa una fecha válida.")
    .refine(isCalendarDate, "Ingresa una fecha válida."),
  estado: z.enum(["pendiente", "pagada", "anulada"]),
  observaciones: z.string(),
});

type FormValues = z.infer<typeof matriculaSchema>;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  matricula?: Matricula;
};

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

function isCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export function MatriculaForm({ open, onOpenChange, matricula }: Props) {
  const queryClient = useQueryClient();
  const [studentSearch, setStudentSearch] = useState("");
  const [courseSearch, setCourseSearch] = useState("");
  const deferredStudentSearch = useDeferredValue(studentSearch.trim());
  const deferredCourseSearch = useDeferredValue(courseSearch.trim());
  const studentsQuery = useQuery({
    queryKey: ["matricula-estudiantes", deferredStudentSearch],
    queryFn: () =>
      getEstudiantes({
        page: 1,
        limit: 100,
        estado: "activo",
        search: deferredStudentSearch || undefined,
      }),
    enabled: open,
  });
  const coursesQuery = useQuery({
    queryKey: ["matricula-cursos", deferredCourseSearch],
    queryFn: () =>
      getCursos({
        page: 1,
        limit: 100,
        estado: "activo",
        search: deferredCourseSearch || undefined,
      }),
    enabled: open,
  });
  const mutation = useMutation({
    mutationFn: (input: MatriculaInput) =>
      matricula ? update(matricula.id, input) : create(input),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["matriculas"] }),
        queryClient.invalidateQueries({ queryKey: ["cursos"] }),
      ]);
      onOpenChange(false);
    },
  });
  const resetMutation = mutation.reset;
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(matriculaSchema),
    defaultValues: {
      estudiante_id: "",
      curso_id: "",
      fecha_matricula: todayUtc(),
      estado: "pendiente",
      observaciones: "",
    },
  });

  useEffect(() => {
    reset({
      estudiante_id: matricula?.estudiante_id ?? "",
      curso_id: matricula?.curso_id ?? "",
      fecha_matricula: matricula?.fecha_matricula.slice(0, 10) ?? todayUtc(),
      estado: matricula?.estado ?? "pendiente",
      observaciones: matricula?.observaciones ?? "",
    });
    resetMutation();
  }, [matricula, open, reset, resetMutation]);

  const studentOptions = useMemo(() => {
    const options = studentsQuery.data?.data ?? [];
    if (
      matricula?.estudiante &&
      !options.some((item) => item.id === matricula.estudiante_id)
    ) {
      return [...options, matricula.estudiante];
    }
    return options;
  }, [matricula, studentsQuery.data]);

  const courseOptions = useMemo(() => {
    const options = (coursesQuery.data?.data ?? []).filter(
      (course) =>
        course.cupos_disponibles > 0 ||
        course.id === matricula?.curso_id,
    );
    if (
      matricula?.curso &&
      !options.some((item) => item.id === matricula.curso_id)
    ) {
      return [...options, matricula.curso];
    }
    return options;
  }, [coursesQuery.data, matricula]);

  function onSubmit(values: FormValues) {
    mutation.mutate({
      ...values,
      observaciones: values.observaciones.trim() || null,
    });
  }

  const optionsError = studentsQuery.error ?? coursesQuery.error;
  const optionsLoading = studentsQuery.isPending || coursesQuery.isPending;

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!mutation.isPending) onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {matricula ? "Editar matrícula" : "Nueva matrícula"}
          </DialogTitle>
          <DialogDescription>
            Las matrículas vigentes ocupan cupo. El backend vuelve a validar
            disponibilidad y relaciones al guardar.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          {(mutation.error || optionsError) && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
              {getApiErrorMessage(
                mutation.error ?? optionsError,
                "No se pudieron cargar o guardar los datos de matrícula.",
              )}
            </p>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="matricula-estudiante-search">Buscar estudiante</Label>
              <Input
                id="matricula-estudiante-search"
                placeholder="Por DNI, nombre o apellido"
                value={studentSearch}
                onChange={(event) => setStudentSearch(event.currentTarget.value)}
              />
              <Controller
                control={control}
                name="estudiante_id"
                render={({ field }) => (
                  <Select
                    value={field.value || null}
                    onValueChange={(value) => field.onChange(value ?? "")}
                  >
                    <SelectTrigger
                      id="matricula-estudiante"
                      aria-invalid={Boolean(errors.estudiante_id)}
                      onBlur={field.onBlur}
                    >
                      <SelectValue placeholder="Selecciona un estudiante" />
                    </SelectTrigger>
                    <SelectContent>
                      {studentOptions.map((student) => (
                        <SelectItem key={student.id} value={student.id}>
                          {student.dni} · {student.nombres} {student.apellidos}
                          {student.deleted_at ? " (eliminado)" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.estudiante_id && <p className="text-sm text-red-700">{errors.estudiante_id.message}</p>}
              {studentsQuery.data?.meta.totalPages &&
                studentsQuery.data.meta.totalPages > 1 && (
                  <p className="text-xs text-[#64748B]">
                    Escribe para filtrar; se muestran hasta 100 coincidencias.
                  </p>
                )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="matricula-curso-search">Buscar curso</Label>
              <Input
                id="matricula-curso-search"
                placeholder="Por código o nombre"
                value={courseSearch}
                onChange={(event) => setCourseSearch(event.currentTarget.value)}
              />
              <Controller
                control={control}
                name="curso_id"
                render={({ field }) => (
                  <Select
                    value={field.value || null}
                    onValueChange={(value) => field.onChange(value ?? "")}
                  >
                    <SelectTrigger
                      id="matricula-curso"
                      aria-invalid={Boolean(errors.curso_id)}
                      onBlur={field.onBlur}
                    >
                      <SelectValue placeholder="Selecciona un curso" />
                    </SelectTrigger>
                    <SelectContent>
                      {courseOptions.map((course) => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.codigo} · {course.nombre} ({course.cupos_disponibles} cupos)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.curso_id && <p className="text-sm text-red-700">{errors.curso_id.message}</p>}
              {coursesQuery.data?.meta.totalPages &&
                coursesQuery.data.meta.totalPages > 1 && (
                  <p className="text-xs text-[#64748B]">
                    Escribe para filtrar; se muestran cursos activos con cupos.
                  </p>
                )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="matricula-fecha">Fecha de matrícula</Label>
              <Input id="matricula-fecha" type="date" aria-invalid={Boolean(errors.fecha_matricula)} {...register("fecha_matricula")} />
              {errors.fecha_matricula && <p className="text-sm text-red-700">{errors.fecha_matricula.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="matricula-estado">Estado</Label>
              <select id="matricula-estado" className="admin-select" {...register("estado")}>
                <option value="pendiente">Pendiente</option>
                <option value="pagada">Pagada</option>
                <option value="anulada">Anulada</option>
              </select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="matricula-observaciones">Observaciones</Label>
              <textarea id="matricula-observaciones" rows={4} className="admin-textarea" {...register("observaciones")} />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" disabled={mutation.isPending} onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="admin-btn-primary" disabled={mutation.isPending || optionsLoading}>
              {mutation.isPending ? "Guardando..." : optionsLoading ? "Cargando opciones..." : "Guardar matrícula"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
