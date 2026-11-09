"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import {
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  LockKeyhole,
  Mail,
  User,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  apiErrorSchema,
  registerSchema,
  type RegisterData,
} from "@/lib/auth-schema";
import { apiClient } from "@/services/apiClient";

const inputClass =
  "h-12 rounded-xl border-slate-200 bg-[#f9fafc] pl-10 text-sm focus-visible:border-[#c39a32] focus-visible:ring-[#c39a32]/15";
const iconClass =
  "pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400";

export function RegisterForm() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
  });

  async function onSubmit(data: RegisterData) {
    setFormError(null);

    try {
      await apiClient.post("/auth/register", data);
      router.replace("/login?registered=1");
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const apiError = apiErrorSchema.safeParse(error.response?.data);
        if (apiError.success) {
          const fieldErrors = apiError.data.errors;
          for (const field of ["name", "email", "password"] as const) {
            const message = fieldErrors?.[field]?.[0];
            if (message) {
              setError(field, { type: "server", message });
            }
          }

          setFormError(
            apiError.data.message ??
              "No se pudo crear la cuenta. Revisa tus datos e inténtalo nuevamente.",
          );
          return;
        }
      }

      setFormError("No fue posible conectar con el servicio. Inténtalo nuevamente.");
    }
  }

  return (
    <AuthShell>
      <div className="mb-8">
        <p className="text-[11px] font-semibold tracking-[0.22em] text-[#a47b18]">
          BIENVENIDO A HORUS
        </p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight text-[#172b3b] sm:text-[2.1rem]">
          Crea tu cuenta
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Completa tus datos para registrarte en el sistema.
        </p>
      </div>

      {formError && (
        <div
          className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm leading-5 text-red-800"
          role="alert"
        >
          <CircleAlert aria-hidden="true" className="mt-0.5 shrink-0" size={17} />
          <span>{formError}</span>
        </div>
      )}

      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="space-y-2">
          <Label className="text-xs text-slate-700" htmlFor="name">
            Nombre completo
          </Label>
          <div className="relative">
            <User aria-hidden="true" className={iconClass} size={17} />
            <Input
              {...register("name")}
              autoComplete="name"
              autoFocus
              aria-invalid={Boolean(errors.name)}
              className={inputClass}
              id="name"
              placeholder="Tu nombre"
              type="text"
            />
          </div>
          {errors.name && (
            <p className="text-xs text-red-700">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-slate-700" htmlFor="email">
            Correo electrónico
          </Label>
          <div className="relative">
            <Mail aria-hidden="true" className={iconClass} size={17} />
            <Input
              {...register("email")}
              autoComplete="email"
              aria-invalid={Boolean(errors.email)}
              className={inputClass}
              id="email"
              placeholder="tu@correo.com"
              type="email"
            />
          </div>
          {errors.email && (
            <p className="text-xs text-red-700">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-slate-700" htmlFor="password">
            Contraseña
          </Label>
          <div className="relative">
            <LockKeyhole aria-hidden="true" className={iconClass} size={17} />
            <Input
              {...register("password")}
              autoComplete="new-password"
              aria-invalid={Boolean(errors.password)}
              className={inputClass}
              id="password"
              placeholder="Mínimo 12 caracteres"
              type="password"
            />
          </div>
          {errors.password && (
            <p className="text-xs text-red-700">{errors.password.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-slate-700" htmlFor="confirmPassword">
            Confirmar contraseña
          </Label>
          <div className="relative">
            <LockKeyhole aria-hidden="true" className={iconClass} size={17} />
            <Input
              {...register("confirmPassword")}
              autoComplete="new-password"
              aria-invalid={Boolean(errors.confirmPassword)}
              className={inputClass}
              id="confirmPassword"
              placeholder="Repite tu contraseña"
              type="password"
            />
          </div>
          {errors.confirmPassword && (
            <p className="text-xs text-red-700">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <Button
          className="mt-2 flex h-12 w-full items-center justify-between rounded-xl bg-[#0a2540] px-5 text-sm font-semibold text-white shadow-lg shadow-[#0a2540]/15 hover:bg-[#153a59]"
          disabled={isSubmitting}
          type="submit"
        >
          <span>{isSubmitting ? "Creando cuenta..." : "Crear cuenta"}</span>
          <span className="grid size-7 place-items-center rounded-full bg-[#e8bd4c] text-[#0a2540]">
            <ArrowRight aria-hidden="true" size={15} />
          </span>
        </Button>
      </form>

      <p className="mt-6 text-center text-xs text-slate-500">
        ¿Ya tienes cuenta?{" "}
        <Link
          className="font-semibold text-[#0a2540] underline-offset-4 hover:underline"
          href="/login"
        >
          Inicia sesión
        </Link>
      </p>

      <div className="mt-6 flex items-center justify-center gap-2 border-t border-slate-100 pt-4 text-[10px] text-slate-400">
        <CheckCircle2 aria-hidden="true" className="text-[#947018]" size={14} />
        <span>
          Conexión protegida <b className="px-0.5 text-[#e8bd4c]">·</b> Tus datos
          permanecen seguros
        </span>
      </div>
    </AuthShell>
  );
}
