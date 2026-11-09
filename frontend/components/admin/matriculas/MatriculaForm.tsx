"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { FormDialog } from "@/components/admin/form-dialog";
import { FormField } from "@/components/admin/form-field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { getApiErrorMessage } from "@/lib/api-error";
import { notify } from "@/lib/toast";
import { getAll as getCursos } from "@/services/cursosService";
import { getAll as getEstudiantes } from "@/services/estudiantesService";
import { create, update } from "@/services/matriculasService";
import type { Matricula, MatriculaInput } from "@/types/matricula";

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

export function MatriculaForm({ open, onOpenChange, matricula }: Props) {
  const queryClient = useQueryClient();
  const [studentSearch, setStudentSearch] = useState("");
  const [courseSearch, setCourseSearch] = useState("");
  const debouncedStudent = useDebouncedValue(studentSearch.trim());
  const debouncedCourse = useDebouncedValue(courseSearch.trim());

  const studentsQuery = useQuery({
    queryKey: ["matricula-estudiantes", debouncedStudent],
    queryFn: () =>
      getEstudiantes({
        page: 1,
        limit: 100,
        estado: "activo",
        search: debouncedStudent || undefined,
      }),
    enabled: open,
  });
  const coursesQuery = useQuery({
    queryKey: ["matricula-cursos", debouncedCourse],
    queryFn: () =>
      getCursos({
        page: 1,
        limit: 100,
        estado: "activo",
        search: debouncedCourse || undefined,
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
      notify.success(matricula ? "Matrícula actualizada." : "Matrícula registrada.");
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
        course.cupos_disponibles > 0 || course.id === matricula?.curso_id,
    );
    if (
      matricula?.curso &&
      !options.some((item) => item.id === matricula.curso_id)
    ) {
      return [...options, matricula.curso];
    }
    return options;
  }, [coursesQuery.data, matricula]);

  const optionsError = studentsQuery.error ?? coursesQuery.error;
  const optionsLoading = studentsQuery.isPending || coursesQuery.isPending;
  const apiError = mutation.error ?? optionsError;

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={matricula ? "Editar matrícula" : "Nueva matrícula"}
      description="Las matrículas vigentes ocupan cupo. El servidor vuelve a validar disponibilidad y relaciones al guardar."
      submitLabel={optionsLoading ? "Cargando opciones..." : "Guardar matrícula"}
      className="max-h-[90vh] overflow-y-auto sm:max-w-2xl"
      pending={mutation.isPending || optionsLoading}
      error={
        apiError
          ? getApiErrorMessage(
              apiError,
              "No se pudieron cargar o guardar los datos de matrícula.",
            )
          : null
      }
      onSubmit={handleSubmit((values) =>
        mutation.mutate({
          ...values,
          observaciones: values.observaciones.trim() || null,
        }),
      )}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-3">
          <FormField label="Buscar estudiante">
            {(controlProps) => (
              <Input
                {...controlProps}
                placeholder="Por DNI, nombre o apellido"
                value={studentSearch}
                onChange={(event) => setStudentSearch(event.currentTarget.value)}
              />
            )}
          </FormField>
          <FormField label="Estudiante" required error={errors.estudiante_id?.message}>
            {(controlProps) => (
              <Controller
                control={control}
                name="estudiante_id"
                render={({ field }) => (
                  <Select
                    value={field.value || null}
                    onValueChange={(value) => field.onChange(value ?? "")}
                  >
                    <SelectTrigger {...controlProps} onBlur={field.onBlur}>
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
            )}
          </FormField>
          {studentsQuery.data && studentsQuery.data.meta.totalPages > 1 && (
            <p className="text-xs text-horus-muted">
              Escribe para filtrar; se muestran hasta 100 coincidencias.
            </p>
          )}
        </div>

        <div className="space-y-3">
          <FormField label="Buscar curso">
            {(controlProps) => (
              <Input
                {...controlProps}
                placeholder="Por código o nombre"
                value={courseSearch}
                onChange={(event) => setCourseSearch(event.currentTarget.value)}
              />
            )}
          </FormField>
          <FormField label="Curso" required error={errors.curso_id?.message}>
            {(controlProps) => (
              <Controller
                control={control}
                name="curso_id"
                render={({ field }) => (
                  <Select
                    value={field.value || null}
                    onValueChange={(value) => field.onChange(value ?? "")}
                  >
                    <SelectTrigger {...controlProps} onBlur={field.onBlur}>
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
            )}
          </FormField>
          {coursesQuery.data && coursesQuery.data.meta.totalPages > 1 && (
            <p className="text-xs text-horus-muted">
              Escribe para filtrar; se muestran cursos activos con cupos.
            </p>
          )}
        </div>

        <FormField label="Fecha de matrícula" required error={errors.fecha_matricula?.message}>
          {(controlProps) => (
            <Input type="date" {...controlProps} {...register("fecha_matricula")} />
          )}
        </FormField>
        <FormField label="Estado" error={errors.estado?.message}>
          {(controlProps) => (
            <select className="admin-select" {...controlProps} {...register("estado")}>
              <option value="pendiente">Pendiente</option>
              <option value="pagada">Pagada</option>
              <option value="anulada">Anulada</option>
            </select>
          )}
        </FormField>
        <div className="sm:col-span-2">
          <FormField label="Observaciones" error={errors.observaciones?.message}>
            {(controlProps) => (
              <textarea
                rows={4}
                className="admin-textarea"
                {...controlProps}
                {...register("observaciones")}
              />
            )}
          </FormField>
        </div>
      </div>
    </FormDialog>
  );
}
