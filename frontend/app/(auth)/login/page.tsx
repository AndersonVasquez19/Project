import type { Metadata } from "next";
import { LoginForm, type LoginNotice } from "@/components/auth/login-form";
import { safeNextPath } from "@/lib/safe-redirect";

export const metadata: Metadata = {
  title: "Iniciar sesión",
  description: "Accede a tu espacio Horus.",
};

const NOTICES = new Set<string>(["sesion", "servicio", "sin-acceso"]);

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { registered, motivo, next } = await searchParams;
  const reason = Array.isArray(motivo) ? motivo[0] : motivo;

  return (
    <LoginForm
      registered={registered === "1"}
      notice={reason && NOTICES.has(reason) ? (reason as LoginNotice) : null}
      nextPath={safeNextPath(next)}
    />
  );
}
