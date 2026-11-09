"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import {
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  LockKeyhole,
  Mail,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  apiErrorSchema,
  loginSchema,
  type LoginCredentials,
} from "@/lib/auth-schema";
import { apiClient } from "@/services/apiClient";

export type LoginNotice = "sesion" | "servicio" | "sin-acceso";

const NOTICE_MESSAGES: Record<LoginNotice, string> = {
  sesion: "Tu sesión expiró o ya no es válida. Inicia sesión de nuevo.",
  servicio:
    "No fue posible verificar tu sesión. Inténtalo de nuevo en unos minutos.",
  "sin-acceso":
    "Tu cuenta aún no tiene acceso al panel. Pide a un administrador que te asigne un rol.",
};

export function LoginForm({
  registered = false,
  notice = null,
  nextPath = "/admin",
}: {
  registered?: boolean;
  notice?: LoginNotice | null;
  nextPath?: string;
}) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginCredentials>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(credentials: LoginCredentials) {
    setFormError(null);

    try {
      await apiClient.post("/auth/login", credentials);
      router.replace(nextPath);
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const apiError = apiErrorSchema.safeParse(error.response?.data);
        if (apiError.success) {
          const fieldErrors = apiError.data.errors;
          for (const field of ["email", "password"] as const) {
            const message = fieldErrors?.[field]?.[0];
            if (message) {
              setError(field, { type: "server", message });
            }
          }

          setFormError(
            apiError.data.message ??
              "No se pudo iniciar sesión. Revisa tus datos e inténtalo nuevamente.",
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
          QUÉ BUENO VERTE DE NUEVO
        </p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight text-[#172b3b] sm:text-[2.1rem]">
          Inicia sesión
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Accede a tu espacio Horus con tu correo y contraseña.
        </p>
      </div>

      {registered && (
        <div
          className="mb-5 flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-3 text-sm leading-5 text-emerald-800"
          role="status"
        >
          <CheckCircle2 aria-hidden="true" className="mt-0.5 shrink-0" size={17} />
          <span>
            Cuenta creada. Un administrador debe asignarte acceso antes de que
            puedas entrar al panel.
          </span>
        </div>
      )}

      {notice && !formError && (
        <div
          className="mb-5 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-sm leading-5 text-amber-900"
          role="status"
        >
          <CircleAlert aria-hidden="true" className="mt-0.5 shrink-0" size={17} />
          <span>{NOTICE_MESSAGES[notice]}</span>
        </div>
      )}

      {formError && (
        <div
          className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm leading-5 text-red-800"
          role="alert"
        >
          <CircleAlert aria-hidden="true" className="mt-0.5 shrink-0" size={17} />
          <span>{formError}</span>
        </div>
      )}

      <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="space-y-2">
          <Label className="text-xs text-slate-700" htmlFor="email">
            Correo electrónico
          </Label>
          <div className="relative">
            <Mail
              aria-hidden="true"
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              size={17}
            />
            <Input
              {...register("email")}
              autoComplete="username"
              autoFocus
              aria-invalid={Boolean(errors.email)}
              className="h-12 rounded-xl border-slate-200 bg-[#f9fafc] pl-10 text-sm focus-visible:border-[#c39a32] focus-visible:ring-[#c39a32]/15"
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
          <div className="flex items-center justify-between">
            <Label className="text-xs text-slate-700" htmlFor="password">
              Contraseña
            </Label>
          </div>
          <div className="relative">
            <LockKeyhole
              aria-hidden="true"
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              size={17}
            />
            <Input
              {...register("password")}
              autoComplete="current-password"
              aria-invalid={Boolean(errors.password)}
              className="h-12 rounded-xl border-slate-200 bg-[#f9fafc] pl-10 text-sm focus-visible:border-[#c39a32] focus-visible:ring-[#c39a32]/15"
              id="password"
              placeholder="Tu contraseña"
              type="password"
            />
          </div>
          {errors.password && (
            <p className="text-xs text-red-700">{errors.password.message}</p>
          )}
        </div>

        <Button
          className="mt-2 flex h-12 w-full items-center justify-between rounded-xl bg-[#0a2540] px-5 text-sm font-semibold text-white shadow-lg shadow-[#0a2540]/15 hover:bg-[#153a59]"
          disabled={isSubmitting}
          type="submit"
        >
          <span>{isSubmitting ? "Ingresando..." : "Entrar a mi cuenta"}</span>
          <span className="grid size-7 place-items-center rounded-full bg-[#e8bd4c] text-[#0a2540]">
            <ArrowRight aria-hidden="true" size={15} />
          </span>
        </Button>
      </form>

      <p className="mt-7 text-center text-xs text-slate-500">
        ¿No tienes cuenta o olvidaste tu contraseña? Contacta al administrador
        del sistema.
      </p>

      <div className="mt-7 flex items-center justify-center gap-2 border-t border-slate-100 pt-4 text-[10px] text-slate-400">
        <CheckCircle2 aria-hidden="true" className="text-[#947018]" size={14} />
        <span>
          Conexión protegida <b className="px-0.5 text-[#e8bd4c]">·</b> Tus datos
          permanecen seguros
        </span>
      </div>
    </AuthShell>
  );
}
